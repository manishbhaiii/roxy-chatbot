import { PermissionsBitField } from 'discord.js';
import { disableChannel, enableChannel, isChannelDisabled, activateChannel, deactivateChannel, isChannelActive } from '../channels.js';

export async function runDisable(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Use this in a server channel.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'Only server admins can use this.', ephemeral: true });
    return;
  }
  const already = await isChannelDisabled(interaction.channelId);
  if (already) {
    await interaction.reply({ content: 'This channel is already disabled.', ephemeral: true });
    return;
  }
  const ok = await disableChannel(interaction.channelId);
  if (ok) {
    await interaction.reply({ content: 'Disabled AI replies in this channel.', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Could not disable this channel.', ephemeral: true });
  }
}

export async function runEnable(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Use this in a server channel.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'Only server admins can use this.', ephemeral: true });
    return;
  }
  const wasDisabled = await isChannelDisabled(interaction.channelId);
  if (!wasDisabled) {
    await interaction.reply({ content: 'This channel is already enabled. Feel free to chat!', ephemeral: true });
    return;
  }
  const ok = await enableChannel(interaction.channelId);
  if (ok) {
    await interaction.reply({ content: 'Enabled AI replies in this channel.', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Could not enable this channel.', ephemeral: true });
  }
}

export async function runActive(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Use this in a server channel.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'Only server admins can use this.', ephemeral: true });
    return;
  }

  // Check if channel is disabled first
  const disabled = await isChannelDisabled(interaction.channelId);
  if (disabled) {
    await interaction.reply({ content: 'This channel is disabled. First enable it using /enable', ephemeral: true });
    return;
  }

  const alreadyActive = await isChannelActive(interaction.channelId);
  if (alreadyActive) {
    await interaction.reply({ content: 'This channel is already active. I\'m responding to all messages here!', ephemeral: true });
    return;
  }

  const ok = await activateChannel(interaction.channelId);
  if (ok) {
    await interaction.reply({ content: '✅ Channel activated! I will now respond to all messages in this channel (no mention needed).', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Could not activate this channel.', ephemeral: true });
  }
}

export async function runDeactive(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Use this in a server channel.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'Only server admins can use this.', ephemeral: true });
    return;
  }

  const wasActive = await isChannelActive(interaction.channelId);
  if (!wasActive) {
    await interaction.reply({ content: 'This channel is not active. Mention me to chat!', ephemeral: true });
    return;
  }

  const ok = await deactivateChannel(interaction.channelId);
  if (ok) {
    await interaction.reply({ content: '✅ Channel deactivated. Mention me or reply to my messages to chat.', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Could not deactivate this channel.', ephemeral: true });
  }
}