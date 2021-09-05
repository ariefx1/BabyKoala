import { CommandInteraction } from 'discord.js';
import BaseCommand from './base-command';
import { subscriptions } from '../music/utils';
import { MusicSubscription } from '../music/subscription';

export default class ResumeCommand implements BaseCommand {
  public readonly name: string = 'resume';
  public readonly description: string = 'Resume playback of the current song';

  public async execute(interaction: CommandInteraction): Promise<void> {
    const subscription: MusicSubscription | undefined = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.audioPlayer.unpause();
      await interaction.reply({ content: `Unpaused!`, ephemeral: true });
    } else {
      await interaction.reply('Not playing in this server!');
    }
  }
}
