import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from 'prisma/generated/prisma/client';

// This should be a real class/interface representing a user entity
export type UserObj = {
  userId: number;
  username: string;
  password: string;
};

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findOneByUsername(username: string): UserObj | undefined {
    return this.users.find((user) => user.username === username);
  }

  async create(data: Pick<User, 'name' | 'email' | 'password'>): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
}
