import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BotMentionService } from '../bots/bot-mention.service';
import { Message } from '@prisma/client';

export interface UnifiedMessage {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  channelId: number;
  type: 'user' | 'bot';
  author: {
    id: number;
    name: string | null;
    email?: string;
  };
  channelMemberId?: number;
  botChannelMemberId?: number;
  replyToMessageId?: number | null;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botMentionService: BotMentionService,
  ) {}

  async getAllMessagesOfChannel(channelId: number): Promise<UnifiedMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        channelId: channelId,
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        botAuthor: {
          include: {
            bot: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform messages to unified format
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    return messages
      .map((msg): UnifiedMessage | null => {
        const anyMsg = msg as any;

        if (msg.channelMemberId && anyMsg.author?.user) {
          // User message
          return {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            channelId: msg.channelId,
            type: 'user' as const,
            author: {
              id: anyMsg.author.user.id,
              name: anyMsg.author.user.name,
              email: anyMsg.author.user.email,
            },
            channelMemberId: msg.channelMemberId,
            replyToMessageId: msg.replyToMessageId,
          };
        } else if (msg.botChannelMemberId && anyMsg.botAuthor?.bot) {
          // Bot message
          return {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            channelId: msg.channelId,
            type: 'bot' as const,
            author: {
              id: anyMsg.botAuthor.bot.id,
              name: anyMsg.botAuthor.bot.name,
            },
            botChannelMemberId: msg.botChannelMemberId,
            replyToMessageId: msg.replyToMessageId,
          };
        } else {
          // Skip invalid messages instead of throwing
          console.warn(
            `Invalid message data: message ${msg.id} has no valid author`,
          );
          return null;
        }
      })
      .filter((msg): msg is UnifiedMessage => msg !== null);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  }

  async create(
    data: Pick<Message, 'channelId' | 'channelMemberId' | 'content'>,
  ): Promise<Message> {
    // Validate that channelMemberId is provided for user messages
    if (!data.channelMemberId) {
      throw new Error('channelMemberId is required for user messages');
    }

    const message = await this.prisma.message.create({ data });

    // Get the user ID from the channel member to process bot mentions
    const channelMember = await this.prisma.channelMember.findUnique({
      where: { id: data.channelMemberId },
      select: { userId: true },
    });

    if (channelMember) {
      // Process the message for bot mentions (async, don't wait)
      this.botMentionService
        .processMessageForBotMentions(
          data.content,
          data.channelId,
          channelMember.userId,
          message.id,
        )
        .catch((error) => {
          console.error('Error processing bot mentions:', error);
        });
    }

    return message;
  }

  /**
   * Delete a message by its ID
   * @param messageId - The ID of the message to delete
   * @returns Promise<Message> - The deleted message
   * @throws NotFoundException if message not found
   */
  async delete(messageId: number): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }
}
