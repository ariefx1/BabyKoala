import { mongoClientConnect } from './mongo/client';
import { discordClientConnect } from './discord/client';
import { startTasks } from './task/tasks';

// Bootstrap
(async () => {
  await mongoClientConnect();
  await discordClientConnect();
  // TODO:
  // await startTasks();
})();
