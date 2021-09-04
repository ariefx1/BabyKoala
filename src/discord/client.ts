import { Client, Intents } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { commands } from "./commands/base-command";

const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN!;
export const DISCORD_CLIENT_ID: string = process.env.DISCORD_CLIENT_ID!;

if (!DISCORD_TOKEN) {
  throw new Error('Discord: Token is not provided');
}

// Discord Client
const _discordClient = new Client({
  intents: [
    // Privileged Gateway Intents
    Intents.FLAGS.GUILD_MEMBERS,
    // Non-privileged Gateway Intents
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
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
    await _discordClient.login(DISCORD_TOKEN!);
  } catch (error: any) {
    console.log(`Discord: ${error}`);
  }
};
