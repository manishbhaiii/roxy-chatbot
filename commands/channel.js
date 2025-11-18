import { PermissionsBitField } from 'discord.js';
import { disableChannel, enableChannel, isChannelDisabled } from '../channels.js';

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