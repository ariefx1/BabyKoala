import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";

export enum PagingEmoji {
  First = '⏮️',
  Previous = '◀️',
  Next = '▶️',
  Last = '⏭️',
}

export default interface BaseCommand {
  readonly name: string;
  readonly description: string;
  readonly options?: ApplicationCommandOptionData[];
  
  execute(interaction: CommandInteraction): Promise<void>;
}

const _commands = new Map<string, BaseCommand>();

export const commands = _commands;
