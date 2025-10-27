import fs from 'fs/promises';
import path from 'path';

const MEMORY_FILE = './user_memory.json';
const MAX_MESSAGES = 5;

// Initialize memory file if not exists
async function initMemory() {
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, JSON.stringify({}));
  }
}

// Load all user memories
export async function loadMemory() {
  await initMemory();
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading memory:', error);
    return {};
  }
}

// Save all memories
async function saveAllMemory(memories) {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));
  } catch (error) {
    console.error('❌ Error saving memory:', error);
  }
}

// Get user memory
export async function getUserMemory(userId, username) {
  const memories = await loadMemory();
  if (!memories[userId]) {
    memories[userId] = {
      username: username,
      messages: []
    };
  } else {
    memories[userId].username = username; // Update username if changed
  }
  return memories[userId].messages;
}

// Save user message to memory
export async function saveMemory(userId, username, userMessage, botResponse) {
  const memories = await loadMemory();
  
  if (!memories[userId]) {
    memories[userId] = {
      username: username,
      messages: []
    };
  }

  // Add new message pair
  memories[userId].messages.push({
    user: userMessage,
    bot: botResponse,
    timestamp: new Date().toISOString()
  });

  // Keep only last 5 messages
  if (memories[userId].messages.length > MAX_MESSAGES) {
    memories[userId].messages = memories[userId].messages.slice(-MAX_MESSAGES);
  }

  await saveAllMemory(memories);
}

// Format memory for context
export function formatMemoryForContext(messages, username) {
  if (!messages || messages.length === 0) return '';
  
  let context = '\n\nOld chat for context:\n';
  messages.forEach(msg => {
    context += `${username}: ${msg.user}\n`;
    context += `yae miko: ${msg.bot}\n\n`;
  });
  
  return context;
}