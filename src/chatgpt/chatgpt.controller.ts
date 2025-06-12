import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatGPTService, ChatGPTMessage } from './chatgpt.service';

export class SendMessageDto {
  message: string;
  systemPrompt?: string;
}

export class SendConversationDto {
  messages: ChatGPTMessage[];
}

export class GenerateBotResponseDto {
  userMessage: string;
  channelContext?: string;
  botPersonality?: string;
}

@Controller('chatgpt')
export class ChatGPTController {
  constructor(private readonly chatgptService: ChatGPTService) {}

  /**
   * Check if ChatGPT service is available
   */
  @Get('status')
  getStatus() {
    return {
      available: this.chatgptService.isAvailable(),
      message: this.chatgptService.isAvailable()
        ? 'ChatGPT service is available'
        : 'ChatGPT service is not available. Check OPENAI_API_KEY configuration.',
    };
  }

  /**
   * Send a simple message to ChatGPT
   */
  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
      const response = await this.chatgptService.sendMessage(
        dto.message,
        dto.systemPrompt,
      );

      return {
        success: true,
        response: response.message,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send a conversation to ChatGPT
   */
  @Post('conversation')
  async sendConversation(@Body() dto: SendConversationDto) {
    try {
      const response = await this.chatgptService.sendConversation(dto.messages);

      return {
        success: true,
        response: response.message,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a bot response using ChatGPT
   */
  @Post('bot-response')
  async generateBotResponse(@Body() dto: GenerateBotResponseDto) {
    try {
      const response = await this.chatgptService.generateBotResponse(
        dto.userMessage,
        dto.channelContext,
        dto.botPersonality,
      );

      return {
        success: true,
        response,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
