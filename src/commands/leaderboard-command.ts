import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";
import { getLeaderboard } from "../database/commands";
import BaseCommand from "./base-command";

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
    await interaction.deferReply();
    const game = interaction.options.get('game')!.value! as string;
    const reply = await getLeaderboard(game);
    await interaction.followUp(reply);
  }
}