import { ChannelMember } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ChannelMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ChannelMember[]> {
    return this.prisma.channelMember.findMany();
  }

  async findOne(id: number): Promise<ChannelMember | null> {
    return this.prisma.channelMember.findUnique({
      where: { id },
    });
  }

  async getAllChannelMembers(channelId: number): Promise<ChannelMember[]> {
    return this.prisma.channelMember.findMany({
      where: {
        channelId: channelId,
      },
      include: {
        user: true,
        bot: true,
      },
    });
  }

  async create(data: Pick<ChannelMember, 'userId' | 'channelId'>) {
    return this.prisma.channelMember.create({
      data,
    });
  }

  async removeByUserAndChannel(userId: number, channelId: number) {
    // Use a transaction to first delete the messages and then the ChannelMember
    return this.prisma.$transaction(async (prisma) => {
      const channelMember = await prisma.channelMember.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
      });

      if (!channelMember) {
        throw new NotFoundException(
          `Channel membership not found for user ${userId} in channel ${channelId}`,
        );
      }

      // Delete all messages of member.
      await prisma.message.deleteMany({
        where: {
          channelMemberId: channelMember.id,
        },
      });

      // Then we can delete the member from the channel.
      return prisma.channelMember.delete({
        where: {
          id: channelMember.id,
        },
      });
    });
  }
}
