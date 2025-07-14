import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
});

export async function POST(req: Request) {
    const { messages, chat_state, card_context, content } = await req.json();

    const systemPrompt = {
        role: "system",
        content: `You are a helpful AI tutor.
        This is the question: ${card_context || 'No specific question provided.'}. 
        This is the answer: ${content || 'No specific answer provided.'}.
        Use this context to provide accurate feedback about whether the user's
        answer is correct or not.
        If the answer is wrong, repeat the WHOLE answer provide a detailed explanation of why it is wrong.
        Return the response in this format:
        Feedback:
        [Newline]
        Grade: (from 1 to 100)
        `
    };
    
    // Combine system prompt with user messages
    // const messagesWithContext = [systemPrompt, ...messages];

    // Just send latest query
    const latestUserMessage = messages?.length ? messages[messages.length - 1] : null;
    const messagesWithContext = [systemPrompt];
    if (latestUserMessage) messagesWithContext.push(latestUserMessage);

    // Use streamText to stream the response from the LLM
    var result;
    if (chat_state === 'asking') {
   // Create a readable stream that follows AI SDK data stream protocol
        const stream = new ReadableStream({
            start(controller) {
            // Split the static text into chunks to simulate streaming
            const chunks = String('').split(' ');
            
            chunks.forEach((chunk, index) => {
                // Format: 0:"text_content"\n (0 indicates text part)
                const textPart = `0:${JSON.stringify(chunk + ' ')}\n`;
                controller.enqueue(new TextEncoder().encode(textPart));
            });
            
            // Send finish message part at the end
            // Format: d:{finishReason, usage}\n
            const finishPart = `d:${JSON.stringify({
                finishReason: 'stop',
                usage: { promptTokens: 0, completionTokens: chunks.length }
            })}\n`;
            controller.enqueue(new TextEncoder().encode(finishPart));
            
            controller.close();
            }
        });

        return new Response(stream, {
            headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'x-vercel-ai-data-stream': 'v1', // Required for data stream protocol
            },
        });
    } else {
        result = streamText({
            model: deepseek('deepseek-chat'),
            messages: messagesWithContext,
        });
        return result.toDataStreamResponse();
    }
} 