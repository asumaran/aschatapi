import { Module } from '@nestjs/common';
import { ChannelMembershipsController } from './channelMemberships.controller';
import { ChannelMembershipsService } from './channelMemberships.service';

@Module({
  controllers: [ChannelMembershipsController],
  providers: [ChannelMembershipsService],
})
export class ChannelMembershipsModule {}
