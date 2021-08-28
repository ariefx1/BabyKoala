import { Client, ClientOptions } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { commands } from "./commands/base-command";

const discordToken: string | undefined = process.env.DISCORD_TOKEN;

if (!discordToken) {
  throw new Error('Discord: Token is not provided');
}

// Discord Client
const options: ClientOptions = {
  intents: [
    // Privileged Gateway Intents
    'GUILD_MEMBERS',
    // Non-privileged Gateway Intents
    'GUILDS',
    'GUILD_MESSAGES',
  ],
};
const _discordClient = new Client(options);
export const discordClient = _discordClient;

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
  _discordClient.on(event.name, event.handle);
});

export const discordClientConnect = async () => {
  try {
    await _discordClient.login(discordToken!);
  } catch (error: any) {
    console.log(`Discord: ${error}`);
  }
};
