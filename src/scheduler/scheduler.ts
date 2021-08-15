import { ScanCommandInput, ScanCommand, ScanCommandOutput } from "@aws-sdk/client-dynamodb";
import { Client } from "discord.js";
import { schedule } from "node-cron";
import { dbClient } from "../database/client";
import { batchUpdateUser, batchWriteUser, getSettings } from "../database/commands";
import { User, USERS_TABLE } from "../database/models";

export const runScheduledTasks = async (client: Client) => {
  const { MemberRole, UpdateSchedule } = await getSettings();
  schedule(UpdateSchedule, async () => {
    await dbDataSyncTask(client, MemberRole);
  });
};

const dbDataSyncTask = async (client: Client, memberRole: string) => {
  try {
    // DynamoDB Data
    const scanUsersInput: ScanCommandInput = { TableName: USERS_TABLE };
    const scanUsersCommand = new ScanCommand(scanUsersInput);
    const scanUsersOutput: ScanCommandOutput = await dbClient.send(scanUsersCommand);
    if (scanUsersOutput.Items?.length === 0) return;
    const dbUserHandleById: { [key: string]: string } = {};
    scanUsersOutput.Items!.forEach(item => {
      const user = User.toModel(item);
      dbUserHandleById[user.Id] = user.Handle;
    });
    // Discord Data
    const guild = client.guilds.cache.first();
    const users = await guild?.members.fetch();
    const members = users?.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
    const discordUserHandleById: { [key: string]: string } = {};
    members?.forEach(member => {
      discordUserHandleById[member.user.id] = member.user.tag;
    });
    // Sync Data
    const dbUserIds = Object.keys(dbUserHandleById);
    const userIdsToAdd: string[] = Object.keys(discordUserHandleById).filter(id => !dbUserIds?.includes(id));
    const userIdsToRemove = dbUserIds.filter(id => !discordUserHandleById[id]);
    await batchWriteUser(discordUserHandleById, userIdsToAdd, userIdsToRemove);
    const userIdsToUpdate = dbUserIds.filter(userId => dbUserHandleById[userId] !== discordUserHandleById[userId]);
    await batchUpdateUser(discordUserHandleById, userIdsToUpdate);
  } catch (err: any) {
    console.log(`Error: ${err}`);
  }
}
