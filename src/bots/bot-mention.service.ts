import { Injectable } from '@nestjs/common';
import { BotsService } from './bots.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGPTService, ChatGPTMessage } from '../chatgpt/chatgpt.service';

@Injectable()
export class BotMentionService {
  constructor(
    private readonly botsService: BotsService,
    private readonly prisma: PrismaService,
    private readonly chatgptService: ChatGPTService,
  ) {}

  /**
   * Process a message and respond if a bot is mentioned
   * Each mention is processed independently in background
   * @param messageContent - The content of the message
   * @param channelId - The channel where the message was sent
   * @param authorUserId - The ID of the user who sent the message
   * @param messageId - The ID of the original message
   */
  processMessageForBotMentions(
    messageContent: string,
    channelId: number,
    authorUserId: number,
    messageId: number,
  ): void {
    // Process mention in background without blocking
    this.processBotMention(
      messageContent,
      channelId,
      authorUserId,
      messageId,
    ).catch((error) => {
      console.error(
        `Error processing bot mention for message ${messageId}:`,
        error,
      );
    });
  }

  /**
   * Internal method to process bot mention in background
   * @param messageContent - The content of the message
   * @param channelId - The channel where the message was sent
   * @param authorUserId - The ID of the user who sent the message
   * @param messageId - The ID of the original message
   */
  private async processBotMention(
    messageContent: string,
    channelId: number,
    authorUserId: number,
    messageId: number,
  ): Promise<void> {
    console.log(`Starting bot mention processing for message ${messageId}`);

    const mentionData = this.botsService.parseBotMention(messageContent);

    if (!mentionData.isMention || !mentionData.mentionedChannelMemberId) {
      return;
    }

    // Try to find the bot by membership ID (the new way)
    const botData = await this.botsService.findByMembershipId(
      mentionData.mentionedChannelMemberId,
    );

    if (!botData || !botData.bot?.isActive) {
      return;
    }

    // Verify the bot is in the correct channel
    if (botData.channelMember.channelId !== channelId) {
      return;
    }

    // Generate response content using ChatGPT with full conversation context
    let responseText: string;

    try {
      // Get channel context
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        select: { name: true },
      });

      // Use ChatGPT with full conversation context if available
      if (this.chatgptService.isAvailable()) {
        responseText = await this.generateContextualResponse(
          messageContent,
          channelId,
          botData.bot.name,
          channel?.name || 'Canal',
        );
      } else {
        // Fallback to random response
        responseText = this.botsService.generateRandomResponse();
      }
    } catch (error) {
      console.error('Error generating ChatGPT response:', error);
      // Fallback to random response if ChatGPT fails
      responseText = this.botsService.generateRandomResponse();
    }

    const responseContent = `#${authorUserId} ${responseText}`;

    // Create bot response message
    await this.botsService.createBotMessage(
      botData.channelMember.id,
      channelId,
      responseContent,
      messageId,
    );

    console.log(`Bot mention processing completed for message ${messageId}`);
  }

  /**
   * Generate a contextual response using full conversation history
   * @param userMessage - The current user message
   * @param channelId - The channel ID
   * @param botName - The bot's name
   * @param channelName - The channel name
   * @returns Promise<string> - The bot's contextual response
   */
  private async generateContextualResponse(
    userMessage: string,
    channelId: number,
    botName: string,
    channelName: string,
  ): Promise<string> {
    try {
      // Set timeout for ChatGPT operations (15 seconds max)
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('ChatGPT timeout')), 15000);
      });

      const chatGptPromise = this.generateChatGPTResponse(
        userMessage,
        channelId,
        botName,
        channelName,
      );

      // Race between ChatGPT response and timeout
      return await Promise.race([chatGptPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error generating contextual response:', error);
      // Fallback to basic response
      return this.botsService.generateRandomResponse();
    }
  }

  /**
   * Generate ChatGPT response with conversation context
   * @param userMessage - The current user message
   * @param channelId - The channel ID
   * @param botName - The bot's name
   * @param channelName - The channel name
   * @returns Promise<string> - The ChatGPT response
   */
  private async generateChatGPTResponse(
    userMessage: string,
    channelId: number,
    botName: string,
    channelName: string,
  ): Promise<string> {
    // Get conversation history (last 15 messages to have good context)
    const conversationHistory = await this.prisma.message.findMany({
      where: { channelId },
      include: {
        author: {
          include: { user: true, bot: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Build full conversation for ChatGPT
    const conversation = this.buildConversationMessages(
      conversationHistory.map((msg) => ({
        content: msg.content,
        author: {
          user: msg.author.user
            ? { name: msg.author.user.name || 'Usuario' }
            : null,
          bot: msg.author.bot ? { name: msg.author.bot.name } : null,
        },
      })),
      userMessage,
      botName,
      channelName,
    );

    // Use sendConversation for full contextual understanding
    const response = await this.chatgptService.sendConversation(conversation);
    return response.message;
  }

  /**
   * Build conversation messages for ChatGPT
   * @param messageHistory - Array of messages from database
   * @param currentMessage - The current user message
   * @param botName - The bot's name
   * @param channelName - The channel name
   * @returns Array of ChatGPT messages
   */
  private buildConversationMessages(
    messageHistory: Array<{
      content: string;
      author: {
        user?: { name: string } | null;
        bot?: { name: string } | null;
      };
    }>,
    currentMessage: string,
    botName: string,
    channelName: string,
  ): ChatGPTMessage[] {
    const messages: ChatGPTMessage[] = [];

    // Add system prompt with context
    messages.push({
      role: 'system',
      content: `Eres ${botName}, un bot asistente inteligente y útil en el canal "${channelName}". 
      
Características de tu personalidad:
- Respondes en español de forma amigable y útil
- Eres experto en tecnología, especialmente en desarrollo web y programación
- Mantienes respuestas concisas pero informativas (máximo 3-4 oraciones)
- Usas emojis ocasionalmente para ser más expresivo
- Recuerdas y referencias conversaciones anteriores cuando sea relevante
- Si no sabes algo, lo admites honestamente

Contexto: Estás en una conversación de chat donde puedes ver el historial completo. Usa esta información para dar respuestas más contextuales y relevantes.`,
    });

    // Add conversation history in chronological order
    const sortedHistory = messageHistory.reverse(); // Reverse to get chronological order

    for (const msg of sortedHistory) {
      const authorName: string =
        msg.author.user?.name || msg.author.bot?.name || 'Usuario';
      const isBot = !!msg.author.bot;

      // Add message to conversation
      messages.push({
        role: isBot ? 'assistant' : 'user',
        content: isBot ? msg.content : `${authorName}: ${msg.content}`,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
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
