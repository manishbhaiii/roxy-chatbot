import { ActivityType } from 'discord.js';

export async function setStatus(interaction, client, status, message) {
    try {
        // Convert status string to presence status
        let presenceStatus;
        switch (status.toLowerCase()) {
            case 'online':
                presenceStatus = 'online';
                break;
            case 'dnd':
                presenceStatus = 'dnd';
                break;
            case 'idle':
                presenceStatus = 'idle';
                break;
            default:
                await interaction.reply({
                    content: '❌ Invalid status! Use `online`, `dnd`, or `idle`',
                    ephemeral: true
                });
                return;
        }

        // Set the bot's status
        await client.user.setPresence({
            activities: message ? [{ 
                name: message,
                type: ActivityType.Custom
            }] : [],
            status: presenceStatus
        });

        // Format status for display
        const statusEmoji = {
            'online': '🟢',
            'dnd': '🔴',
            'idle': '🌙'
        };

        await interaction.reply({
            content: `✅ Status updated!\n${statusEmoji[presenceStatus]} **Status:** ${presenceStatus}${message ? `\n💭 **Message:** ${message}` : ''}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Status update error:', error);
        await interaction.reply({
            content: '❌ Failed to update status! Please try again.',
            ephemeral: true
        });
    }
}