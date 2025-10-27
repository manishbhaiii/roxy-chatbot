import { updateCoreRule, getCoreRule } from '../config.js';

const awaitingInput = new Map();

export async function handleCoreRule(message) {
  try {
    // If command just typed, ask for input
    if (message.content.trim() === '/corerule') {
      const currentRule = await getCoreRule();
      
      await message.reply(
        `⚙️ **Core Rule Update**\n\n` +
        `**Current rule:**\n\`\`\`${currentRule}\`\`\`\n\n` +
        `Ab naya core rule enter karo (next message me):`
      );
      
      // Mark this user as awaiting input
      awaitingInput.set(message.author.id, {
        channelId: message.channel.id,
        timestamp: Date.now()
      });
      
      // Auto-expire after 2 minutes
      setTimeout(() => {
        if (awaitingInput.has(message.author.id)) {
          awaitingInput.delete(message.author.id);
          message.channel.send(`⏰ Core rule update expired. Dubara \`/corerule\` use karo.`).catch(console.error);
        }
      }, 120000);
      
      return;
    }

    // Check if user is awaiting input
    const waitingData = awaitingInput.get(message.author.id);
    if (waitingData && waitingData.channelId === message.channel.id) {
      const newRule = message.content.trim();
      
      if (newRule.length < 10) {
        await message.reply('❌ Core rule thoda bada hona chahiye! (minimum 10 characters)');
        return;
      }

      if (newRule.length > 1000) {
        await message.reply('❌ Core rule bahut bada hai! (maximum 1000 characters)');
        return;
      }

      // Update the core rule
      const success = await updateCoreRule(newRule);
      
      if (success) {
        await message.reply(
          `✅ **Core Rule Updated Successfully!**\n\n` +
          `**New rule:**\n\`\`\`${newRule}\`\`\`\n\n` +
          `Ab bot in rules ko follow karega! 📜`
        );
      } else {
        await message.reply('❌ Error aaya rule save karte time! Console check karo.');
      }
      
      // Remove from waiting list
      awaitingInput.delete(message.author.id);
    }
    
  } catch (error) {
    console.error('❌ Core rule command error:', error);
    await message.reply('❌ Kuch galat ho gaya! Error check karo console me.').catch(console.error);
  }
}

// Export for external checks
export function isAwaitingCoreRule(userId, channelId) {
  const data = awaitingInput.get(userId);
  return data && data.channelId === channelId;
}