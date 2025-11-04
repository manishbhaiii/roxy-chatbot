import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getUserMemory, saveMemory, formatMemoryForContext } from './memory.js';
import { getSystemPrompt, getCoreRule } from './config.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function handleChatMessage(message) {
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 5000);

  try {
    
    const userId = message.author.id;
    const username = message.author.username;
    
    
    const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();
    
    if (!userMessage) {
      clearInterval(typingInterval);
      await message.reply('say something');
      return;
    }

    
    const userMemory = await getUserMemory(userId, username);
    const memoryContext = formatMemoryForContext(userMemory, username);

    
    const systemPrompt = await getSystemPrompt();
    const coreRule = await getCoreRule();

    
    const fullContext = `${systemPrompt}\n\n${coreRule}${memoryContext}`;

    
    const messages = [
      { role: "system", content: fullContext },
      { role: "user", content: userMessage }
    ];

    
    const completion = await openai.chat.completions.create({
      model: "deepseek-ai/deepseek-v3.1-terminus",
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

    
    for await (const chunk of completion) {
      const reasoning = chunk.choices[0]?.delta?.reasoning_content;
      const content = chunk.choices[0]?.delta?.content || '';
      
      fullResponse += content;
      currentChunk += content;

      
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

    clearInterval(typingInterval);

    
    if (!sentMessage) {
      sentMessage = await message.reply(fullResponse || 'what ?');
    } else if (currentChunk.length > 0) {
      await sentMessage.edit(fullResponse);
    }

    
    await saveMemory(userId, username, userMessage, fullResponse);

  } catch (error) {
    clearInterval(typingInterval);
    console.error('Chat API error:', error);
    
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    
    await message.reply('Oops! something wrong in API').catch(console.error);
  }
}