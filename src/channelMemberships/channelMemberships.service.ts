import { ChannelMember } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

// Types for frontend-expected membership format
export interface UserMembership {
  id: number;
  type: 'user';
  channelId: number;
  member: {
    id: number;
    name: string;
    email: string;
  };
}

export interface BotMembership {
  id: number;
  type: 'bot';
  channelId: number;
  member: {
    id: number;
    name: string;
    isActive: boolean;
  };
}

export type ChannelMembership = UserMembership | BotMembership;

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

  async getAllChannelMembers(channelId: number): Promise<ChannelMembership[]> {
    const channelMembers = await this.prisma.channelMember.findMany({
      where: {
        channelId: channelId,
      },
      include: {
        user: true,
        bot: true,
      },
    });

    // Transform the data to match frontend expectations
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    return channelMembers.map((member): ChannelMembership => {
      if (member.userId && member.user) {
        // User membership
        const user = member.user;
        return {
          id: member.id,
          type: 'user' as const,
          channelId: member.channelId,
          member: {
            id: user.id,
            name: user.name || '',
            email: user.email,
          },
        };
      } else if (member.botId && member.bot) {
        // Bot membership
        const bot = member.bot;
        return {
          id: member.id,
          type: 'bot' as const,
          channelId: member.channelId,
          member: {
            id: bot.id,
            name: bot.name,
            isActive: bot.isActive,
          },
        };
      } else {
        throw new Error(
          `Invalid channel member data: member ${member.id} has no valid user or bot association`,
        );
      }
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
