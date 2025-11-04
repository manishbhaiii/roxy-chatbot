import { Client, GatewayIntentBits, Events, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { handleChatMessage } from './chatapi.js';
import { handleVisionMessage } from './visionapi.js';
import { handleImageGeneration } from './imageapi.js';
import { updateSystemPrompt, updateCoreRule, getSystemPrompt, getCoreRule } from './config.js';
import { resetMemory, forceClearMemory } from './commands/memoryclear.js';
import { generateImage } from './commands/img.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});


const commands = [
  new SlashCommandBuilder()
    .setName('systemprompt')
    .setDescription('Update bot system prompt (Owner only)')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('New system prompt')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('corerule')
    .setDescription('Update bot core rules (Owner only)')
    .addStringOption(option =>
      option.setName('rule')
        .setDescription('New core rule')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('viewconfig')
    .setDescription('View current bot configuration (Owner only)'),
  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset your chat memory with the bot'),
  new SlashCommandBuilder()
    .setName('forceclear')
    .setDescription('Force clear a user\'s chat memory (Owner only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User whose memory to clear')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('img')
    .setDescription('Generate an AI image')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('What image would you like to generate?')
        .setRequired(true)
    )
].map(command => command.toJSON());


async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('Registering slash commands...');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot ready! Logged in as ${c.user.tag}`);
  await registerCommands();
  
 
  try {
    await getSystemPrompt();
    await getCoreRule();
  } catch (error) {
    console.warn('⚠️ Warning:', error.message);
    console.log('Please use /systemprompt and /corerule commands to set up the bot.');
  }
});


client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    
    if (['systemprompt', 'corerule', 'viewconfig', 'forceclear'].includes(interaction.commandName)) {
      if (interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({ 
          content: 'Only bot owner can use this command!', 
          ephemeral: true 
        });
        return;
      }
    }

    if (interaction.commandName === 'systemprompt') {
      const newPrompt = interaction.options.getString('prompt');
      
      if (newPrompt.length < 10) {
        await interaction.reply({ 
          content: 'make system prompt big (minimum 10 characters)', 
          ephemeral: true 
        });
        return;
      }

      if (newPrompt.length > 2000) {
        await interaction.reply({ 
          content: 'System prompt is very big (maximum 2000 characters)', 
          ephemeral: true 
        });
        return;
      }

      const success = await updateSystemPrompt(newPrompt);
      
      if (success) {
        await interaction.reply({
          content: `✅ **System Prompt Updated!**\n\n\`\`\`${newPrompt}\`\`\`\n\nThe bot will now reply with this personality!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: 'Error saving prompt! check Console.', 
          ephemeral: true 
        });
      }
    }
    
    else if (interaction.commandName === 'corerule') {
      const newRule = interaction.options.getString('rule');
      
      if (newRule.length < 10) {
        await interaction.reply({ 
          content: 'minimum 10 characters', 
          ephemeral: true 
        });
        return;
      }

      if (newRule.length > 1000) {
        await interaction.reply({ 
          content: 'maximum 1000 characters', 
          ephemeral: true 
        });
        return;
      }

      const success = await updateCoreRule(newRule);
      
      if (success) {
        await interaction.reply({
          content: `✅ **Core Rule Updated!**\n\n\`\`\`${newRule}\`\`\`\n\nThe bot will now follow these rules!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: 'Error saving rule! check Console.', 
          ephemeral: true 
        });
      }
    }
    
    else if (interaction.commandName === 'viewconfig') {
      const systemPrompt = await getSystemPrompt();
      const coreRule = await getCoreRule();
      
      await interaction.reply({
        content: `📋 **Current Bot Configuration**\n\n**System Prompt:**\n\`\`\`${systemPrompt}\`\`\`\n\n**Core Rule:**\n\`\`\`${coreRule}\`\`\``,
        ephemeral: true
      });
    }
    
    else if (interaction.commandName === 'reset') {
      const success = await resetMemory(interaction.user.id, interaction.user.username);
      
      if (success) {
        await interaction.reply({
          content: '✅ Your chat memory has been reset! Starting fresh...',
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: 'idk how to do that',
          ephemeral: true 
        });
      }
    }
    
    else if (interaction.commandName === 'forceclear') {
      const targetUser = interaction.options.getUser('user');
      const success = await forceClearMemory(targetUser.id);
      
      if (success) {
        await interaction.reply({
          content: `✅ Chat memory for user ${targetUser.username} has been cleared!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: '❌ Error clearing memory! Please try again later.',
          ephemeral: true 
        });
      }
    }

    else if (interaction.commandName === 'img') {
      const prompt = interaction.options.getString('prompt');
      await generateImage(interaction, prompt);
    }
    
  } catch (error) {
    console.error('Slash command error:', error);
    await interaction.reply({ 
      content: 'something wrong 😓', 
      ephemeral: true 
    }).catch(console.error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    
    if (message.author.bot) return;

    const botMentioned = message.mentions.has(client.user) || 
                        message.reference?.messageId;
    
   
    if (message.reference?.messageId) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.author.id !== client.user.id) {
        return; 
      }
    }

    
    if (botMentioned) {
      const hasImage = message.attachments.size > 0;
      const hasText = message.content.replace(/<@!?\d+>/g, '').trim().length > 0;
      
     
      const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
      if (cleanContent.toLowerCase().startsWith('img ')) {
        const prompt = cleanContent.substring(8).trim();
        await handleImageGeneration(message, prompt);
        return;
      }

      // Handle image + text (vision)
      if (hasImage) {
        await handleVisionMessage(message);
        return;
      }

      // Handle text only (chat)
      if (hasText) {
        await handleChatMessage(message);
        return;
      }
    }
  } catch (error) {
    console.error('❌ Error in message handler:', error);
    try {
      await message.reply('Sorry, kuch error aa gaya. Thoda baad me try karo! 😅');
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
});

client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});