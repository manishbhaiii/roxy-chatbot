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

    // Get user memory
    const userMemory = await getUserMemory(userId, username);
    const memoryContext = formatMemoryForContext(userMemory, username);

    // Get custom prompts
    const systemPrompt = await getSystemPrompt();
    const coreRule = await getCoreRule();

    // Build messages array for humanization with memory context
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

    // Call NVIDIA API for humanization
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: messages,
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
      stream: true
    });

    let fullResponse = '';
    let currentChunk = '';
    let lastSentTime = Date.now();
    let sentMessage = null;

    // Stream response
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      
      fullResponse += content;
      currentChunk += content;

      // Send chunks periodically (every 2 seconds or 500 chars)
      const now = Date.now();
      if (currentChunk.length >= 500 || (now - lastSentTime > 2000 && currentChunk.length > 0)) {
        if (!sentMessage) {
          sentMessage = await message.reply(currentChunk);
        } else {
          await sentMessage.edit(fullResponse);
        }
        currentChunk = '';
        lastSentTime = now;
      }
    }

    // Send final response if needed
    if (!sentMessage) {
      sentMessage = await message.reply(fullResponse || 'Hmm... samajh nahi aaya 🤔');
    } else if (currentChunk.length > 0) {
      await sentMessage.edit(fullResponse);
    }

    return fullResponse;

  } catch (error) {
    console.error('❌ Humanization error:', error);
    return response; 
  }
}