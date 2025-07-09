import OpenAI from "openai";

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
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
                Return a just a letter grade (A, B, C, D, F).
                A being correct compared with the correct answer. 
                B being somewhat correct with little room for improvement compared with the correct answer.
                C being neither with some room for improvement compared with the correct answer.
                D being incorrect with significant room for improvement compared with the correct answer.
                F being completely incorrect with complete room for improvement compared with the correct answer.`
            }],
            model: "deepseek-chat",
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
        console.error('Error calling DeepSeek API:', error);
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