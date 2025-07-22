import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

export async function POST(req: Request) {

    const { messages, chat_state, card_context } = await req.json();

    // Use streamText to stream the response from the LLM
    let result;
    if (chat_state === 'asking') {

    // Create a readable stream that follows AI SDK data stream protocol
        const stream = new ReadableStream({
            start(controller) {
            // Split the static text into chunks to simulate streaming
            const chunks = String('').split(' ');
            
            chunks.forEach((chunk) => {
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

        const userAnswer = messages[messages.length - 1].content;
        const systemPrompt = {
            role: "system" as const,
            content: `You are a helpful AI tutor.
            This is the question: ${card_context || 'No specific question provided.'}. 
            This is the user's answer: ${userAnswer || 'No specific answer provided.'}.
            Use this context to provide accurate feedback about whether the user's
            answer is correct or not.
            If the answer is wrong, repeat the WHOLE answer provide a detailed explanation of why it is wrong.
            Return the response in this format:
            Feedback:
            [Newline]
            Grade: (from 1 to 100)
            `
        };
    
        // Just send latest query
        const messagesWithContext = [systemPrompt];
    
        console.log("Messages with context", systemPrompt);
        result = streamText({
            model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
            messages: messagesWithContext,
        });
        return result.toDataStreamResponse();
    }
} 