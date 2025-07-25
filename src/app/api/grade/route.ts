import OpenAI from "openai";

const deepseek = new OpenAI({
    apiKey: process.env.GROQ_API_KEY ?? '',
    baseURL: process.env.GROQ_BASE_URL ?? '',
});

export async function POST(req: Request) {
    const { messages, chat_state, card_context, content, userAnswer } = await req.json();
    console.log(userAnswer);
    try {

        // Make the non-streaming API call
        const completion = await deepseek.chat.completions.create({
            messages: [{ 
                role: "system",
                content: `This is the question: ${card_context}.
                Compare correct answer: ${content}
                with the user answer: ${userAnswer}.
                Return a JUST a letter grade (A, B, C, D, F). Do not include any other text.
                A being correct compared with the correct answer. 
                B being somewhat correct with little room for improvement compared with the correct answer.
                C being neither with some room for improvement compared with the correct answer.
                D being incorrect with significant room for improvement compared with the correct answer.
                F being completely incorrect with complete room for improvement compared with the correct answer.`
            }],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            stream: false
          });

        // Extract the response content
        const responseContent = completion.choices[0]?.message?.content;
        
        return new Response(JSON.stringify({
            message: responseContent,
            chat_state: chat_state // pass through or modify as needed
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error calling LLM API:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process request'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}