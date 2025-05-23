import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ChannelMembershipsService } from './channelMemberships.service';
import { ChannelMember } from 'prisma/generated/prisma/client';

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
}
