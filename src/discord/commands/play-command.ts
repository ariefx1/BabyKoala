import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import BaseCommand from './base-command';
import { validateURL } from 'ytdl-core';
import {
  enqueuePlaylist,
  enqueueSearchResult,
  enqueueSong,
  initVoiceConnection,
  validatePlaylistURL,
} from '../music/utils';
import { MusicSubscription } from '../music/subscription';

export default class PlayCommand implements BaseCommand {
  public readonly name: string = 'play';
  public readonly description: string = 'Plays a song or playlist';
  public readonly options: ApplicationCommandOptionData[] = [{
    name: 'song',
    type: 'STRING' as const,
    description: 'The search term or URL of the song or playlist to play',
    required: true,
  }];

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();
      const songQuery = interaction.options.get('song')!.value! as string;
      // Join user's voice channel
      let subscription: MusicSubscription;
      try {
        // NOTE: this will instantiate MusicSubscription class when undefined
        subscription = await initVoiceConnection(interaction);
      } catch (error: any) {
        await interaction.editReply(error);
        return;
      }
      // Adds a playlist, song, or song based on search term
      if (validatePlaylistURL(songQuery)) {
        await enqueuePlaylist(interaction, subscription, songQuery);
      } else if (validateURL(songQuery)) {
        await enqueueSong(interaction, subscription, songQuery);
      } else {
        await enqueueSearchResult(interaction, subscription, songQuery);
      }
    } catch (error: any) {
      console.log(`Discord: ${error}`);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('Sorry, service is not available');
      } else {
        await interaction.reply('Sorry, service is not available');
      }
    }
  }
}
