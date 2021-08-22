import { ApplicationCommandData, Message } from 'discord.js';
import { querySettings } from '../../mongo/queries';
import { commands } from '../commands/base-command';
import BaseEvent from './base-event';

export default class MessageCreateEvent implements BaseEvent {
	public readonly name: string = 'messageCreate'

	public async handle(message: Message): Promise<void> {
		if (!message.guild) return;

    try {
      // Verify command
      if (message.content !== '!deploy') return;
      
      // Verify ownership
      const { ownerId } = await querySettings();
      if (message.author.id !== ownerId) return;

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
