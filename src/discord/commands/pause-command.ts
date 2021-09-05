import { CommandInteraction } from 'discord.js';
import BaseCommand from './base-command';
import { subscriptions } from '../music/utils';
import { MusicSubscription } from '../music/subscription';

export default class PauseCommand implements BaseCommand {
  public readonly name: string = 'pause';
  public readonly description: string = 'Pauses the song that is currently playing';

  public async execute(interaction: CommandInteraction): Promise<void> {
    const subscription: MusicSubscription | undefined = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.audioPlayer.pause();
      await interaction.reply({ content: `Paused!`, ephemeral: true });
    } else {
      await interaction.reply('Not playing in this server!');
    }
  }
}
