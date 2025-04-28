import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from 'prisma/generated/prisma/client';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  getAll(): Promise<Channel[]> {
    return this.channelsService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: ParseIntPipe) {
    return this.channelsService.findOne(Number(id));
  }

  @Post()
  create(@Body() body: Pick<Channel, 'name'>) {
    return this.channelsService.create(body);
  }
}
