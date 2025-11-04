import { loadMemory } from '../memory.js';
import fs from 'fs/promises';

const MEMORY_FILE = './user_memory.json';


async function saveAllMemory(memories) {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving memory:', error);
    return false;
  }
}


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
    return true; 
  } catch (error) {
    console.error('❌ Error resetting memory:', error);
    return false;
  }
}


export async function forceClearMemory(targetUserId) {
  try {
    const memories = await loadMemory();
    if (memories[targetUserId]) {
      const username = memories[targetUserId].username;
      memories[targetUserId] = {
        username: username,
        messages: []
      };
      const success = await saveAllMemory(memories);
      return success;
    }
    return true; 
  } catch (error) {
    console.error('idk what is going on', error);
    return false;
  }
}