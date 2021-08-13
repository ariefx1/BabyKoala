import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const _dbclient = new DynamoDBClient({ region: 'ap-southeast-1' });

export const dbclient: DynamoDBClient = _dbclient;

export const USERS_TABLE_NAME: string = 'Users';
