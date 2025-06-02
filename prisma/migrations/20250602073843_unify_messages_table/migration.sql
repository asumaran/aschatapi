/*
  Warnings:

  - Migrating bot_messages data to the unified Message table
*/

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelMemberId_fkey";

-- DropForeignKey
ALTER TABLE "bot_messages" DROP CONSTRAINT "bot_messages_botChannelMemberId_fkey";

-- DropForeignKey
ALTER TABLE "bot_messages" DROP CONSTRAINT "bot_messages_channelId_fkey";

-- DropForeignKey
ALTER TABLE "bot_messages" DROP CONSTRAINT "bot_messages_replyToMessageId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "botChannelMemberId" INTEGER,
ADD COLUMN     "replyToMessageId" INTEGER,
ALTER COLUMN "channelMemberId" DROP NOT NULL;

-- Migrate bot_messages data to Message table
INSERT INTO "Message" (content, "createdAt", "updatedAt", "channelId", "botChannelMemberId", "replyToMessageId")
SELECT content, "createdAt", "updatedAt", "channelId", "botChannelMemberId", "replyToMessageId"
FROM "bot_messages";

-- DropTable
DROP TABLE "bot_messages";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelMemberId_fkey" FOREIGN KEY ("channelMemberId") REFERENCES "ChannelMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_botChannelMemberId_fkey" FOREIGN KEY ("botChannelMemberId") REFERENCES "bot_channel_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
