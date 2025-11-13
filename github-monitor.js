import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_REPO = 'manishbhaiii/roxy-chatbot';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
const MONITOR_INTERVAL = 60 * 60 * 1000; 

let lastCommitSha = null;
let isMonitoring = false;


async function getLatestCommit() {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/commits`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'roxy-chatbot'
      }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0]; 
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching GitHub commits:', error.message);
    return null;
  }
}


async function checkForUpdates(client) {
  try {
    const latestCommit = await getLatestCommit();
    
    if (!latestCommit) {
      console.log('⚠️ Could not fetch latest commit from GitHub');
      return;
    }

    const currentSha = latestCommit.sha;

    
    if (lastCommitSha === null) {
      lastCommitSha = currentSha;
      console.log('✅ GitHub monitoring initialized');
      return;
    }

    
    if (currentSha !== lastCommitSha) {
      lastCommitSha = currentSha;
      await notifyOwner(client, latestCommit);
    }
  } catch (error) {
    console.error('❌ Error checking for updates:', error.message);
  }
}


async function notifyOwner(client, commit) {
  try {
    const owner = await client.users.fetch(process.env.OWNER_ID);
    
    if (!owner) {
      console.error('❌ Could not find bot owner');
      return;
    }

    
    const embed = new EmbedBuilder()
      .setColor('#1f6feb')
      .setTitle('🚀 New Update Available')
      .setDescription(`New changes detected in the GitHub repository!`)
      .addFields(
        {
          name: '📝 Commit Message',
          value: commit.commit.message || 'No message',
          inline: false
        },
        {
          name: '👤 Author',
          value: commit.commit.author.name || 'Unknown',
          inline: true
        },
        {
          name: '🕐 Date',
          value: new Date(commit.commit.author.date).toLocaleString(),
          inline: true
        },
        {
          name: '🔗 Commit SHA',
          value: `\`${commit.sha.substring(0, 7)}\``,
          inline: true
        },
        {
          name: '📦 Repository',
          value: `[${GITHUB_REPO}](https://github.com/${GITHUB_REPO})`,
          inline: false
        }
      )
      .setFooter({
        text: 'Please update the bot at your earliest convenience!',
        iconURL: 'https://github.githubassets.com/favicons/favicon.png'
      })
      .setTimestamp();

    
    await owner.send({
      embeds: [embed]
    });

    console.log(`✅ Owner notified about new update (${commit.sha.substring(0, 7)})`);
  } catch (error) {
    console.error('❌ Error notifying owner:', error.message);
  }
}


export function startGitHubMonitoring(client) {
  if (isMonitoring) {
    console.log('⚠️ GitHub monitoring already running');
    return;
  }

  isMonitoring = true;
  console.log('🔍 Starting GitHub monitoring system...');
  
  
  checkForUpdates(client);
  
  
  setInterval(() => {
    checkForUpdates(client);
  }, MONITOR_INTERVAL);
}


export function stopGitHubMonitoring() {
  isMonitoring = false;
  console.log('⏹️ GitHub monitoring stopped');
}


export function getMonitoringStatus() {
  return {
    isMonitoring,
    lastCommitSha,
    repository: GITHUB_REPO,
    checkInterval: `${MONITOR_INTERVAL / 1000 / 60} minutes`
  };
}