import {
  AttributeValue,
  BatchWriteItemCommand,
  BatchWriteItemInput,
  GetItemCommand,
  GetItemCommandInput,
  GetItemOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
  WriteRequest,
} from '@aws-sdk/client-dynamodb';
import table from 'text-table';
import { dbClient } from './client';
import {
  Settings,
  SETTINGS_TABLE,
  toDateString,
  User,
  UserPoint,
  USER_POINTS_TABLE,
  USERS_TABLE,
} from './models';

export const batchWriteUser = async (
  discordUserHandleById: { [key: string]: string },
  userIdsToAdd: string[],
  userIdsToRemove: string[],
): Promise<void> => {
  const input: BatchWriteItemInput = {
    RequestItems: {
      [USERS_TABLE]: [
        ...putUserRequest(discordUserHandleById, userIdsToAdd),
        ...deleteUserRequest(userIdsToRemove),
      ]
    }
  };
  const command = new BatchWriteItemCommand(input);
  try {
    await dbClient.send(command);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
};

const deleteUserRequest = (userIdsToRemove: string[]): WriteRequest[] => {
  return userIdsToRemove.map(userId => ({
    DeleteRequest: {
      Key: {
        Id: { S: userId },
      },
    },
  }));
};

const putUserRequest = (
  discordUserHandleById: { [key: string]: string },
  userIdsToAdd: string[]
): WriteRequest[] => {
  return userIdsToAdd.map(userId => ({
    PutRequest: {
      Item: {
        Id: { S: userId },
        Date: { S: new Date().toISOString() },
        Handle: { S: discordUserHandleById[userId] },
      },
    },
  }));
};

export const batchUpdateUser = async (
  discordUserHandleById: { [key: string]: string },
  userIdsToUpdate: string[]
): Promise<void> => {
  try {
    const updatePromises: Promise<UpdateItemCommandOutput>[] = [];
    userIdsToUpdate.forEach(userId => {
      const input: UpdateItemCommandInput = {
        TableName: USERS_TABLE,
        Key: {
          Id: { S: userId },
        },
        UpdateExpression: 'SET Handle = :h',
        ExpressionAttributeValues: {
          ':h': { S: discordUserHandleById[userId] },
        },
      };
      const command = new UpdateItemCommand(input);
      updatePromises.push(dbClient.send(command));
    });
    await Promise.all(updatePromises);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
};

export const getSettings = async (): Promise<Settings> => {
  const scanSettingsInput: ScanCommandInput = {
    TableName: SETTINGS_TABLE,
  };
  const scanSettingsCommand = new ScanCommand(scanSettingsInput);

  const scanSettingsOutput: ScanCommandOutput = await dbClient.send(scanSettingsCommand);
  if (scanSettingsOutput.Items?.length === 0) throw new Error('Settings not found');
  return Settings.toModel(scanSettingsOutput.Items![0]!); 
};

export const getLeaderboard = async (game: string): Promise<string> => {
  try {
    const { StartDate, LeaderboardRowCount } = await getSettings();   

    const scanUserPointsInput: ScanCommandInput = {
      TableName: USER_POINTS_TABLE,
      ScanFilter: {
        Game: {
          AttributeValueList: [{ S: game }],
          ComparisonOperator: 'EQ'
        },
        Date: {
          AttributeValueList: [{ S: StartDate }],
          ComparisonOperator: 'GE'
        },
      },
    }
    const scanUserPointsCommand = new ScanCommand(scanUserPointsInput);
    const scanUserPointsOutput: ScanCommandOutput = await dbClient.send(scanUserPointsCommand);

    // Get user records
    const records: [number, string, number][] = [];
    if (scanUserPointsOutput.Items?.length) {
      // Get top UserIds
      const countByUserId = scanUserPointsOutput.Items!.reduce((output: {[key: string]: number}, item) => {
        const { Count, UserId } = UserPoint.toModel(item);
        if (output[UserId]) output[UserId] += Count;
        else output[UserId] = Count;
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
      topCounts.splice(LeaderboardRowCount);

      // Get names of top UserIds
      const topUserIds = topCounts.reduce((ids: AttributeValue[], count) => {
        ids.push(...userIdsByCount[count].map(id => ({ S: id })));
        return ids;
      }, []);
      const scanUsersInput: ScanCommandInput = {
        TableName: USERS_TABLE,
        ScanFilter: {
          Id: {
            AttributeValueList: topUserIds,
            ComparisonOperator: 'IN'
          },
        }
      };
      const scanUsersCommand = new ScanCommand(scanUsersInput);
      const scanUsersOutput: ScanCommandOutput = await dbClient.send(scanUsersCommand);
      const nameByUserId = scanUsersOutput.Items!.reduce((output: { [key: string]: string }, item) => {
        const { Id, Name } = User.toModel(item);
        output[Id] = Name;
        return output;
      }, {});

      topCounts.forEach((count: number, index: number) => {
        userIdsByCount[count].forEach(userId => {
          records.push([index + 1, nameByUserId[userId], count]);
        });
      });
    }

    // Build user records table
    const recordsTable: string = table(
      [['Position', 'Name', 'Total Points'], ...records],
      { hsep: '     '}
    );

    return `\`\`\`Leaderboard: ${game}\n\n${recordsTable}\`\`\``;
  } catch (err: any) {
    console.log(`Error: ${err}`);
    return 'Sorry, data is not available';
  }
};

export const getUserRecord = async (id: string, game: string): Promise<string> => {
  const getInput: GetItemCommandInput = {
    TableName: USERS_TABLE,
    Key: { Id: { S: id } },
  };
  const getCommand = new GetItemCommand(getInput);

  const scanInput: ScanCommandInput = {
    TableName: USER_POINTS_TABLE,
    ScanFilter: {
      UserId: {
        AttributeValueList: [{ S: id }],
        ComparisonOperator: 'EQ'
      },
      Game: {
        AttributeValueList: [{ S: game }],
        ComparisonOperator: 'EQ'
      }
    }
  };
  const scanCommand = new ScanCommand(scanInput);
  
  try {
    // Get Name associated with UserId
    const getOutput: GetItemOutput = await dbClient.send(getCommand);
    if (!getOutput.Item) throw new Error('User not found');
    const { Name } = User.toModel(getOutput.Item!);

    // Get UserPoints associated with UserId
    const scanOutput: ScanCommandOutput = await dbClient.send(scanCommand);
    const userPoints: UserPoint[] = scanOutput.Items!.map(item => UserPoint.toModel(item));
    
    // Get user records
    let totalCount: number = 0;
    let records: [string, string, number][] = userPoints.map(({ Date, Description, Count }) => {
      totalCount += Count;
      return [toDateString(Date), Description, Count];
    });

    // Build user records table
    const recordsTable: string = table(
      [['Date', 'Description', 'Points'], ...records],
      { hsep: '     ' }
    );

    return `\`\`\`Name: ${Name}\nGame: ${game}\n\n${recordsTable}\n\nTotal Points: ${totalCount}\`\`\``;
  } catch (err: any) {
    console.log(`Error: ${err}`);
    return 'Sorry, data is not available';
  }
};
