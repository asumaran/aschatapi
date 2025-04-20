import { Injectable } from "@nestjs/common";
import { User } from "generated/prisma";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Pick<User, "name" | "email">): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
}
