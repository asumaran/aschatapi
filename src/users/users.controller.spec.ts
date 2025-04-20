import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      findAll: jest
        .fn()
        .mockResolvedValue([
          { id: 1, name: "John Doe", email: "john@example.com" },
        ]),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      }),
      create: jest.fn().mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should return all users", async () => {
    const result = await controller.getAll();
    expect(result).toEqual([
      { id: 1, name: "John Doe", email: "john@example.com" },
    ]);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it("should return a single user by ID", async () => {
    const result = await controller.getOne(1);
    expect(result).toEqual({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    });
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it("should create a new user", async () => {
    const newUser = { name: "Jane Doe", email: "jane@example.com" };
    const result = await controller.create(newUser);
    expect(result).toEqual({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    });
    expect(usersService.create).toHaveBeenCalledWith(newUser);
  });
});
