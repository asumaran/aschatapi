export interface BotMention {
  memberId: number;
  name: string;
}

export interface CreateMessageDto {
  content: string;
  channelId: number;
  channelMemberId: number;
  mentions?: BotMention[];
}
