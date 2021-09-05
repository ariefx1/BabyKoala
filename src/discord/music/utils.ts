import { joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { CommandInteraction, GuildMember, Snowflake } from "discord.js";
import { PlaylistMetadataResult, search, PlaylistItem } from "yt-search";
import { MusicSubscription } from "./subscription";
import { Track } from "./track";

// #region Subscriptions

const _subscriptions = new Map<Snowflake, MusicSubscription>();
export const subscriptions = _subscriptions;

// #endregion Subscriptions

// #region Queue

export const initVoiceConnection = async (
  interaction: CommandInteraction,
): Promise<MusicSubscription> => {
  let subscription: MusicSubscription | undefined = _subscriptions.get(interaction.guildId!);

  // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
  // and create a subscription.
  if (!subscription) {
    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
      const channel = interaction.member.voice.channel;
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        }),
      );
      subscription.voiceConnection.on('error', console.warn);
      subscriptions.set(interaction.guildId!, subscription);
    }
  }

  // If there is no subscription, tell the user they need to join a channel.
  if (!subscription) {
    throw 'Join a voice channel and then try that again!';
  }

  // Make sure the connection is ready before processing the user's request
  try {
    await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
  } catch (error) {
    console.warn(error);
    throw 'Failed to join voice channel within 20 seconds, please try again later!';
  }

  return subscription;
};

export const enqueue = async (
  interaction: CommandInteraction,
  subscription: MusicSubscription,
  url: string,
): Promise<string> => {
  // Attempt to create a Track from the user's video URL
  const track = await Track.from(url, {
    onStart() {
      interaction.followUp({ content: 'Now playing!', ephemeral: true }).catch(console.warn);
    },
    onFinish() {
      interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn);
    },
    onError(error) {
      console.warn(error);
      interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
    },
  });
  // Enqueue the track and reply a success message to the user
  subscription.enqueue(track);
  return track.title;
};

// #endregion Queue

// #region Playlist

const urlPrefix: string = 'https://www.youtube.com/watch?v=';
const validQueryDomains: Set<string> = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'gaming.youtube.com',
]);
const getPlaylistID = (link: string): string => {
  const parsed = new URL(link);
  let id: string | null = parsed.searchParams.get('list');
  if (!id) {
    throw `No playlist id found: ${link}`;
  } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
    throw 'Not a Youtube domain';
  }
  return id;
};

export const validatePlaylistURL = (link: string): boolean => {
  try {
    getPlaylistID(link);
    return true;
  } catch (_error: any) {
    return false;
  }
};

export const enqueuePlaylist = async (
  interaction: CommandInteraction,
  subscription: MusicSubscription,
  playlistQuery: string,
): Promise<void> => {
  try {
    const playlistID: string = getPlaylistID(playlistQuery);
    const playlist: PlaylistMetadataResult = await search({ listId: playlistID });
    const urls: string[] = playlist.videos.map((item: PlaylistItem) => urlPrefix + item.videoId);
    for (let url of urls) {
      await enqueue(interaction, subscription, url);
    }
    await interaction.editReply(`Enqueued **${playlist.title}**`);
  } catch (error) {
    console.warn(error);
    await interaction.editReply('Failed to play track, please try again later!');
  }
};

// #endregion Playlist

// #region Song

export const enqueueSong = async (
  interaction: CommandInteraction,
  subscription: MusicSubscription,
  url: string,
) => {
  try {
    const trackTitle: string = await enqueue(interaction, subscription, url);
    await interaction.editReply(`Enqueued **${trackTitle}**`);
  } catch (error) {
    console.warn(error);
    await interaction.editReply('Failed to play track, please try again later!');
  }
};

// #endregion Song

// #region Search

export const enqueueSearchResult = async (
  interaction: CommandInteraction,
  subscription: MusicSubscription,
  searchQuery: string,
): Promise<void> => {
  try {
    const searchResult = await search(searchQuery);
    const url: string = searchResult.videos[0].url;
    const trackTitle: string = await enqueue(interaction, subscription, url);
    await interaction.editReply(`Enqueued **${trackTitle}**`);
  } catch (error) {
    console.warn(error);
    await interaction.editReply('Failed to play track, please try again later!');
  }
};

// #endregion Search
