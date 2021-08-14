import {
  CreateTableCommand,
  CreateTableCommandInput,
  DescribeTableCommandInput,
  DynamoDBClient,
  PutItemCommand,
  PutItemInput,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { WaiterConfiguration, WaiterResult, WaiterState } from "@aws-sdk/util-waiter";
import { dbClient } from "./client";
import { SETTINGS_TABLE, USERS_POINTS_TABLE, USERS_TABLE } from "./models";

const createSettingsTable = async (): Promise<void> => {
  const createInput: CreateTableCommandInput = {
    AttributeDefinitions: [
      {
        AttributeName: 'OwnerId',
        AttributeType: 'S',
      }
    ],
    BillingMode: 'PROVISIONED',
    KeySchema: [
      {
        AttributeName: 'OwnerId',
        KeyType: 'HASH',
      }
    ],
    TableName: SETTINGS_TABLE,
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  const createCommand = new CreateTableCommand(createInput);

  const waiterParams: WaiterConfiguration<DynamoDBClient> = {
    client: dbClient,
    maxWaitTime: 300,
  };
  const waiterInput: DescribeTableCommandInput = {
    TableName: SETTINGS_TABLE,
  };

  const putInput: PutItemInput = {
    TableName: SETTINGS_TABLE,
    Item: {
      OwnerId: { S: process.env.DEFAULT_OWNER_ID! },
      StartDate: { S: new Date(0).toISOString() },
      UpdateSchedule: { S: '0 * * * *' },
      LeaderboardRowCount: { N: '10' },
    }
  }
  const putCommand = new PutItemCommand(putInput);

  try {
    await dbClient.send(createCommand);
    console.log(`DynamoDB: Successfully created ${SETTINGS_TABLE} table`);
    
    const waiterResult: WaiterResult = await waitUntilTableExists(waiterParams, waiterInput);
    if (waiterResult.state !== WaiterState.SUCCESS) throw new Error('Table not found');
    
    await dbClient.send(putCommand);
    console.log(`DynamoDB: Successfully added default settings to ${SETTINGS_TABLE} table`);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
}

const createUsersTable = async (): Promise<void> => {
  const input: CreateTableCommandInput = {
    AttributeDefinitions: [
      {
        AttributeName: 'Id',
        AttributeType: 'S',
      },
    ],
    BillingMode: 'PROVISIONED',
    KeySchema: [
      {
        AttributeName: 'Id',
        KeyType: 'HASH',
      },
    ],
    TableName: USERS_TABLE,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  const command = new CreateTableCommand(input);
  try {
    await dbClient.send(command);
    console.log(`DynamoDB: Successfully created ${USERS_TABLE} table`);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
}

const createUserPointsTable = async (): Promise<void> => {
  const input: CreateTableCommandInput = {
    AttributeDefinitions: [
      {
        AttributeName: 'UserId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'Date',
        AttributeType: 'S',
      },
    ],
    BillingMode: 'PROVISIONED',
    KeySchema: [
      {
        AttributeName: 'UserId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'Date',
        KeyType: 'RANGE',
      },
    ],
    TableName: USERS_POINTS_TABLE,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  const command = new CreateTableCommand(input);
  try {
    await dbClient.send(command);
    console.log(`DynamoDB: Successfully created ${USERS_POINTS_TABLE} table`);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
}

const verifyEnvironmentVariables = (): void => {
  const requiredVariables: string[] = [
    'AWS_ACCESS_KEY_ID',
    'AWS_REGION',
    'AWS_SECRET_ACCESS_KEY',
    'BOT_TOKEN',
    'DEFAULT_OWNER_ID',
  ];
  requiredVariables.forEach(variable => {
    if (!process.env[variable]) throw new Error('Required environment variable not found');
    console.log(`${variable}: ${process.env[variable]}`);
  });
}

(async () => {
  try {
    verifyEnvironmentVariables();
    await createSettingsTable();
    await createUsersTable();
    await createUserPointsTable();
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
})();
