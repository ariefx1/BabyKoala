import { AnyError, MongoClient, MongoMissingCredentialsError } from "mongodb";

// Verify credentials
const mongoUserName: string | undefined = process.env.MONGO_USER_NAME;
const mongoPassword: string | undefined = process.env.MONGO_PASSWORD;
if (!mongoUserName || !mongoPassword) {
  throw new MongoMissingCredentialsError('User name and password are not provided');
}

// Initialize MongoDB Client Instance
const URI: string = `mongodb+srv://${mongoUserName}:${encodeURIComponent(mongoPassword)}` +
  '@cluster0.bvvpc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const _mongoClient: MongoClient = new MongoClient(URI);
export const mongoClient = _mongoClient;
export const mongoClientConnect = async () => new Promise<void>((resolve, reject) => {
  _mongoClient.connect((error?: AnyError | undefined) => {
    if (error) {
      console.log(`Mongo: ${error}`);
      reject(error);
    } else {
      console.log('Mongo: Connected');
      resolve();
    }
  });
});
