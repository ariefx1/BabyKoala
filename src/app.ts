import { Client, ClientOptions } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { commands } from './commands/base-command';
import { runScheduledTasks } from './scheduler/scheduler';

(async () => {
  const options: ClientOptions = {
    intents: [
      // Privileged Gateway Intents
      'GUILD_MEMBERS',
      // Non-privileged Gateway Intents
      'GUILDS',
      'GUILD_MESSAGES',
    ],
  };
  const client = new Client(options);
  // Commands
  const commandDir: string = join(__dirname, 'commands');
  readdirSync(commandDir).forEach((commandFilename: string) => {
    if (commandFilename.includes('base') || commandFilename.endsWith('.map')) return;
    const dir = join(commandDir, commandFilename);
    const command = new (require(dir).default)();
    commands.set(command.name, command);
  });
  // Events
  const eventDir: string = join(__dirname, 'events');
  readdirSync(eventDir).forEach((eventFilename: string) => {
    if (eventFilename.includes('base') || eventFilename.endsWith('.map')) return;
    const dir = join(eventDir, eventFilename);
    const event = new (require(dir).default)();
    client.on(event.name, event.handle);
  });

  await client.login(process.env.BOT_TOKEN);  
  // TODO: Uncomment during testing
  // await runScheduledTasks(client);
})();