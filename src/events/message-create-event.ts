import { ApplicationCommandData, Message } from 'discord.js';
import { commands } from '../commands/base-command';
import { getSettings } from '../database/commands';
import BaseEvent from './base-event';

export default class MessageCreateEvent implements BaseEvent {
	public readonly name: string = 'messageCreate'

	public async handle(message: Message): Promise<void> {
		if (!message.guild) return;

    try {
      // Verify command
      if (message.content !== '!deploy') return;
      
      // Verify ownership
      const { OwnerId } = await getSettings();
      if (message.author.id !== OwnerId) return;
      
      // Deploy commands
      const commandData: ApplicationCommandData[] = [];
      commands.forEach(({ name, description, options }) => { commandData.push({ name, description, options }) });
      await message.guild.commands.set(commandData);
      await message.reply('Commands deployed!');
    } catch (err: any) {
      console.log(`Error: ${err}`);
      return;
    }
	}
}
