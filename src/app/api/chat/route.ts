import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
  });

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Add a system prompt/context at the beginning
    const systemPrompt = {
        role: "system",
        content: "You are a helpful assistant. Answer as concisely as possible."
    };

    // Prepend the system prompt to the messages array
    const messagesWithContext = [systemPrompt, ...messages];

    // Use streamText to stream the response from the LLM
    const result = streamText({
        model: deepseek('deepseek-chat'),
        messages: messagesWithContext,
    });
    return result.toDataStreamResponse();
} 