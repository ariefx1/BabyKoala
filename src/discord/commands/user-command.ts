import {
  ApplicationCommandOptionData,
  CommandInteraction,
  Message,
  WebhookEditMessageOptions,
} from 'discord.js';
import { queryDiscordUserRecord } from '../queries';
import BaseCommand, { PagingEmoji } from './base-command';

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
      await interaction.deferReply();
      const userId: string = interaction.user.id;
      const game = interaction.options.get('game')!.value! as string;
      const output: WebhookEditMessageOptions = await queryDiscordUserRecord(userId, game, 1);
      const message = await interaction.editReply(output) as Message;
      await message.react(PagingEmoji.First);
      await message.react(PagingEmoji.Previous);
      await message.react(PagingEmoji.Next);
      await message.react(PagingEmoji.Last);
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
