import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatGPTResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class ChatGPTService {
  private readonly logger = new Logger(ChatGPTService.name);
  private readonly openai: OpenAI | null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not found in environment variables. ChatGPT functionality will be disabled.',
      );
      this.openai = null;
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.log('ChatGPT service initialized successfully');
  }

  /**
   * Check if ChatGPT service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Send a simple message to ChatGPT and get a response
   * @param message - The message to send to ChatGPT
   * @param systemPrompt - Optional system prompt to set context
   * @returns Promise<ChatGPTResponse> - The response from ChatGPT
   */
  async sendMessage(
    message: string,
    systemPrompt?: string,
  ): Promise<ChatGPTResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'ChatGPT service is not available. Check OPENAI_API_KEY configuration.',
      );
    }

    try {
      const messages: ChatGPTMessage[] = [];

      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message,
      });

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseMessage = completion.choices[0]?.message?.content || '';

      this.logger.log(
        `ChatGPT response generated successfully. Tokens used: ${completion.usage?.total_tokens || 0}`,
      );

      return {
        message: responseMessage,
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Error calling ChatGPT API:', error);
      throw new Error(
        `Failed to get response from ChatGPT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Send a conversation (multiple messages) to ChatGPT
   * @param messages - Array of messages in the conversation
   * @returns Promise<ChatGPTResponse> - The response from ChatGPT
   */
  async sendConversation(messages: ChatGPTMessage[]): Promise<ChatGPTResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'ChatGPT service is not available. Check OPENAI_API_KEY configuration.',
      );
    }

    try {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseMessage = completion.choices[0]?.message?.content || '';

      this.logger.log(
        `ChatGPT conversation response generated successfully. Tokens used: ${completion.usage?.total_tokens || 0}`,
      );

      return {
        message: responseMessage,
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Error calling ChatGPT API for conversation:', error);
      throw new Error(
        `Failed to get response from ChatGPT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate a bot response using ChatGPT based on context
   * @param userMessage - The user's message
   * @param channelContext - Context about the channel
   * @param botPersonality - The bot's personality prompt
   * @returns Promise<string> - The bot's response
   */
  async generateBotResponse(
    userMessage: string,
    channelContext?: string,
    botPersonality?: string,
  ): Promise<string> {
    const systemPrompt = this.buildBotSystemPrompt(
      channelContext,
      botPersonality,
    );

    try {
      const response = await this.sendMessage(userMessage, systemPrompt);
      return response.message;
    } catch (error) {
      this.logger.error('Error generating bot response:', error);
      // Fallback to a simple response if ChatGPT fails
      return 'Lo siento, no pude procesar tu mensaje en este momento. 🤖';
    }
  }

  /**
   * Build a system prompt for bot responses
   * @param channelContext - Context about the channel
   * @param botPersonality - The bot's personality
   * @returns string - The system prompt
   */
  private buildBotSystemPrompt(
    channelContext?: string,
    botPersonality?: string,
  ): string {
    let prompt =
      'Eres un bot asistente en un chat. Responde de manera útil, amigable y concisa en español.';

    if (botPersonality) {
      prompt += ` Tu personalidad es: ${botPersonality}`;
    }

    if (channelContext) {
      prompt += ` Contexto del canal: ${channelContext}`;
    }

    prompt +=
      ' Mantén tus respuestas cortas (máximo 2-3 oraciones) y usa emojis ocasionalmente para ser más expresivo.';

    return prompt;
  }

  /**
   * Summarize a conversation using ChatGPT
   * @param messages - Array of messages to summarize
   * @returns Promise<string> - A summary of the conversation
   */
  async summarizeConversation(messages: string[]): Promise<string> {
    if (!this.isAvailable()) {
      return 'Resumen no disponible (ChatGPT no configurado)';
    }

    const conversationText = messages.join('\n');
    const systemPrompt =
      'Eres un asistente que crea resúmenes concisos de conversaciones de chat. Crea un resumen breve y útil en español.';

    try {
      const response = await this.sendMessage(
        `Por favor, resume esta conversación de chat:\n\n${conversationText}`,
        systemPrompt,
      );
      return response.message;
    } catch (error) {
      this.logger.error('Error summarizing conversation:', error);
      return 'No se pudo generar un resumen de la conversación.';
    }
  }
}
