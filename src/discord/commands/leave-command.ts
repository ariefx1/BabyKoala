import { CommandInteraction } from 'discord.js';
import BaseCommand from './base-command';
import { subscriptions } from '../music/utils';
import { MusicSubscription } from '../music/subscription';

export default class LeaveCommand implements BaseCommand {
  public readonly name: string = 'leave';
  public readonly description: string = 'Leave the voice channel';

  public async execute(interaction: CommandInteraction): Promise<void> {
    const subscription: MusicSubscription | undefined = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.voiceConnection.destroy();
      subscriptions.delete(interaction.guildId!);
      await interaction.reply({ content: `Left channel!`, ephemeral: true });
    } else {
      await interaction.reply('Not playing in this server!');
    }
  }
}
