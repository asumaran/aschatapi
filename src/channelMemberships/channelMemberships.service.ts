import { ChannelMember } from 'prisma/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

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
      },
    });
  }

  async create(data: Pick<ChannelMember, 'userId' | 'channelId'>) {
    return this.prisma.channelMember.create({
      data,
    });
  }
}
