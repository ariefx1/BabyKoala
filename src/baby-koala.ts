import { config } from 'dotenv';
config();

import { mongoClientConnect } from './mongo/client';
import { discordClientConnect } from './discord/client';
import { startTasks } from './cron/tasks';

// Bootstrap
(async () => {
  await mongoClientConnect();
  await discordClientConnect();
  await startTasks();
})();
