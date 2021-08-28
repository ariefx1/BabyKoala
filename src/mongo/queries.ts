import { Collection, Db } from 'mongodb';
import { queryServerMetadata, queryUserByIds, queryUserTagsByIds } from '../discord/queries';
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
import { ColorResolvable, InteractionReplyOptions, MessageEmbed, WebhookEditMessageOptions } from 'discord.js';

const mongoDBInstance: Db = mongoClient.db(DATABASE_NAME);
const gamesCollection: Collection<Game> = mongoDBInstance.collection(GAMES_COLLECTION);
const settingsCollection: Collection<Settings> = mongoDBInstance.collection(SETTINGS_COLLECTION);
const userPointsCollection: Collection<UserPoint> = mongoDBInstance.collection(USER_POINTS_COLLECTION);
const usersCollection: Collection<User> = mongoDBInstance.collection(USERS_COLLECTION);

export const queryLeaderboard = async (
  game: string,
  seasonStartDate: Date,
  ephemeral: boolean,
): Promise<InteractionReplyOptions> => {
  try {
    // Get user records
    const userPoints = await userPointsCollection.find({
      date: { $gte: seasonStartDate },
      game: new RegExp(['^', game, '$'].join(''), 'i'),
    }).toArray();
    
    if (userPoints.length === 0) throw 'No user points found';
    
    const positions: number[] = [];
    const tags: string[] = [];
    const totalPoints: number[] = [];
    
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
      if (userTags[index]) output[id] = userTags[index]!;
      return output;
    }, {});

    // Get top user records
    let position: number = 1;
    topCounts.forEach((count: number) => {
      userIdsByCount[count].forEach(userId => {
        if (nameByUserId[userId]) {
          // Increment position when it's not the first record and not a tie
          if (positions.length > 0 && count !== totalPoints[totalPoints.length - 1]) position++;
          positions.push(position);
          tags.push(nameByUserId[userId]!);
          totalPoints.push(count);
        }
      });
    });
    const { color, logo } = await queryGameMetadata(game);
    const { iconURL, name } = await queryServerMetadata();

    return { embeds: [
      new MessageEmbed()
        .setColor(color)
        .setTitle('Leaderboard\n\u200b')
        .setAuthor(name, iconURL)
        .setThumbnail(logo)
        .addFields(
          { name: 'Position', value: positions.join('\n'), inline: true },
          { name: 'Tag', value: tags.join('\n'), inline: true },
          { name: 'Total Points', value: `${totalPoints.join('\n')}\n\u200b`, inline: true },
        )
        .setTimestamp()
    ], ephemeral };
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
    return { content: 'Sorry, data is not available', ephemeral: true };
  }
};

export const querySettings = async (): Promise<Settings> => {
  const settings = await settingsCollection.findOne();
  if (!settings) throw new Error('Settings not found');
  return settings;
};

export const queryUserRecord = async (id: string, game: string): Promise<string | WebhookEditMessageOptions> => {
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
        ...idsToInsert.map(_id => ({ insertOne: { document: { _id } } })),
        ...idsToDelete.map(_id => ({ deleteOne: { filter: { _id } } })),
      ]);
    }
  } catch (error: any) {
    console.log(`Mongo: ${error}`);
  }
};

const queryGameMetadata = async (name: string): Promise<{ color: ColorResolvable, logo: string }> => {
  const game: Game | undefined = await gamesCollection
    .findOne({ name: new RegExp(['^', name, '$'].join(''), 'i'), });
  return { color: (game?.color ?? '') as ColorResolvable, logo: game?.logo ?? '' };
};

export const testImportData = async (users: User[], userPoints: UserPoint[]) => {
  if (users.length > 0) await usersCollection.bulkWrite([
    ...users.map((u: User) => ({ insertOne : { document: u } }))
  ]);
  if (userPoints.length > 0) await userPointsCollection.bulkWrite([
    ...userPoints.map((u: UserPoint) => ({ insertOne : { document: u } }))
  ]);
};
