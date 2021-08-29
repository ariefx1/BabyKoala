import { schedule } from 'node-cron';
import { queryDiscordMembers } from '../discord/queries';
import { querySettings, queryUsers, writeUsers } from '../mongo/queries';

const membersSyncTask = async () => {
  const { memberUpdateSchedule } = await querySettings();
  const task = async () => {
    try {
      const discordMemberIds: string[] = Array.from((await queryDiscordMembers()).keys());
      const mongoMemberIds: string[] = (await queryUsers()).map(u => u._id);
      const memberIdsToInsert: string[] = discordMemberIds.filter(id => !mongoMemberIds?.includes(id));
      const memberIdsToDelete = mongoMemberIds.filter(id => !discordMemberIds.includes(id));
      await writeUsers(memberIdsToInsert, memberIdsToDelete);
    } catch (err: any) {
      console.log(`Users Sync Task: ${err}`);
    }
  };
  schedule(memberUpdateSchedule, task);
};

export const startTasks = async () => {
  try {
    await membersSyncTask();
    console.log('Tasks: Scheduled');
  } catch (error: any) {
    console.log(`Tasks: ${error}`);
  }
};
