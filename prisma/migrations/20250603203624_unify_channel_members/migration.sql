/*
  Warnings:

  - You are about to drop the column `botChannelMemberId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `bot_channel_members` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[botId,channelId]` on the table `ChannelMember` will be added. If there are existing duplicate values, this will fail.
  - Made the column `channelMemberId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChannelMember" DROP CONSTRAINT "ChannelMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_botChannelMemberId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelMemberId_fkey";

-- DropForeignKey
ALTER TABLE "bot_channel_members" DROP CONSTRAINT "bot_channel_members_botId_fkey";

-- DropForeignKey
ALTER TABLE "bot_channel_members" DROP CONSTRAINT "bot_channel_members_channelId_fkey";

-- AlterTable
ALTER TABLE "ChannelMember" ADD COLUMN     "botId" INTEGER,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "botChannelMemberId",
ALTER COLUMN "channelMemberId" SET NOT NULL;

-- DropTable
DROP TABLE "bot_channel_members";

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMember_botId_channelId_key" ON "ChannelMember"("botId", "channelId");

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelMemberId_fkey" FOREIGN KEY ("channelMemberId") REFERENCES "ChannelMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
