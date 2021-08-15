import { AttributeValue } from "@aws-sdk/client-dynamodb";

export const SETTINGS_TABLE: string = 'Settings';
export const USERS_TABLE: string = 'Users';
export const USERS_POINTS_TABLE: string = 'UserPoints';

class BaseModel {
  public static toModel(output: { [key: string]: AttributeValue; }): BaseModel {
    let model = {} as any;
    Object.keys(output).forEach((key: string) => {
      const isNumeric: boolean = Object.keys(output[key])[0] === 'N';
      const stringValue: string = Object.values(output[key])[0];
      if (isNumeric) model[key] = Number(stringValue);
      else model[key] = stringValue;
    });
    return model as BaseModel;
  };
}

export class Settings extends BaseModel {
  constructor(
    public OwnerId: string,
    public LeaderboardRowCount: number,
    public MemberRole: string,
    public StartDate: string,
    public UpdateSchedule: string,
  ) {
    super();
  }

  public static override toModel(output: { [key: string]: AttributeValue; }): Settings {
    return super.toModel(output) as Settings;
  }
}

export class User extends BaseModel {
  constructor(
    public Id: string,
    public Name: string,
    public Date: string,
    public Handle: string,
  ) {
    super();
  }

  public static override toModel(output: { [key: string]: AttributeValue; }): User {
    return super.toModel(output) as User;
  }
}

export class UserPoint extends BaseModel {
  constructor(
    public UserId: string,
    public Date: string,
    public Game: string,
    public Description: string,
    public Count: number,
  ) {
    super();
  }

  public static override toModel(output: { [key: string]: AttributeValue; }): UserPoint {
    return super.toModel(output) as UserPoint;
  }
}

export const toDateString = (dateISOString: string): string => new Date(dateISOString).toLocaleDateString('en-MY');
