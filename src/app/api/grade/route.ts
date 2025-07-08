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
                content: `This is the question: ${card_context}. This is the correct answer: ${content}. User answer: ${userAnswer}.
                Return a single number between 1 and 100, 1 being completely incorrect and 100 being completely correct.`
            }],
            model: "deepseek-chat",
            stream: false
          });

        // Extract the response content
        const responseContent = completion.choices[0]?.message?.content;

        console.log('DeepSeek API response:', responseContent);
        
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