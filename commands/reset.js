import { loadMemory } from '../memory.js';
import fs from 'fs/promises';

const MEMORY_FILE = './user_memory.json';

export async function handleResetCommand(interaction) {
  try {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // Load current memory
    const memories = await loadMemory();

    // Check if user has any memory
    if (!memories[userId] || memories[userId].messages.length === 0) {
      await interaction.reply({
        content: '❌ Tumhari koi memory nahi hai clear karne ke liye!',
        ephemeral: true
      });
      return;
    }

    // Get message count before clearing
    const messageCount = memories[userId].messages.length;

    // Clear user's memory
    delete memories[userId];

    // Save updated memory
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));

    await interaction.reply({
      content: `✅ **Memory Cleared Successfully!**\n\n` +
               `🗑️ Deleted: ${messageCount} message(s)\n` +
               `👤 User: ${username}\n\n` +
               `Ab tum fresh start kar sakte ho! 🎉`,
      ephemeral: true
    });

    console.log(`✅ Memory cleared for user: ${username} (${userId})`);

  } catch (error) {
    console.error('❌ Reset command error:', error);
    await interaction.reply({
      content: '❌ Memory clear karte time error aaya! Console check karo.',
      ephemeral: true
    }).catch(console.error);
  }
}