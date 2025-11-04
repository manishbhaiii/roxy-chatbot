import { updateCoreRule, getCoreRule } from '../config.js';

const awaitingInput = new Map();

export async function handleCoreRule(message) {
  try {

    if (message.content.trim() === '/corerule') {
      const currentRule = await getCoreRule();
      
      await message.reply(
        `⚙️ **Core Rule Update**\n\n` +
        `**Current rule:**\n\`\`\`${currentRule}\`\`\`\n\n` +
        `add core rule:`
      );
      
      
      awaitingInput.set(message.author.id, {
        channelId: message.channel.id,
        timestamp: Date.now()
      });
      
      
      setTimeout(() => {
        if (awaitingInput.has(message.author.id)) {
          awaitingInput.delete(message.author.id);
          message.channel.send(`⏰ Core rule update expired.`).catch(console.error);
        }
      }, 120000);
      
      return;
    }

    
    const waitingData = awaitingInput.get(message.author.id);
    if (waitingData && waitingData.channelId === message.channel.id) {
      const newRule = message.content.trim();
      
      if (newRule.length < 10) {
        await message.reply('too smol (minimum 10 characters)');
        return;
      }

      if (newRule.length > 1000) {
        await message.reply('too big (maximum 1000 characters)');
        return;
      }

      
      const success = await updateCoreRule(newRule);
      
      if (success) {
        await message.reply(
          `✅ **Core Rule Updated Successfully!**\n\n` +
          `**New rule:**\n\`\`\`${newRule}\`\`\`\n\n` 
          
        );
      } else {
        await message.reply('check Console');
      }
      
      
      awaitingInput.delete(message.author.id);
    }
    
  } catch (error) {
    console.error('Core rule command error:', error);
    await message.reply('wait a sec.').catch(console.error);
  }
}


export function isAwaitingCoreRule(userId, channelId) {
  const data = awaitingInput.get(userId);
  return data && data.channelId === channelId;
}