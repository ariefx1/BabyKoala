import { Collection, Guild, GuildMember } from 'discord.js';
import { querySettings } from '../mongo/queries';
import { discordClient } from './client';

export const MASTER_ID = '280167443832373258';

export const queryDiscordMembers = async () => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  const { memberRole } = await querySettings();
  return members.filter(user => !!user.roles.cache.find(x => x.name === memberRole));
};

export const queryDiscordCommitteeIds = async (): Promise<string[]> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  const members: Collection<string, GuildMember> = await guild?.members.fetch()!;
  return members.reduce((ids: string[], user: GuildMember) => {
    if (user.roles.cache.find(x => x.name === 'Committee')) ids.push(user.id);
    return ids;
  }, []);
};

export const queryServerMetadata = async (): Promise<{ iconURL: string, name: string }> => {
  const guild: Guild = discordClient.guilds.cache.first()!;
  return { iconURL: guild.iconURL() ?? '', name: guild.name };
};

export const queryUserTagsByIds = async (ids: string[]): Promise<(string | undefined)[]> => {
  const currentMembers = await queryDiscordMembers();
  return ids.map(id => currentMembers.get(id)?.user.tag);
};

export const queryUserByIds = async (ids: string[]): Promise<{ avatarURL: string, tag?: string }[]> => {
  const currentMembers = await queryDiscordMembers();
  return ids.map(id => { 
    const user = currentMembers.get(id)?.user;
    return { avatarURL: user?.avatarURL() ?? '', tag: user?.tag };
  });
};
