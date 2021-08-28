import { Collection, Guild, GuildMember } from 'discord.js';
import { querySettings } from '../mongo/queries';
import { discordClient } from './client';

export const queryDiscordUsers = async () => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  const { memberRole } = await querySettings();
  return members.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
}

export const queryServerMetadata = async (): Promise<{ iconURL: string, name: string }> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  return { iconURL: guild.iconURL() ?? '', name: guild.name };
};

export const queryUserTagsByIds = async (ids: string[]): Promise<(string | undefined)[]> => {
  const currentMembers = await queryDiscordUsers();
  return ids.map(id => currentMembers.get(id)?.user.tag);
};

export const queryUserByIds = async (ids: string[]): Promise<{ avatarURL: string, tag?: string }[]> => {
  const currentMembers = await queryDiscordUsers();
  return ids.map(id => { 
    const user = currentMembers.get(id)?.user;
    return { avatarURL: user?.avatarURL() ?? '', tag: user?.tag };
  });
};
