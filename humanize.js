import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getSystemPrompt, getCoreRule } from './config.js';
import { getUserMemory, formatMemoryForContext } from './memory.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function humanizeResponse(response, message) {
  try {
   
    const userId = message.author.id;
    const username = message.author.username;

    
    const userMemory = await getUserMemory(userId, username);
    const memoryContext = formatMemoryForContext(userMemory, username);

    
    let systemPrompt, coreRule;
    try {
      systemPrompt = await getSystemPrompt();
      coreRule = await getCoreRule();
    } catch (error) {
      console.error('Humanization failed - bot not configured:', error);
      return response; 
    }

    
    const messages = [
      { 
        role: "system", 
        content: `${systemPrompt}\n\n${coreRule}${memoryContext}\n\nYou are humanizing an AI's description of an image. Make it more natural and conversational while keeping the key information. Use the chat history context to maintain consistent personality and reference previous conversations if relevant.` 
      },
      { 
        role: "user", 
        content: `Please humanize this image description in a conversational way that matches our previous chat style:\n${response}` 
      }
    ];

    
    const completion = await openai.chat.completions.create({
      model: "deepseek-ai/deepseek-v3.1-terminus",
      messages: messages,
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
      stream: false
    });

    const fullResponse = completion.choices?.[0]?.message?.content || '🤔';

    return fullResponse;

  } catch (error) {
    console.error('Humanization error:', error);
    return response; 
  }
}