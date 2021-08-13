import { CreateTableCommand, CreateTableCommandInput, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { dbclient, USERS_TABLE_NAME } from "./client";

const createUsersTable = async (): Promise<void> => {
  const input: CreateTableCommandInput = {
    AttributeDefinitions: [],
    BillingMode: 'PROVISIONED',
    KeySchema: [
      { AttributeName: 'Tag', KeyType: 'HASH' },
      { AttributeName: 'Points', KeyType: 'RANGE' },
    ],
    TableName: USERS_TABLE_NAME,
    ProvisionedThroughput: {
      ReadCapacityUnits: 20,
      WriteCapacityUnits: 10,
    },
  };
  const command = new CreateTableCommand(input);
  try {
    await dbclient.send(command);
  } catch (err: any) {
    console.log('Error', err);
  }
}

const addUsers = async (): Promise<void> => {
  // TODO:
  // PutItemCommand(input);
}

(async () => {
  try {
    await createUsersTable();
  } catch (err: any) {
    console.log(err);
  }
});
