import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";
import { join } from "path";
import LeaderboardCommand from "./leaderboard-command";
import UserCommand from "./user-command";

export default interface BaseCommand {
  readonly name: string;
  readonly description: string;
  readonly options?: ApplicationCommandOptionData[];
  
  execute(interaction: CommandInteraction): Promise<void>;
}

const _commands = new Map<string, BaseCommand>();

export const commands = _commands;
