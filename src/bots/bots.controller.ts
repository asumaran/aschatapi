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
import { BotsService } from './bots.service';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  /**
   * Create a new bot
   */
  @Post()
  create(@Body() createBotDto: { name: string }) {
    return this.botsService.create(createBotDto);
  }

  /**
   * Get all active bots
   */
  @Get()
  findAll() {
    return this.botsService.findAllActive();
  }

  /**
   * Get a bot by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.botsService.findOne(Number(id));
  }

  /**
   * Add a bot to a channel
   */
  @Post('join-channel')
  @HttpCode(HttpStatus.CREATED)
  addBotToChannel(@Body() body: { botId: number; channelId: number }) {
    return this.botsService.addBotToChannel(body.botId, body.channelId);
  }

  /**
   * Remove a bot from a channel
   */
  @Delete(':botId/channels/:channelId')
  @HttpCode(HttpStatus.OK)
  removeBotFromChannel(
    @Param('botId') botId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.botsService.removeBotFromChannel(
      Number(botId),
      Number(channelId),
    );
  }

  /**
   * Get all bot messages from a channel
   */
  @Get('messages/channel/:channelId')
  getBotMessagesByChannel(@Param('channelId') channelId: string) {
    return this.botsService.getBotMessagesByChannel(Number(channelId));
  }
}
