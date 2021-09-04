import { Collection, Guild, GuildMember, InteractionReplyOptions, MessageEmbed } from 'discord.js';
import { queryDBLeaderboard, queryGameMetadata, querySettings, UserPointsGroup } from '../mongo/queries';
import { discordClient } from './client';

export const MASTER_ID = '280167443832373258';
export const DISCORD_ERROR_MESSAGE = 'Sorry, data is not available or obsolete';

const USERS_PER_PAGE = 10;

export const queryDiscordMembers = async () => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  const { memberRole } = await querySettings();
  return members.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
};

export const queryDiscordCommitteeIds = async (): Promise<string[]> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  return members.reduce((ids: string[], user: GuildMember) => {
    if (user.roles.cache.find(x => x.name === 'Committee')) ids.push(user.id);
    return ids;
  }, []);
};

export const queryServerMetadata = async (): Promise<{ iconURL: string, name: string }> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  return { iconURL: guild.iconURL() ?? '', name: guild.name };
};

export const queryUserIdByTag = async (tag: string): Promise<string | undefined> => {
  const currentMembers: Collection<string, GuildMember> = await queryDiscordMembers();
  return currentMembers.find(m => m.user.tag === tag)?.user.id;
}

export const queryUserByIds = async (ids: string[]): Promise<{ avatarURL: string, tag?: string }[]> => {
  const currentMembers: Collection<string, GuildMember> = await queryDiscordMembers();
  return ids.map(id => { 
    const user = currentMembers.get(id)?.user;
    return { avatarURL: user?.avatarURL() ?? '', tag: user?.tag };
  });
};

export const queryLeaderboard = async (game: string, page: number): Promise<InteractionReplyOptions> => {
  try {
    // NOTE: Some members might have left the guild, do not use limit and skip
    const dbLeaderboard: UserPointsGroup[] = await queryDBLeaderboard(game, page);

    if (dbLeaderboard.length === 0) throw 'No user points found';

    // Use game name stored in MongoDB
    game = dbLeaderboard[0]._id.game;

    // Build leaderboard
    let position: number = 1;
    let previousTotalPoints: number = dbLeaderboard[0].totalPoints;
    const members = await queryDiscordMembers();
    let count: number = 0;
    let positions: string = '';
    let userTags: string = '';
    let totalPoints: string = '';
    dbLeaderboard.forEach((record: any) => {
      // Verify that user is a member
      const userTag = members.get(record._id.userId)?.user.tag;
      if (!userTag) return;
      // Increment count if user is a member
      count++;
      // Increment position if totalPoints differ
      if (record.totalPoints < previousTotalPoints) position++;
      previousTotalPoints = record.totalPoints;
      // Verify that user is on the current page
      if (Math.ceil(count / USERS_PER_PAGE) !== page) return;
      // Add user to leaderboard
      positions += `${position}\n`;
      userTags += `${userTag}\n`;
      totalPoints += `${record.totalPoints}\n`;
    }, []);

    const totalPages = Math.ceil(count / USERS_PER_PAGE);
    const { color, logo } = await queryGameMetadata(game);
    const { name, iconURL } = await queryServerMetadata();
    return { embeds: [
      new MessageEmbed()
        .setColor(color)
        .setTitle(`Leaderboard: ${game}\n\u200b`)
        .setAuthor(name, iconURL)
        .setThumbnail(logo)
        .addFields(
          { name: 'Position', value: positions, inline: true },
          { name: 'Tag', value: userTags, inline: true },
          { name: 'Total Points', value: `${totalPoints}\n\u200b`, inline: true },
        )
        .setFooter(`Page ${page} of ${totalPages}`)
        .setTimestamp()
    ] };
  } catch (error: any) {
    console.log('Discord: ', Error);
    return { embeds: [ new MessageEmbed().setTitle(DISCORD_ERROR_MESSAGE) ] };
  }
};
