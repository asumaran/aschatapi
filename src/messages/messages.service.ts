import { Injectable, NotFoundException } from '@nestjs/common';
import { Message } from 'prisma/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllMessagesOfChannel(channelId: number): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        channelId: channelId,
      },
    });
  }

  async create(
    data: Pick<Message, 'channelId' | 'channelMemberId' | 'content'>,
  ): Promise<Message> {
    return this.prisma.message.create({ data });
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
