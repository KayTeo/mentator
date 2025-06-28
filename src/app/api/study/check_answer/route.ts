import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: process.env.DEEPSEEK_BASE_URL ?? '',
});

export async function POST(req: Request) {
    const { question, userAnswer, expectedAnswer } = await req.json();

    if (!question || !userAnswer || !expectedAnswer) {
        return new Response(JSON.stringify({ error: 'Question, user answer, and expected answer are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Create system prompt for answer checking
    const systemPrompt = {
        role: "system" as const,
        content: `You are an AI tutor evaluating a student's answer. Your task is to:
1. Compare the student's answer with the expected answer
2. Determine if the answer is correct, partially correct, or incorrect
3. Provide constructive feedback explaining why the answer is right or wrong
4. Give a brief explanation of the correct concept if needed

Be encouraging and educational in your response. Focus on helping the student learn.`
    };

    // Create the user message with the question and answers
    const userMessage = {
        role: "user" as const,
        content: `Question: ${question}

Expected Answer: ${expectedAnswer}

Student's Answer: ${userAnswer}

Please evaluate this answer and provide feedback.`
    };

    // Use streamText to stream the response from the LLM
    const result = streamText({
        model: deepseek('deepseek-chat'),
        messages: [systemPrompt, userMessage],
    });
    
    return result.toDataStreamResponse();
} 