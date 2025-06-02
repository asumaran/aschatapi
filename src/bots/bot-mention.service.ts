import { Injectable } from '@nestjs/common';
import { BotsService } from './bots.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotMentionService {
  constructor(
    private readonly botsService: BotsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Process a message and respond if a bot is mentioned
   * @param messageContent - The content of the message
   * @param channelId - The channel where the message was sent
   * @param authorUserId - The ID of the user who sent the message
   * @param messageId - The ID of the original message
   */
  async processMessageForBotMentions(
    messageContent: string,
    channelId: number,
    authorUserId: number,
    messageId: number,
  ): Promise<void> {
    const mentionData = this.botsService.parseBotMention(messageContent);

    if (!mentionData.isMention || !mentionData.mentionedBotId) {
      return;
    }

    // Check if the mentioned ID corresponds to a bot
    const bot = await this.botsService.findOne(mentionData.mentionedBotId);
    if (!bot || !bot.isActive) {
      return;
    }

    // Check if the bot is a member of the channel
    const botChannelMember = await this.prisma.botChannelMember.findUnique({
      where: {
        botId_channelId: {
          botId: bot.id,
          channelId,
        },
      },
    });

    if (!botChannelMember) {
      return;
    }

    // Generate response content mentioning the original author
    const randomResponse = this.botsService.generateRandomResponse();
    const responseContent = `#${authorUserId} ${randomResponse}`;

    // Create bot response message
    await this.botsService.createBotMessage(
      botChannelMember.id,
      channelId,
      responseContent,
      messageId,
    );
  }

  /**
   * Automatically add all active bots to a new channel
   * @param channelId - The ID of the new channel
   */
  async addBotsToNewChannel(channelId: number): Promise<void> {
    const activeBots = await this.botsService.findAllActive();

    for (const bot of activeBots) {
      try {
        await this.botsService.addBotToChannel(bot.id, channelId);
      } catch (error) {
        // Bot might already be in the channel, ignore error
        console.log(
          `Bot ${bot.id} already in channel ${channelId} or error occurred:`,
          error,
        );
      }
    }
  }
}
