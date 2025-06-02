import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChannelsModule } from './channels/channels.module';
import { ChannelMembershipsModule } from './channelMemberships/channelMemberships.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { BotsModule } from './bots/bots.module';

@Module({
  imports: [
    ChannelsModule,
    UsersModule,
    ChannelMembershipsModule,
    PrismaModule,
    MessagesModule,
    AuthModule,
    BotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
