import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChannelMembershipsService } from './channelMemberships.service';
import { ChannelMember } from '@prisma/client';

@Controller('channelMemberships')
export class ChannelMembershipsController {
  constructor(
    private readonly channelMembershipsService: ChannelMembershipsService,
  ) {}

  @Get()
  getAll() {
    return this.channelMembershipsService.findAll();
  }

  @Get('channelmembers/:channelId')
  getChannelMemberships(@Param('channelId') channelId: string) {
    return this.channelMembershipsService.getAllChannelMembers(
      Number(channelId),
    );
  }

  @Get(':id')
  getOne(@Param('id') id: ParseIntPipe) {
    return this.channelMembershipsService.findOne(Number(id));
  }

  @Post()
  create(
    @Body() channelMembership: Pick<ChannelMember, 'userId' | 'channelId'>,
  ) {
    return this.channelMembershipsService.create(channelMembership);
  }

  @Delete('user/:userId/channel/:channelId')
  async removeByUserAndChannel(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    try {
      await this.channelMembershipsService.removeByUserAndChannel(
        userId,
        channelId,
      );
      return {
        message: `Successfully removed user ${userId} from channel ${channelId}`,
      };
    } catch (error) {
      // Let NestJS handle this type of exception.
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error removing channel membership:', error);
      throw new InternalServerErrorException(
        'Failed to remove channel membership',
      );
    }
  }
}
