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
    // Get user info
    const userId = message.author.id;
    const username = message.author.username;
    
    // Clean message content
    const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();
    
    if (!userMessage) {
      clearInterval(typingInterval);
      await message.reply('Kuch bolo yaar! 😅');
      return;
    }

    // Get user memory
    const userMemory = await getUserMemory(userId, username);
    const memoryContext = formatMemoryForContext(userMemory, username);

    // Get custom prompts
    const systemPrompt = await getSystemPrompt();
    const coreRule = await getCoreRule();

    // Build full context
    const fullContext = `${systemPrompt}\n\n${coreRule}${memoryContext}`;

    // Create messages array
    const messages = [
      { role: "system", content: fullContext },
      { role: "user", content: userMessage }
    ];

    // Call NVIDIA API
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
      const reasoning = chunk.choices[0]?.delta?.reasoning_content;
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

    clearInterval(typingInterval);

    // Send final response
    if (!sentMessage) {
      sentMessage = await message.reply(fullResponse || 'Hmm... samajh nahi aaya 🤔');
    } else if (currentChunk.length > 0) {
      await sentMessage.edit(fullResponse);
    }

    // Save to memory
    await saveMemory(userId, username, userMessage, fullResponse);

  } catch (error) {
    clearInterval(typingInterval);
    console.error('❌ Chat API error:', error);
    
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    
    await message.reply('Oops! API me kuch problem hai. Check karo API key sahi hai ya nahi! 😓').catch(console.error);
  }
}