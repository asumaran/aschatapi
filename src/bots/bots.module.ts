import { Module } from '@nestjs/common';
import { BotMentionService } from './bot-mention.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BotsController],
  providers: [BotsService, BotMentionService],
  exports: [BotsService, BotMentionService],
})
export class BotsModule {}
