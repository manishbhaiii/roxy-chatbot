import fs from 'fs/promises';

const CONFIG_FILE = './bot_config.json';

// Default configuration (empty to force setup via commands)
const DEFAULT_CONFIG = {
  systemPrompt: "",
  coreRule: ""
};


async function initConfig() {
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}


async function loadConfig() {
  await initConfig();
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}


async function saveConfig(config) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}


export async function getSystemPrompt() {
  const config = await loadConfig();
  if (!config.systemPrompt) {
    throw new Error('System prompt not set. Please use /systemprompt to set it.');
  }
  return config.systemPrompt;
}


export async function updateSystemPrompt(newPrompt) {
  const config = await loadConfig();
  config.systemPrompt = newPrompt;
  return await saveConfig(config);
}


export async function getCoreRule() {
  const config = await loadConfig();
  if (!config.coreRule) {
    throw new Error('Core rule not set. Please use /corerule to set it.');
  }
  return config.coreRule;
}


export async function updateCoreRule(newRule) {
  const config = await loadConfig();
  config.coreRule = newRule;
  return await saveConfig(config);
}