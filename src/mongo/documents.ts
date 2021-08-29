import { Document, ObjectId } from "mongodb";

export const DATABASE_NAME: string = 'DatabaseKoala';
export const GAMES_COLLECTION: string = 'Games';
export const SETTINGS_COLLECTION: string = 'Settings';
export const USER_POINTS_COLLECTION: string = 'UserPoints';
export const USERS_COLLECTION: string = 'Users';

interface BaseDocument extends Document {
  _id: ObjectId | string;
}

export interface Game extends BaseDocument {
  _id: ObjectId;
  name: string;
  logo: string;
  color: string;
}

export interface Settings extends BaseDocument {
  _id: ObjectId;
  memberRole: string;
  memberUpdateSchedule: string;
  seasonStartDate: Date;
}

export interface User extends BaseDocument {
  _id: string;
}

export interface UserPoint extends BaseDocument {
  _id: ObjectId;
  count: number;
  date: Date;
  description: string;
  game: string;
  userId: string;
}
