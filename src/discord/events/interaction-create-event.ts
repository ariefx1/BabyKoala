import { Interaction } from "discord.js";
import BaseCommand, { commands } from "../commands/base-command";
import BaseEvent from './base-event';

export default class InteractionCreateEvent implements BaseEvent {
	public readonly name: string = 'interactionCreate';

	public async handle(interaction: Interaction): Promise<void> {
		if (!interaction.isCommand() || !interaction.guildId) return;
    
    const command: BaseCommand | undefined = commands.get(interaction.commandName);
    if (command) {
      await command.execute(interaction);
    } else {
      console.log(`Error: Unknown command '${interaction.commandName}'`);
      await interaction.reply('Sorry, unknown command');
    }
	}
}
