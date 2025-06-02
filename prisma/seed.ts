import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'alfredo@mail.test' },
    update: {},
    create: {
      email: 'alfredo@mail.test',
      name: 'Alfredo Sumaran',
      password: crypto.createHash('md5').update('password').digest('hex'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@mail.test' },
    update: {},
    create: {
      email: 'jane@mail.test',
      name: 'Jane Doe',
      password: crypto.createHash('md5').update('password').digest('hex'),
    },
  });

  // Create channels
  const generalChannel = await prisma.channel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'General',
    },
  });

  const randomChannel = await prisma.channel.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Random',
    },
  });

  // Create channel memberships
  const membership1 = await prisma.channelMember.upsert({
    where: {
      userId_channelId: { userId: user1.id, channelId: generalChannel.id },
    },
    update: {},
    create: {
      userId: user1.id,
      channelId: generalChannel.id,
    },
  });

  const membership2 = await prisma.channelMember.upsert({
    where: {
      userId_channelId: { userId: user2.id, channelId: generalChannel.id },
    },
    update: {},
    create: {
      userId: user2.id,
      channelId: generalChannel.id,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const membership3 = await prisma.channelMember.upsert({
    where: {
      userId_channelId: { userId: user1.id, channelId: randomChannel.id },
    },
    update: {},
    create: {
      userId: user1.id,
      channelId: randomChannel.id,
    },
  });

  // Create a bot
  const assistantBot = await prisma.bot.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Assistant Bot',
      isActive: true,
    },
  });

  // Add bot to channels
  await prisma.botChannelMember.upsert({
    where: {
      botId_channelId: { botId: assistantBot.id, channelId: generalChannel.id },
    },
    update: {},
    create: {
      botId: assistantBot.id,
      channelId: generalChannel.id,
    },
  });

  await prisma.botChannelMember.upsert({
    where: {
      botId_channelId: { botId: assistantBot.id, channelId: randomChannel.id },
    },
    update: {},
    create: {
      botId: assistantBot.id,
      channelId: randomChannel.id,
    },
  });

  // Create some sample messages
  await prisma.message.create({
    data: {
      content: 'Hello everyone! Welcome to the General channel.',
      channelId: generalChannel.id,
      channelMemberId: membership1.id,
    },
  });

  await prisma.message.create({
    data: {
      content: 'Thanks for the welcome!',
      channelId: generalChannel.id,
      channelMemberId: membership2.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Created:');
  console.log('- Users:', user1.email, user2.email);
  console.log('- Channels:', generalChannel.name, randomChannel.name);
  console.log('- Bot:', assistantBot.name);
  console.log('- Sample messages in General channel');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
