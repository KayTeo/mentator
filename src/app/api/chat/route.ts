import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
  });

export async function POST(req: Request) {
    const { messages, chat_state, card_context, content } = await req.json();

    var systemPrompt = {
        role: "system",
        content: `You are a helpful AI tutor. You have access to the following study material context: ${card_context || 'No specific context provided.'} Use this context to provide accurate and helpful responses to the user's questions. Be encouraging and educational in your responses.`
    };
    // Combine system prompt with user messages
    const messagesWithContext = [systemPrompt, ...messages];

    // Use streamText to stream the response from the LLM
    var result;

    if (chat_state === 'asking') {
        return Response.json({
            choices: [{
              message: {
                role: 'assistant',
                content: 'Your fixed string here'
              }
            }]
          });
    } else {
        result = streamText({
            model: deepseek('deepseek-chat'),
            messages: messagesWithContext,
        });
        return result.toDataStreamResponse();
    }


} 