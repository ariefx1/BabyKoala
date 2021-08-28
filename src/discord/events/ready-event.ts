import { ApplicationCommandData, Client } from 'discord.js';
import { commands } from '../commands/base-command';
import BaseEvent from './base-event';

export default class ReadyEvent implements BaseEvent {
  public readonly name: string = 'ready';
  
  public async handle(client: Client): Promise<void> {
    console.log('Discord: Connected');
    const commandData: ApplicationCommandData[] = [];
    commands.forEach(({ name, description, options }) => { commandData.push({ name, description, options }) });
    await client.guilds.cache.first()!.commands.set(commandData);
    console.log('Discord: Deployed commands');

    client.user?.setActivity('/leaderboard', { type: 'COMPETING' });
  }
}
