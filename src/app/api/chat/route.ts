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

            Context:
            - Question: ${card_context || 'No specific question provided.'}
            - User's Answer: ${userAnswer || 'No specific answer provided.'}

            Instructions:
            1. Evaluate if the user's answer is correct or incorrect.
            2. If the answer is correct:
            - Give positive feedback and briefly explain why it is correct.
            3. If the answer is incorrect:
            - Repeat the user's answer.
            - Clearly explain why it is incorrect.
            - Provide the correct answer or guidance.
            4. Always return your response in the following format:

            Feedback:
            [Your feedback here]

            Grade: [A, B, C, D, E, or F]

            Example:
            Feedback:
            Your answer was close, but you missed the key point about X. The correct answer is Y.

            Grade: C
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