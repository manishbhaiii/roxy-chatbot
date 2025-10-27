import fs from 'fs/promises';

const CONFIG_FILE = './bot_config.json';

// Default configuration
const DEFAULT_CONFIG = {
  systemPrompt: "You are Yae Miko, you are a girl, you live in Japan, your age is 19, you like anime.",
  coreRule: "Core rule: You must reply like a human, you must reply short, never say I am a robot/AI etc."
};

// Initialize config file
async function initConfig() {
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

// Load config
async function loadConfig() {
  await initConfig();
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

// Save config
async function saveConfig(config) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving config:', error);
    return false;
  }
}

// Get system prompt
export async function getSystemPrompt() {
  const config = await loadConfig();
  return config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
}

// Update system prompt
export async function updateSystemPrompt(newPrompt) {
  const config = await loadConfig();
  config.systemPrompt = newPrompt;
  return await saveConfig(config);
}

// Get core rule
export async function getCoreRule() {
  const config = await loadConfig();
  return config.coreRule || DEFAULT_CONFIG.coreRule;
}

// Update core rule
export async function updateCoreRule(newRule) {
  const config = await loadConfig();
  config.coreRule = newRule;
  return await saveConfig(config);
}