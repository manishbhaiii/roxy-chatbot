import fs from 'fs/promises';
import path from 'path';

const MEMORY_FILE = './user_memory.json';
const MAX_MESSAGES = 5;


async function initMemory() {
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, JSON.stringify({}));
  }
}


export async function loadMemory() {
  await initMemory();
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading memory:', error);
    return {};
  }
}


async function saveAllMemory(memories) {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));
  } catch (error) {
    console.error('Error saving memory:', error);
  }
}


export async function getUserMemory(userId, username) {
  const memories = await loadMemory();
  if (!memories[userId]) {
    memories[userId] = {
      username: username,
      messages: []
    };
  } else {
    memories[userId].username = username; 
  }
  return memories[userId].messages;
}


export async function saveMemory(userId, username, userMessage, botResponse) {
  const memories = await loadMemory();
  
  if (!memories[userId]) {
    memories[userId] = {
      username: username,
      messages: []
    };
  }

  
  memories[userId].messages.push({
    user: userMessage,
    bot: botResponse,
    timestamp: new Date().toISOString()
  });

  
  if (memories[userId].messages.length > MAX_MESSAGES) {
    memories[userId].messages = memories[userId].messages.slice(-MAX_MESSAGES);
  }

  await saveAllMemory(memories);
}


export function formatMemoryForContext(messages, username) {
  if (!messages || messages.length === 0) return '';
  
  let context = '\n\nOld chat for context:\n';
  messages.forEach(msg => {
    context += `${username}: ${msg.user}\n`;
    context += `yae miko: ${msg.bot}\n\n`;
  });
  
  return context;
}