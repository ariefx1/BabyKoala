import { ApplicationCommandOptionData, CommandInteraction, InteractionDeferReplyOptions } from "discord.js";
import { getUserRecord } from "../database/commands";
import BaseCommand from "./base-command";

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
    const options: InteractionDeferReplyOptions = { ephemeral: true }
    await interaction.deferReply(options);
    const userId: string = interaction.user.id;
    const game = interaction.options.get('game')!.value! as string;
    const reply = await getUserRecord(userId, game);
    await interaction.followUp(reply);
  }
}
