import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
  });

export async function POST(req: Request) {
    console.log("Received request");
    const { messages } = await req.json();
    // Use streamText to stream the response from the LLM
    const result = streamText({
        model: deepseek('deepseek-chat'),
        messages,
    });
    return result.toDataStreamResponse();
} 