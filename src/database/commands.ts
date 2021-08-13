import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DeleteItemCommandOutput,
  GetItemCommand,
  GetItemCommandInput,
  GetItemCommandOutput,
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { User } from './models';
import { dbclient, USERS_TABLE_NAME } from './client';

const addUser = async (tag: string): Promise<PutItemCommandOutput | undefined> => {
  const input: PutItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Item: new User(
      // Tag
      tag,
      // Points
      0,
      // Date
      new Date().toISOString(),
      // TotalPoints
      0,
    ) as any,
  };
  const command = new PutItemCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}

const deleteUser = async (tag: string): Promise<DeleteItemCommandOutput | undefined> => {
  const input: DeleteItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Key: {
      'Tag': {
        S: tag
      }
    },
  };
  const command = new DeleteItemCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}

const getUser = async (tag: string): Promise<GetItemCommandOutput | undefined> => {
  const input: GetItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Key: {
      'Tag': {
        S: tag
      }
    },
  };
  const command = new GetItemCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}

const getLeaderboard = async (): Promise<ScanCommandOutput | undefined> => {
  const input: ScanCommandInput = {
    TableName: USERS_TABLE_NAME,
    ProjectionExpression: 'Tag, Points',
  }
  const command = new ScanCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}

const getLifetimeLeaderboard = async (): Promise<ScanCommandOutput | undefined> => {
  const input: ScanCommandInput = {
    TableName: USERS_TABLE_NAME,
    ProjectionExpression: 'Tag, LifetimePoints',
  }
  const command = new ScanCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}

const updateUser = async (
  tag: string,
  points: number,
  isIncremental: boolean = true,
) => {
  let totalPoints = points;
  if (isIncremental) {
    const user = await getUser(tag);
    if (user?.Item) {
      points += user.Item!.points! as any;
      totalPoints += user.Item!.points! as any;
    }
  }
  const input: UpdateItemCommandInput = {
    TableName: USERS_TABLE_NAME,
    Key: {
      'Tag': {
        S: tag
      },
    },
    UpdateExpression: 'SET Points = :p, LifetimePoints = :lp',
    ExpressionAttributeValues: {
      ':p': {
        'N': points as any,
      },
      ':lp': {
        'N': totalPoints as any,
      },
    }
  }
  const command = new UpdateItemCommand(input);
  try {
    return await dbclient.send(command);
  } catch (err: any) {
    console.log(err);
  }
}
