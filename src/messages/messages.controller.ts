import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService, UnifiedMessage } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get(':channelId')
  findOne(@Param('channelId') channelId: string): Promise<UnifiedMessage[]> {
    return this.messagesService.getAllMessagesOfChannel(Number(channelId));
  }

  /**
   * Delete a message by its ID
   * @param id - The message ID to delete
   * @returns The deleted message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.messagesService.delete(Number(id));
  }
}
