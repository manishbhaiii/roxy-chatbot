import axios from 'axios';
import dotenv from 'dotenv';
import { saveMemory } from './memory.js';
import { getSystemPrompt, getCoreRule } from './config.js';
import { humanizeResponse } from './humanize.js';

dotenv.config();

const INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function handleVisionMessage(message) {
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 5000);

  try {
    
    const userId = message.author.id;
    const username = message.author.username;
    
    
    const attachment = message.attachments.first();
    if (!attachment || !attachment.contentType?.startsWith('image/')) {
      clearInterval(typingInterval);
      await message.reply(' 🖼️');
      return;
    }

    const imageUrl = attachment.url;
    
    
    const textContent = message.content.replace(/<@!?\d+>/g, '').trim();
    const userMessage = textContent || "Describe this image";

    
    let systemPrompt, coreRule;
    try {
      systemPrompt = await getSystemPrompt();
      coreRule = await getCoreRule();
    } catch (error) {
      clearInterval(typingInterval);
      await message.reply('Bot is not configured yet. Ask the owner to set up system prompt and core rules using /systemprompt and /corerule commands.');
      return;
    }

    
    const visionContext = `${systemPrompt}\n\n${coreRule}\nFocus on describing what you see in the image.`;

    
    const messages = [
      { role: "system", content: visionContext },
      { 
        role: "user", 
        content: [
          { type: "text", text: userMessage || "Describe this image" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ];

    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Accept": "application/json"
    };

    const payload = {
      model: "meta/llama-3.2-90b-vision-instruct",
      messages: messages,
      max_tokens: 512,
      temperature: 1.00,
      top_p: 1.00,
      frequency_penalty: 0.00,
      presence_penalty: 0.00,
      stream: false
    };

    const response = await axios.post(INVOKE_URL, payload, { 
      headers: headers,
      timeout: 60000 
    });

    clearInterval(typingInterval);

    const visionResponse = response.data.choices[0]?.message?.content || 'i can\'t see the image 😅';
    
     
    const humanizedResponse = await humanizeResponse(visionResponse, message);

    
    await saveMemory(userId, username, `[Image] ${userMessage}`, humanizedResponse);

  } catch (error) {
    clearInterval(typingInterval);
    console.error('Vision API error:', error);
    
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    
    let errorMsg = 'problem in Vision API !';
    if (error.code === 'ECONNABORTED') {
      errorMsg = 'damnn';
    }
    
    await message.reply(errorMsg).catch(console.error);
  }
}