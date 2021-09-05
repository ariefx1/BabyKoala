import { CommandInteraction } from 'discord.js';
import BaseCommand from './base-command';
import { subscriptions } from '../music/utils';
import { MusicSubscription } from '../music/subscription';

export default class SkipCommand implements BaseCommand {
  public readonly name: string = 'skip';
  public readonly description: string = 'Skip to the next song in the queue';

  public async execute(interaction: CommandInteraction): Promise<void> {
    const subscription: MusicSubscription | undefined = subscriptions.get(interaction.guildId!);
    if (subscription) {
      // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
      // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
      // will be loaded and played.
      subscription.audioPlayer.stop();
      await interaction.reply('Skipped song!');
    } else {
      await interaction.reply('Not playing in this server!');
    }
  }
}
