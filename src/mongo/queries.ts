import { Collection, Db } from 'mongodb';
import { queryUserByIds } from '../discord/queries';
import { mongoClient } from './client';
import {
  DATABASE_NAME,
  Game,
  GAMES_COLLECTION,
  Settings,
  SETTINGS_COLLECTION,
  User,
  UserPoint,
  USER_POINTS_COLLECTION,
  USERS_COLLECTION,
} from './documents';
import { ColorResolvable, MessageEmbed, WebhookEditMessageOptions } from 'discord.js';

// #region Shared Variables

const mongoDBInstance: Db = mongoClient.db(DATABASE_NAME);
export const gamesCollection: Collection<Game> = mongoDBInstance.collection(GAMES_COLLECTION);
export const settingsCollection: Collection<Settings> = mongoDBInstance.collection(SETTINGS_COLLECTION);
export const userPointsCollection: Collection<UserPoint> = mongoDBInstance.collection(USER_POINTS_COLLECTION);
export const usersCollection: Collection<User> = mongoDBInstance.collection(USERS_COLLECTION);

// #endregion Shared Variables

// #region Interfaces

export interface UserPointsGroup {
  _id: { userId: string; game: string };
  totalPoints: number;
};

// #endregion Interfaces

// #region Collections

export const querySettings = async (): Promise<Settings> => {
  const settings = await settingsCollection.findOne();
  if (!settings) throw new Error('Settings not found');
  return settings;
};

export const queryUsers = async (): Promise<User[]> => {
  return await usersCollection.find({}).toArray();
}

export const writeUsers = async (idsToInsert: string[], idsToDelete: string[]): Promise<void> => {
  try {
    if (idsToInsert.length > 0 || idsToDelete.length > 0) {
      await usersCollection.bulkWrite([
        ...idsToInsert.map(_id => ({ insertOne: { document: { _id } } })),
        ...idsToDelete.map(_id => ({ deleteOne: { filter: { _id } } })),
      ]);
    }
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
  }
};

export const queryGameMetadata = async (name: string): Promise<{ color: ColorResolvable, logo: string }> => {
  const game: Game | undefined = await gamesCollection
    .findOne({ name: new RegExp(['^', name, '$'].join(''), 'i'), });
  return { color: (game?.color ?? '') as ColorResolvable, logo: game?.logo ?? '' };
};

// #endregion Collections

// #region Commands

export const queryDBLeaderboard = async (game: string, page: number): Promise<UserPointsGroup[]> => {
  const { seasonStartDate } = await querySettings();
  // NOTE: Some members might have left the guild, do not use limit and skip
  return await userPointsCollection.aggregate([
    // Filter out records prior to the seasonStartDate
    { $match: { date: { $gte: seasonStartDate }, $text: { $search: game } } },
    // Group by userId and game, and summarize total count as totalPoints per group
    { $group: { _id: { userId: '$userId', game: '$game' }, totalPoints: { $sum: '$count' } } },
    // Sort totalPoints in descending order
    { $sort: { totalPoints: -1 } },
  ]).toArray();
};

export const queryUserRecord = async (
  id: string,
  game: string,
  page: number,
): Promise<WebhookEditMessageOptions> => {
  try {
    // Retrieve user
    const [user] = await queryUserByIds([id]);
    if (!user.tag) throw 'User is not a member';

    // Get user points
    const userPoints = await userPointsCollection.find({
      userId: id,
      game: new RegExp(['^', game, '$'].join(''), 'i'),
    }).toArray();
    
    const dates: string[] = [];
    const descriptions: string[] = [];
    const points: number[] = [];
    userPoints.forEach(({ date, description, count }) => {
      dates.push(date.toLocaleDateString('en-MY'));
      descriptions.push(description);
      points.push(count);
    });
    const { color, logo } = await queryGameMetadata(game);

    return { embeds: [
      new MessageEmbed()
        .setColor(color)
        .setAuthor(user.tag, user.avatarURL)
        .setThumbnail(logo)
        .addFields(
          { name: '\u200b\nDate', value: dates.join('\n'), inline: true },
          { name: '\u200b\nDescription', value: descriptions.join('\n'), inline: true },
          { name: '\u200b\nPoints', value: points.join('\n'), inline: true },
          { value: '\u200b', name: `Total Points: ${points.reduce((x, y) => x + y).toString()}` },
        )
        .setTimestamp()
    ] };
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
    return { content: 'Sorry, data is not available' };
  }
};

// #endregion Commands
