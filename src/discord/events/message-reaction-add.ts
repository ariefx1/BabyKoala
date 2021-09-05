import {
  InteractionReplyOptions,
  Message,
  MessageReaction,
  PartialMessage,
  PartialMessageReaction,
  PartialUser,
  User,
  WebhookEditMessageOptions
} from 'discord.js';
import { DISCORD_CLIENT_ID } from '../client';
import { PagingEmoji } from '../commands/base-command';
import {
  DISCORD_ERROR_MESSAGE,
  queryDiscordLeaderboard,
  queryDiscordUserIdByTag,
  queryDiscordUserRecord,
  USER_RECORD_COLOR
} from '../queries';
import BaseEvent from './base-event';

export default class MessageReactionAddEvent implements BaseEvent {
  public readonly name: string = 'messageReactionAdd';

  public async handle(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ): Promise<void> {    
    try {
      // Ignore reactions on messages made by others
      if (reaction.message.author?.id !== DISCORD_CLIENT_ID) return;
      // Ignore reactions made by BabyKoala
      if (user.id === DISCORD_CLIENT_ID) return;
      // Ignore if emoji is null
      const emoji: string | null = reaction.emoji.name;
      if (!emoji) {
        await reaction.users.remove(user as User);
        return;
      }
      // Remove emoji if it is not pagination
      const isPaging: boolean = Object.values(PagingEmoji).includes(emoji as any);
      if (!isPaging) {
        await reaction.users.remove(user as User);
        return;
      }
      // Remove emoji if message is not MessageEmbed
      if (!reaction.message.embeds || reaction.message.embeds.length === 0) {
        await reaction.users.remove(user as User);
        return;
      }
      // Ignore if message is invalid
      if (!MessageReactionAddEvent.isValid(reaction)) {
        await reaction.users.remove(user as User);
        return;
      }

      // Execute pagination
      if (MessageReactionAddEvent.isLeaderboardPaging(reaction)) {
        await MessageReactionAddEvent.page(
          reaction.message,
          emoji as PagingEmoji,
          MessageReactionAddEvent.pageLeaderboard,
          );
      } else {
        await MessageReactionAddEvent.page(
          reaction.message,
          emoji as PagingEmoji,
          MessageReactionAddEvent.pageUserRecord,
        );
      }
      await reaction.users.remove(user as User);
    } catch (error: any) {
      console.log('Discord: ', error);
    }
  }

  private static isValid(reaction: MessageReaction | PartialMessageReaction): boolean {
    return reaction.message.embeds[0].title !== DISCORD_ERROR_MESSAGE;
  }

  private static isLeaderboardPaging(reaction: MessageReaction | PartialMessageReaction): boolean {
    return reaction.message.embeds[0].hexColor !== USER_RECORD_COLOR;
  }

  private static async page(
    message: Message | PartialMessage,
    emoji: PagingEmoji,
    pageHandler: (...args: any) => Promise<InteractionReplyOptions | WebhookEditMessageOptions>,
  ): Promise<void> {
    const footer: string = message.embeds[0].footer!.text!;
    const [currentPage, lastPage] = footer.replace('Page ', '').split(' of ').map(p => Number(p));
    if (lastPage === 1) return;
    if (currentPage === 1 && emoji !== PagingEmoji.Next && emoji !== PagingEmoji.Last) return;
    if (currentPage === lastPage && emoji !== PagingEmoji.Previous && emoji !== PagingEmoji.First) return;

    const gameName: string = message.embeds![0].title!.replace('Game: ', '');
    let page: number;
    switch (emoji) {
      case PagingEmoji.First:
        page = 1;
        break
      case PagingEmoji.Previous:
        page = currentPage - 1;
        break;
      case PagingEmoji.Next:
        page = currentPage + 1;
        break;
      case PagingEmoji.Last:
        page = lastPage;
        break;
      default:
        page = 1;
    }
    await message.edit(await pageHandler(message, gameName, page)!);
  }

  private static async pageLeaderboard(
    _message: Message,
    game: string,
    page: number,
  ): Promise<InteractionReplyOptions> {
    return await queryDiscordLeaderboard(game, page);
  }

  private static async pageUserRecord(
    message: Message,
    game: string,
    page: number,
  ): Promise<WebhookEditMessageOptions> {
    const userId: string | undefined = await queryDiscordUserIdByTag(message.embeds[0].author!.name!);
    if (!userId) throw 'User not found';
    return await queryDiscordUserRecord(userId, game, page);
  }
}
