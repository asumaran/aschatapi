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
   * Add a bot to a channel
   */
  async addBotToChannel(botId: number, channelId: number) {
    return await this.prisma.botChannelMember.create({
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
    return await this.prisma.botChannelMember.delete({
      where: {
        botId_channelId: {
          botId,
          channelId,
        },
      },
    });
  }

  /**
   * Create a bot message in response to a user mention
   */
  async createBotMessage(
    botChannelMemberId: number,
    channelId: number,
    content: string,
    replyToMessageId?: number,
  ) {
    return await this.prisma.message.create({
      data: {
        content,
        botChannelMemberId,
        channelId,
        replyToMessageId,
      },
      include: {
        botAuthor: {
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
        botChannelMemberId: { not: null },
      },
      include: {
        botAuthor: {
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
   * Generate random response content for bot
   */
  generateRandomResponse(): string {
    const responses = [
      '¡Hola! 👋 ¿Cómo puedo ayudarte?',
      '¡Interesante! Cuéntame más sobre eso.',
      '¿Sabías que soy un bot? 🤖',
      '¡Genial! Me gusta esta conversación.',
      'Hmm, déjame pensar en eso... 🤔',
      '¡Excelente pregunta! No tengo idea. 😅',
      '¿Has probado apagarlo y encenderlo de nuevo?',
      'En mis cálculos, hay un 73.6% de probabilidad de que tengas razón.',
      '¡Error 404: Respuesta inteligente no encontrada! 😄',
      'Beep boop beep! Traducido: "¡Hola humano!"',
    ];

    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Check if a message mentions any bot
   */
  parseBotMention(content: string): {
    isMention: boolean;
    mentionedBotId?: number;
  } {
    // Look for pattern #{number} in the message
    const mentionRegex = /#(\d+)/;
    const match = content.match(mentionRegex);

    if (match) {
      const mentionedId = parseInt(match[1], 10);
      return {
        isMention: true,
        mentionedBotId: mentionedId,
      };
    }

    return { isMention: false };
  }
}
