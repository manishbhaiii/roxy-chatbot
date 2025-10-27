import { loadMemory } from '../memory.js';
import fs from 'fs/promises';

const MEMORY_FILE = './user_memory.json';

// Function to save memory after changes
async function saveAllMemory(memories) {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving memory:', error);
    return false;
  }
}

// Reset command to clear user's own memory
export async function resetMemory(userId, username) {
  try {
    const memories = await loadMemory();
    if (memories[userId]) {
      memories[userId] = {
        username: username,
        messages: []
      };
      const success = await saveAllMemory(memories);
      return success;
    }
    return true; // If user has no memory, consider it success
  } catch (error) {
    console.error('❌ Error resetting memory:', error);
    return false;
  }
}

// Force clear command to clear any user's memory (owner only)
export async function forceClearMemory(targetUserId) {
  try {
    const memories = await loadMemory();
    if (memories[targetUserId]) {
      const username = memories[targetUserId].username; // Keep the username
      memories[targetUserId] = {
        username: username,
        messages: []
      };
      const success = await saveAllMemory(memories);
      return success;
    }
    return true; // If user has no memory, consider it success
  } catch (error) {
    console.error('❌ Error force clearing memory:', error);
    return false;
  }
}