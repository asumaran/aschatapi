import { Injectable, Post } from '@nestjs/common';
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
}
