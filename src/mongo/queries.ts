import { Collection, Db } from 'mongodb';
import { RECORDS_PER_PAGE } from '../discord/queries';
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
import { ColorResolvable } from 'discord.js';

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
  const game: Game | undefined = await gamesCollection.findOne({ name: name });
  return { color: (game?.color ?? '') as ColorResolvable, logo: game?.logo ?? '' };
};

// #endregion Collections

// #region Commands

export const queryDBLeaderboard = async (game: string, excludeLast: boolean = false): Promise<UserPointsGroup[]> => {
  const { seasonStartDate } = await querySettings();
  let endDate: Date | undefined;
  if (excludeLast) {
    const { latestDate }: any = await userPointsCollection.aggregate([
      { $group: { _id: null, latestDate: { $max: '$date' } } },
      { $project: { _id: 0 } },
    ]).next();
    endDate = latestDate;
  }
  // NOTE: Some members might have left the guild, do not use limit and skip
  return userPointsCollection.aggregate([
    // Filter out records prior to the seasonStartDate
    { $match: {
      date: { $gte: seasonStartDate, ...(endDate ? { $lt: endDate } : {}) },
      $text: { $search: game } }
    },
    // Group by userId and game, and summarize total count as totalPoints per group
    { $group: { _id: { userId: '$userId', game: '$game' }, totalPoints: { $sum: '$count' } } },
    // Sort totalPoints in descending order
    { $sort: { totalPoints: -1 } },
  ]).toArray();
};

export const queryDBUserPoints = async (
  id: string,
  game: string,
  page: number
): Promise<[UserPoint[], number, number]> => {
  const userPointsPromise: Promise<UserPoint[]> = userPointsCollection.aggregate([
    // Filter out records for other games
    { $match: { userId: id, $text: { $search: game } } },
    // Sort date in descending order
    { $sort: { date: -1 } },
    // Skip records in previous pages
    { $skip: RECORDS_PER_PAGE * (page - 1) },
    // Limit current page's number of records
    { $limit: RECORDS_PER_PAGE },
  ]).toArray();
  const userStatsPromise: Promise<any> = userPointsCollection.aggregate([
    // Filter out records for other games
    { $match: { userId: id, $text: { $search: game } } },
    { $group: { _id: null, userPointsCount: { $sum: 1 }, totalPoints: { $sum: '$count' } } },
    { $project: { _id: 0 } },
  ]).next();
  const [userPoints, userStats] = await Promise.all([userPointsPromise, userStatsPromise]);
  return [userPoints, userStats.userPointsCount, userStats.totalPoints];
}

// #endregion Commands
