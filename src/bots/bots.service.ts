import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new bot
   */
  async create(data: { name: string }) {
    return await this.prisma.bot.create({ data });
  }

  /**
   * Get all active bots
   */
  async findAllActive() {
    return await this.prisma.bot.findMany({
      where: { isActive: true },
      include: {
        channelMemberships: {
          include: {
            channel: true,
          },
        },
      },
    });
  }

  /**
   * Get a bot by ID
   */
  async findOne(id: number) {
    return await this.prisma.bot.findUnique({
      where: { id },
      include: {
        channelMemberships: {
          include: {
            channel: true,
          },
        },
      },
    });
  }

  /**
   * Get a bot by channel membership ID
   */
  async findByMembershipId(channelMemberId: number) {
    const channelMember = await this.prisma.channelMember.findUnique({
      where: { id: channelMemberId },
      include: {
        bot: true,
        channel: true,
      },
    });

    // Verify that this channel member is actually a bot
    if (!channelMember || !channelMember.botId || !channelMember.bot) {
      return null;
    }

    return {
      bot: channelMember.bot,
      channelMember: channelMember,
    };
  }

  /**
   * Add a bot to a channel
   */
  async addBotToChannel(botId: number, channelId: number) {
    return await this.prisma.channelMember.create({
      data: {
        botId,
        channelId,
      },
      include: {
        bot: true,
        channel: true,
      },
    });
  }

  /**
   * Remove a bot from a channel
   */
  async removeBotFromChannel(botId: number, channelId: number) {
    // Find the channel member first, then delete by id
    const channelMember = await this.prisma.channelMember.findFirst({
      where: {
        botId,
        channelId,
      },
    });

    if (!channelMember) {
      throw new Error(`Bot ${botId} is not a member of channel ${channelId}`);
    }

    return await this.prisma.channelMember.delete({
      where: {
        id: channelMember.id,
      },
    });
  }

  /**
   * Create a bot message in response to a user mention
   */
  async createBotMessage(
    channelMemberId: number,
    channelId: number,
    content: string,
    replyToMessageId?: number,
  ) {
    return await this.prisma.message.create({
      data: {
        content,
        channelMemberId,
        channelId,
        replyToMessageId,
      },
      include: {
        author: {
          include: {
            bot: true,
          },
        },
        channel: true,
        replyToMessage: true,
      },
    });
  }

  /**
   * Get all bot messages from a channel
   */
  async getBotMessagesByChannel(channelId: number) {
    return await this.prisma.message.findMany({
      where: {
        channelId,
        author: {
          botId: { not: null },
        },
      },
      include: {
        author: {
          include: {
            bot: true,
          },
        },
        replyToMessage: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Check if a message mentions any bot by channel member ID
   */
  parseBotMention(content: string): {
    isMention: boolean;
    mentionedChannelMemberId?: number;
  } {
    // Look for pattern #{number} in the message
    const mentionRegex = /#(\d+)/;
    const match = content.match(mentionRegex);

    if (match) {
      const mentionedId = parseInt(match[1], 10);
      return {
        isMention: true,
        mentionedChannelMemberId: mentionedId,
      };
    }

    return { isMention: false };
  }
}
