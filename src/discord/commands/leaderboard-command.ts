import {
  ApplicationCommandOptionData,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
} from 'discord.js';
import { queryDiscordLeaderboard } from '../queries';
import BaseCommand, { PagingEmoji } from './base-command';

export default class LeaderboardCommand implements BaseCommand {
  public readonly name: string = 'leaderboard';
  public readonly description: string = 'View game leaderboard';
  public readonly options: ApplicationCommandOptionData[] = [{
    name: 'game',
    type: 'STRING',
    description: 'The name of the game to display',
    required: true,
  }];

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();
      const game = interaction.options.get('game')!.value! as string;
      const output: InteractionReplyOptions = await queryDiscordLeaderboard(game, 1);
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
