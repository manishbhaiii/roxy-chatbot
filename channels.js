import fs from 'fs/promises';

const DISABLED_FILE = './disabled_channels.json';

async function initDisabled() {
  try {
    await fs.access(DISABLED_FILE);
  } catch {
    await fs.writeFile(DISABLED_FILE, JSON.stringify([], null, 2));
  }
}

async function loadDisabled() {
  await initDisabled();
  try {
    const data = await fs.readFile(DISABLED_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveDisabled(list) {
  await fs.writeFile(DISABLED_FILE, JSON.stringify(list, null, 2));
}

export async function isChannelDisabled(channelId) {
  const list = await loadDisabled();
  return list.includes(channelId);
}

export async function disableChannel(channelId) {
  const list = await loadDisabled();
  if (!list.includes(channelId)) {
    list.push(channelId);
    await saveDisabled(list);
    return true;
  }
  return false;
}

export async function enableChannel(channelId) {
  const list = await loadDisabled();
  const idx = list.indexOf(channelId);
  if (idx !== -1) {
    list.splice(idx, 1);
    await saveDisabled(list);
    return true;
  }
  return false;
}

// Active channels management
const ACTIVE_FILE = './active_channels.json';

async function initActive() {
  try {
    await fs.access(ACTIVE_FILE);
  } catch {
    await fs.writeFile(ACTIVE_FILE, JSON.stringify([], null, 2));
  }
}

async function loadActive() {
  await initActive();
  try {
    const data = await fs.readFile(ACTIVE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveActive(list) {
  await fs.writeFile(ACTIVE_FILE, JSON.stringify(list, null, 2));
}

export async function isChannelActive(channelId) {
  const list = await loadActive();
  return list.includes(channelId);
}

export async function activateChannel(channelId) {
  const list = await loadActive();
  if (!list.includes(channelId)) {
    list.push(channelId);
    await saveActive(list);
    return true;
  }
  return false;
}

export async function deactivateChannel(channelId) {
  const list = await loadActive();
  const idx = list.indexOf(channelId);
  if (idx !== -1) {
    list.splice(idx, 1);
    await saveActive(list);
    return true;
  }
  return false;
}