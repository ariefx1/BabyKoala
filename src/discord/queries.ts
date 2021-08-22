import { Collection, Guild, GuildMember } from 'discord.js';
import { querySettings } from '../mongo/queries';
import { discordClient } from './client';

export const queryDiscordUsers = async () => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  const { memberRole } = await querySettings();
  return members.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
}

export const queryUserTagsByIds = async (ids: string[]) => {
  const currentMembers = await queryDiscordUsers();
  return ids.map(id => currentMembers.get(id)?.user.tag);
};
