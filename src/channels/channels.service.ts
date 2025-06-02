import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      include: { members: { include: { user: true } } },
    });
  }

  async findOne(id: number): Promise<Channel | null> {
    return this.prisma.channel.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  }

  async create(data: Pick<Channel, 'name'>): Promise<Channel> {
    return this.prisma.channel.create({ data });
  }
}
