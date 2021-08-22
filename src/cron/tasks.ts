import { schedule } from 'node-cron';
import { queryDiscordUsers } from '../discord/queries';
import { querySettings, queryUsers, writeUsers } from '../mongo/queries';

const usersSyncTask = async () => {
  const { memberUpdateSchedule } = await querySettings();
  const task = async () => {
    try {
      const discordUserIds: string[] = Array.from((await queryDiscordUsers()).keys());
      const mongoUserIds: string[] = (await queryUsers()).map(u => u.id);
      const userIdsToInsert: string[] = discordUserIds.filter(id => !mongoUserIds?.includes(id));
      const userIdsToDelete = mongoUserIds.filter(id => !discordUserIds.includes(id));
      await writeUsers(userIdsToInsert, userIdsToDelete);
    } catch (err: any) {
      console.log(`Users Sync Task: ${err}`);
    }
  };
  schedule(memberUpdateSchedule, task);
}

export const startTasks = async () => {
  try {
    await usersSyncTask();
    console.log('Tasks: Scheduled');
  } catch (error: any) {
    console.log(`Tasks: ${error}`);
  }
}
