import { Document, ObjectId } from "mongodb";

export const DATABASE_NAME: string = 'DatabaseKoala';
export const SETTINGS_COLLECTION: string = 'Settings';
export const USER_POINTS_COLLECTION: string = 'UserPoints';
export const USERS_COLLECTION: string = 'Users';

interface BaseDocument extends Document {
  _id: ObjectId;
}

export interface Settings extends BaseDocument {
  memberRole: string;
  memberUpdateSchedule: string;
  ownerId: string;
  seasonStartDate: Date;
}

export interface User extends BaseDocument {
  id: string;
}

export interface UserPoint extends BaseDocument {
  count: number;
  date: Date;
  description: string;
  game: string;
  userId: string;
}
