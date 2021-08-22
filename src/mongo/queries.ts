import { Collection, Db } from 'mongodb';
import table from 'text-table';
import { queryUserTagsByIds } from '../discord/queries';
import { mongoClient } from './client';
import {
  Settings,
  SETTINGS_COLLECTION,
  User,
  UserPoint,
  USER_POINTS_COLLECTION,
  USERS_COLLECTION,
  DATABASE_NAME,
} from './documents';

const codeBlock = (value: string): string => '```' + value + '```';
const mongoDBInstance: Db = mongoClient.db(DATABASE_NAME);
const settingsCollection: Collection<Settings> = mongoDBInstance.collection(SETTINGS_COLLECTION);
const userPointsCollection: Collection<UserPoint> = mongoDBInstance.collection(USER_POINTS_COLLECTION);
const usersCollection: Collection<User> = mongoDBInstance.collection(USERS_COLLECTION);

export const queryLeaderboard = async (game: string): Promise<string> => {
  try {
    const { seasonStartDate } = await querySettings();   

    // Get user records
    const userPoints = await userPointsCollection.find({ game, date: { $gte: seasonStartDate } }).toArray();
    const headers: string[] = ['Position', 'Tag', 'Total Points'];
    const records: [number, string, number][] = [];
    if (userPoints.length > 0) {
      // Get top user ids
      const countByUserId = userPoints.reduce((output: {[key: string]: number}, userPoint: UserPoint) => {
        const { count, userId } = userPoint;
        if (output[userId]) output[userId] += count;
        else output[userId] = count;
        return output;
      }, {});
      const userIdsByCount = Object.keys(countByUserId).reduce((output: {[key: string]: string[]}, userId) => {
        const count = countByUserId[userId];
        if (output[count]) output[count].push(userId); 
        else output[count] = [userId];
        return output;
      }, {});
      const topCounts = Object.keys(userIdsByCount).map(k => Number(k));
      topCounts.sort((a, b) => b - a);
      
      // Get top user tags
      const topUserIds = topCounts.reduce((ids: string[], count) => {
        ids.push(...userIdsByCount[count]);
        return ids;
      }, []);
      const userTags = await queryUserTagsByIds(topUserIds);
      const nameByUserId = topUserIds.reduce((output: { [key: string]: string }, id: string, index: number) => {
        output[id] = userTags[index];
        return output;
      }, {});

      // Get top user records
      topCounts.forEach((count: number, index: number) => {
        userIdsByCount[count].forEach(userId => {
          records.push([index + 1, nameByUserId[userId], count]);
        });
      });
    }

    return codeBlock(
      `Leaderboard: ${game}\n\n` +
      table([headers, ...records], { hsep: '     '})
    )
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
    return 'Sorry, data is not available';
  }
};

export const querySettings = async (): Promise<Settings> => {
  const settings = await settingsCollection.findOne();
  if (!settings) throw new Error('Settings not found');
  return settings;
};

export const queryUserRecord = async (id: string, game: string): Promise<string> => {
  try {
    // Retrieve tag
    const [tag] = await queryUserTagsByIds([id]);
    if (!tag) throw new Error('User not found');

    // Get user points
    const userPoints = await userPointsCollection.find({ userId: id, game: game }).toArray();
    let points: number = 0;
    const headers: string[] = ['Date', 'Description', 'Points'];
    const records: [string, string, number][] = userPoints.map(({ date, description, count }) => {
      points += count;
      return [date.toLocaleDateString('en-MY'), description, count]
    });

    return codeBlock(
      `Tag: ${tag}\n` +
      `Game: ${game}\n\n` +
      `${table([headers, ...records], { hsep: '     ' })}\n\n` +
      `Total Points: ${points}`
    );
  } catch (error: any) {
    console.log(`Mongo: {error}`);
    return 'Sorry, data is not available';
  }
};

export const queryUsers = async (): Promise<User[]> => {
  return await usersCollection.find({}).toArray();
}

export const writeUsers = async (idsToInsert: string[], idsToDelete: string[]): Promise<void> => {
  try {
    if (idsToInsert.length > 0 || idsToDelete.length > 0) {
      await usersCollection.bulkWrite([
        ...idsToInsert.map(id => ({ insertOne: { document: { id } as User } })),
        ...idsToDelete.map(id => ({ deleteOne: { filter: { id } } })),
      ]);
    }
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
  }
};
