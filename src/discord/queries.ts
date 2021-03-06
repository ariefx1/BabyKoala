import { Collection, Guild, GuildMember, InteractionReplyOptions, MessageEmbed, WebhookEditMessageOptions } from 'discord.js';
import { queryDBLeaderboard, queryDBUserPoints, queryGameMetadata, querySettings, UserPointsGroup } from '../mongo/queries';
import { discordClient } from './client';

export const DISCORD_ERROR_MESSAGE = 'Sorry, data is not available or obsolete';
export const USER_RECORD_COLOR = '#ffffff';
export const RECORDS_PER_PAGE = 15;

// #region Discord APIs

export const queryDiscordMembers = async () => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  const { memberRole } = await querySettings();
  return members.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
};

export const queryDiscordMembersByIds = async (ids: string[]): Promise<{ avatarURL: string, tag?: string }[]> => {
  const currentMembers: Collection<string, GuildMember> = await queryDiscordMembers();
  return ids.map(id => {
    const user = currentMembers.get(id)?.user;
    return { avatarURL: user?.avatarURL() ?? '', tag: user?.tag };
  });
};

export const queryDiscordCommitteeIds = async (): Promise<string[]> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  return members.reduce((ids: string[], user: GuildMember) => {
    if (user.roles.cache.find(x => x.name === 'Committee')) ids.push(user.id);
    return ids;
  }, []);
};

export const queryDiscordGuildMetadata = async (): Promise<{ iconURL: string, name: string }> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  return { iconURL: guild.iconURL() ?? '', name: guild.name };
};

export const queryDiscordUserIdByTag = async (tag: string): Promise<string | undefined> => {
  const currentMembers: Collection<string, GuildMember> = await queryDiscordMembers();
  return currentMembers.find(m => m.user.tag === tag)?.user.id;
}

// #endregion Discord APIs

// #region Commands

export const queryDiscordLeaderboard = async (game: string, page: number): Promise<InteractionReplyOptions> => {
  try {
    // NOTE: Some members might have left the guild, do not use limit and skip
    const dbLeaderboard: UserPointsGroup[] = await queryDBLeaderboard(game);

    if (dbLeaderboard.length === 0) throw 'No user points found';

    // Use game name stored in MongoDB
    game = dbLeaderboard[0]._id.game;

    // Build leaderboard
    const members = await queryDiscordMembers();
    // Calculate previous positions
    const previousDBLeaderboard = await queryDBLeaderboard(game, true);
    const previousPositionById = calculatePositionById(previousDBLeaderboard, members);
    // Calculate current positions
    let position: number = 1;
    let previousTotalPoints: number = dbLeaderboard[0].totalPoints;
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
      if (Math.ceil(count / RECORDS_PER_PAGE) !== page) return;
      // Add user to leaderboard
      positions += retrievePositionLabel(previousPositionById, record, position);
      userTags += `\u200b\n${userTag}\n`;
      totalPoints += `\u200b\n${record.totalPoints}\n`;
    }, []);

    const totalPages: number = Math.ceil(count / RECORDS_PER_PAGE);
    const { color, logo } = await queryGameMetadata(game);
    const { name, iconURL } = await queryDiscordGuildMetadata();
    return {
      embeds: [
        new MessageEmbed()
          .setColor(color)
          .setAuthor(name, iconURL)
          .setTitle(`Game: ${game}\n\u200b`)
          .setThumbnail(logo)
          .addFields(
            { name: 'Position', value: positions, inline: true },
            { name: 'Tag', value: userTags, inline: true },
            { name: 'Total Points', value: `${totalPoints}\n\u200b`, inline: true },
          )
          .setFooter(`Page ${page} of ${totalPages}`)
          .setTimestamp()
      ]
    };
  } catch (error: any) {
    console.log('Discord: ', Error);
    return { embeds: [new MessageEmbed().setTitle(DISCORD_ERROR_MESSAGE)] };
  }
};

const calculatePositionById = (
  DBLeaderboard: UserPointsGroup[],
  members: Collection<string, GuildMember>,
): { [key: string]: number } => {
  if (DBLeaderboard.length === 0) return {};
  let position: number = 1;
  let previousTotalPoints: number = DBLeaderboard[0].totalPoints;
  return DBLeaderboard.reduce((output: { [key: string]: number }, record: UserPointsGroup) => {
    // Verify that user is a member
    const userTag = members.get(record._id.userId)?.user.tag;
    if (!userTag) return output;
    // Increment position if totalPoints differ
    if (record.totalPoints < previousTotalPoints) position++;
    previousTotalPoints = record.totalPoints;
    output[record._id.userId] = position;
    return output;
  }, {});
};

const retrievePositionLabel = (
  previousPositionById: { [key: string]: number },
  record: UserPointsGroup,
  position: number,
): string => {
  const previousPosition: number = previousPositionById[record._id.userId];
  if (!previousPosition || previousPosition === position) {
    return `\u200b\n${position} <:small_orange_unchanged:883800059962097724>\n`
  } else if (previousPosition > position) {
    return `\u200b\n${position} <:small_green_triangle:883771002700587059>\n`
  } else {
    return `\u200b\n${position} :small_red_triangle_down:\n`
  }
};

export const queryDiscordUserRecord = async (
  id: string,
  game: string,
  page: number,
): Promise<WebhookEditMessageOptions> => {
  try {
    // Retrieve user
    const [user] = await queryDiscordMembersByIds([id]);
    if (!user.tag) throw 'User is not a member';

    const [userPoints, userPointsCount, totalPoints] = await queryDBUserPoints(id, game, page);

    if (userPoints.length === 0) throw 'No user points found';

    // Use game name stored in MongoDB
    game = userPoints[0].game;

    // Build User Record
    let dates: string = '';
    let descriptions: string = '';
    let points: string = '';
    userPoints.forEach(({ date, description, count }) => {
      dates += `${date.toLocaleDateString('en-MY')}\n`;
      descriptions += `${description}\n`;
      points += `${count}\n`;
    });
    const { logo } = await queryGameMetadata(game);
    const lastPage = Math.ceil(userPointsCount / RECORDS_PER_PAGE);

    return {
      embeds: [
        new MessageEmbed()
          .setColor(USER_RECORD_COLOR)
          .setAuthor(user.tag, user.avatarURL)
          .setTitle(`Game: ${game}`)
          .setThumbnail(logo)
          .addFields(
            { name: '\u200b\nDate', value: dates, inline: true },
            { name: '\u200b\nDescription', value: descriptions, inline: true },
            { name: '\u200b\nPoints', value: points, inline: true },
            { value: '\u200b', name: `Total Points: ${totalPoints}` },
          )
          .setFooter(`Page ${page} of ${lastPage}`)
          .setTimestamp()
      ]
    };
  } catch (error: any) {
    console.log('Discord: ', Error);
    return { embeds: [new MessageEmbed().setTitle(DISCORD_ERROR_MESSAGE)] };
  }
};

// #endregion Commands
