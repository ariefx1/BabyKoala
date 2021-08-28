import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { queryUserRecord } from '../../mongo/queries';
import BaseCommand from './base-command';

export default class UserCommand implements BaseCommand {
  public readonly name: string = 'user';
  public readonly description: string = 'View your records';
  public readonly options: ApplicationCommandOptionData[] = [{
    name: 'game',
    type: 'STRING',
    description: 'The name of the game to display',
    required: true,
  }];

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });
      const userId: string = interaction.user.id;
      const game = interaction.options.get('game')!.value! as string;
      await interaction.editReply(await queryUserRecord(userId, game));
    } catch (error: any) {
      console.log(`Discord: ${error}`);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('Sorry, data is not available');
      } else {
        await interaction.reply('Sorry, data is not available');
      }
    }
  }
}
