import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { AttachmentBuilder } from 'discord.js';

dotenv.config();

const INVOKE_URL = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium";

export async function handleImageGeneration(message, prompt) {
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 5000);

  try {
    if (!prompt || prompt.trim().length === 0) {
      clearInterval(typingInterval);
      await message.reply('Kya imagine karna hai batao! 🎨\nExample: `imagine a red bird flying`');
      return;
    }

    await message.reply(`🎨 Generating image for: "${prompt}"\nThoda wait karo...`);

    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Accept": "application/json",
    };

    const payload = {
      prompt: prompt,
      cfg_scale: 5,
      aspect_ratio: "16:9",
      seed: Math.floor(Math.random() * 1000000),
      steps: 50,
      negative_prompt: "blurry, low quality, distorted, ugly"
    };

    const response = await fetch(INVOKE_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", ...headers },
      timeout: 120000
    });

    clearInterval(typingInterval);

    if (response.status !== 200) {
      const errBody = await response.text();
      console.error('Image API error response:', errBody);
      throw new Error(`API returned status ${response.status}`);
    }

    const responseBody = await response.json();
    
    // Check for base64 image in response
    if (responseBody.image) {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(responseBody.image, 'base64');
      const attachment = new AttachmentBuilder(imageBuffer, { 
        name: 'generated-image.png' 
      });
      
      await message.reply({ 
        content: `✨ Yeh lo tumhari image: "${prompt}"`,
        files: [attachment] 
      });
    } else if (responseBody.artifacts && responseBody.artifacts.length > 0) {
      // Alternative response format
      const imageBuffer = Buffer.from(responseBody.artifacts[0].base64, 'base64');
      const attachment = new AttachmentBuilder(imageBuffer, { 
        name: 'generated-image.png' 
      });
      
      await message.reply({ 
        content: `✨ Yeh lo tumhari image: "${prompt}"`,
        files: [attachment] 
      });
    } else {
      throw new Error('No image data in response');
    }

  } catch (error) {
    clearInterval(typingInterval);
    console.error('❌ Image generation error:', error);
    
    let errorMsg = 'Image generate karte time problem aaya! 😓';
    
    if (error.message.includes('timeout')) {
      errorMsg = 'Request timeout ho gaya! Simpler prompt try karo.';
    } else if (error.message.includes('429')) {
      errorMsg = 'Rate limit hit ho gaya! Thoda wait karo.';
    } else if (error.message.includes('401')) {
      errorMsg = 'API key invalid hai! Check karo .env file.';
    }
    
    await message.reply(errorMsg).catch(console.error);
  }
}