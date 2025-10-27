import { loadMemory } from '../memory.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const MEMORY_FILE = './user_memory.json';

export async function handleForceClearCommand(interaction) {
  try {
    // Check if user is owner
    if (interaction.user.id !== process.env.OWNER_ID) {
      await interaction.reply({
        content: '❌ Only bot owner can use this command!',
        ephemeral: true
      });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    
    if (!targetUser) {
      await interaction.reply({
        content: '❌ User not found! Make sure you mention/select a valid user.',
        ephemeral: true
      });
      return;
    }

    const targetUserId = targetUser.id;
    const targetUsername = targetUser.username;

    // Load current memory
    const memories = await loadMemory();

    // Check if target user has any memory
    if (!memories[targetUserId] || memories[targetUserId].messages.length === 0) {
      await interaction.reply({
        content: `❌ User **${targetUsername}** ki koi memory nahi hai clear karne ke liye!`,
        ephemeral: true
      });
      return;
    }

    // Get message count before clearing
    const messageCount = memories[targetUserId].messages.length;

    // Clear target user's memory
    delete memories[targetUserId];

    // Save updated memory
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));

    await interaction.reply({
      content: `✅ **Force Clear Successful!**\n\n` +
               `🗑️ Deleted: ${messageCount} message(s)\n` +
               `👤 User: ${targetUsername} (${targetUserId})\n` +
               `🔨 Cleared by: ${interaction.user.username} (Owner)\n\n` +
               `Memory successfully wiped! 🧹`,
      ephemeral: true
    });

    console.log(`✅ Force cleared memory for: ${targetUsername} (${targetUserId}) by owner`);

  } catch (error) {
    console.error('❌ Force clear command error:', error);
    await interaction.reply({
      content: '❌ Memory clear karte time error aaya! Console check karo.',
      ephemeral: true
    }).catch