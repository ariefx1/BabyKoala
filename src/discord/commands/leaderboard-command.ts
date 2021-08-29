import { ApplicationCommandOptionData, CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { queryLeaderboard, querySettings } from '../../mongo/queries';
import { MASTER_ID, queryDiscordCommitteeIds } from '../queries';
import BaseCommand from './base-command';

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
      await interaction.deferReply({ ephemeral: true });
      const t0 = performance.now();
      const { seasonStartDate } = await querySettings();
      const committeeIds: string[] = await queryDiscordCommitteeIds();
      const ephemeral: boolean = interaction.user.id !== MASTER_ID && !committeeIds.includes(interaction.user.id);
      const game = interaction.options.get('game')!.value! as string;
      const output: InteractionReplyOptions = await queryLeaderboard(game, seasonStartDate, ephemeral);
      const t1 = performance.now();
      await interaction.editReply(`Query took ${t1 - t0}ms`);
      await interaction.followUp(output);
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
