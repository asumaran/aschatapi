import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Message } from 'prisma/generated/prisma/client';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Body()
    createMessageDto: Pick<
      Message,
      'channelId' | 'channelMemberId' | 'content'
    >,
  ) {
    return this.messagesService.create(createMessageDto);
  }

  @Get(':channelId')
  findOne(@Param('channelId') id: string) {
    return this.messagesService.getAllMessagesOfChannel(Number(id));
  }
}
