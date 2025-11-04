import fetch from 'node-fetch';
import { AttachmentBuilder } from 'discord.js';

const INVOKE_URL = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium";

export async function generateImage(interaction, prompt) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      await interaction.reply('Example: `/img a red bird flying`');
      return;
    }

    // Defer the reply to show "thinking" state
    await interaction.deferReply();

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

    if (response.status !== 200) {
      const errBody = await response.text();
      console.error('Image API error response:', errBody);
      throw new Error(`API returned status ${response.status}`);
    }

    const responseBody = await response.json();
    
    let imageBuffer;
    if (responseBody.image) {
      imageBuffer = Buffer.from(responseBody.image, 'base64');
    } else if (responseBody.artifacts && responseBody.artifacts.length > 0) {
      imageBuffer = Buffer.from(responseBody.artifacts[0].base64, 'base64');
    } else {
      throw new Error('No image data in response');
    }

    const attachment = new AttachmentBuilder(imageBuffer, { 
      name: 'generated-image.png' 
    });
    
    
    await interaction.editReply({ 
      content: `🎨 Generated image for: "${prompt}"`,
      files: [attachment] 
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    let errorMsg = 'Something went wrong 😓';
    
    if (error.message.includes('timeout')) {
      errorMsg = 'Request timed out. Try something simpler.';
    } else if (error.message.includes('429')) {
      errorMsg = 'Rate limit reached. Try again later.';
    } else if (error.message.includes('401')) {
      errorMsg = 'API key invalid. Check .env file.';
    }
    

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    } else {
      
      await interaction.editReply({ content: errorMsg });
    }
  }
}