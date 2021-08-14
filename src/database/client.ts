import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const _dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const dbClient: DynamoDBClient = _dbClient;
