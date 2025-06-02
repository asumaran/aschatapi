import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    const validSignInDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockAuthResponse = {
      access_token: 'mock-jwt-token',
      userId: 1,
    };
    it('should return access token and user ID on successful login', async () => {
      authService.signIn.mockResolvedValue(mockAuthResponse);
      const result = await controller.signIn(validSignInDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.signIn).toHaveBeenCalledWith(
        validSignInDto.email,
        validSignInDto.password,
      );
      expect(result).toEqual(mockAuthResponse);
    });
    it('should throw BadRequestException when user is not found', async () => {
      authService.signIn.mockRejectedValue(
        new BadRequestException('User not found'),
      );
      await expect(controller.signIn(validSignInDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signIn).toHaveBeenCalledWith(
        validSignInDto.email,
        validSignInDto.password,
      );
    });
    it('should throw UnauthorizedException when password is incorrect', async () => {
      const invalidSignInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      authService.signIn.mockRejectedValue(new UnauthorizedException());
      await expect(controller.signIn(invalidSignInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.signIn).toHaveBeenCalledWith(
        invalidSignInDto.email,
        invalidSignInDto.password,
      );
    });
    it('should handle missing email in request body', async () => {
      const incompleteSignInDto = {
        password: 'password123',
      } as Record<string, string>;
      authService.signIn.mockRejectedValue(
        new BadRequestException('Email is required'),
      );
      await expect(controller.signIn(incompleteSignInDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signIn).toHaveBeenCalledWith(
        undefined,
        incompleteSignInDto.password,
      );
    });
    it('should handle missing password in request body', async () => {
      const incompleteSignInDto = {
        email: 'test@example.com',
      } as Record<string, string>;
      authService.signIn.mockRejectedValue(
        new BadRequestException('Password is required'),
      );
      await expect(controller.signIn(incompleteSignInDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signIn).toHaveBeenCalledWith(
        incompleteSignInDto.email,
        undefined,
      );
    });
    it('should handle empty request body', async () => {
      const emptySignInDto = {} as Record<string, string>;
      authService.signIn.mockRejectedValue(
        new BadRequestException('Email and password are required'),
      );
      await expect(controller.signIn(emptySignInDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signIn).toHaveBeenCalledWith(undefined, undefined);
    });
  });
  describe('getProfile', () => {
    it('should return user profile from request object', () => {
      const mockUser = {
        sub: 1,
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      const mockRequest = {
        user: mockUser,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = controller.getProfile(mockRequest);
      expect(result).toEqual(mockUser);
    });
    it('should handle request with no user (edge case)', () => {
      const mockRequest = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = controller.getProfile(mockRequest);
      expect(result).toBeUndefined();
    });
    it('should return user profile with different user data', () => {
      const mockUser = {
        sub: 2,
        email: 'another@example.com',
        iat: 9876543210,
        exp: 9876543210,
      };
      const mockRequest = {
        user: mockUser,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = controller.getProfile(mockRequest);
      expect(result).toEqual(mockUser);
    });
  });
  describe('HTTP status codes and decorators', () => {
    it('should have correct route decorators', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const controllerMetadata = Reflect.getMetadata('path', AuthController);
      expect(controllerMetadata).toBe('auth');
    });
    it('should have signIn method defined', () => {
      expect(typeof controller.signIn).toBe('function');
    });
    it('should have getProfile method defined', () => {
      expect(typeof controller.getProfile).toBe('function');
    });
  });
  describe('Integration scenarios', () => {
    it('should handle successful authentication flow', async () => {
      const signInDto = {
        email: 'user@example.com',
        password: 'securePassword',
      };
      const expectedResponse = {
        access_token: 'valid-jwt-token',
        userId: 123,
      };
      authService.signIn.mockResolvedValue(expectedResponse);
      const loginResult = await controller.signIn(signInDto);
      expect(loginResult).toEqual(expectedResponse);
      // Simulate the profile request with the token
      const mockProfileRequest = {
        user: {
          sub: 123,
          email: 'user@example.com',
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const profileResult = controller.getProfile(mockProfileRequest);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(profileResult.sub).toBe(123);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(profileResult.email).toBe('user@example.com');
    });
    it('should handle authentication failure scenarios', async () => {
      const invalidCredentials = {
        email: 'user@example.com',
        password: 'wrongPassword',
      };
      authService.signIn.mockRejectedValue(new UnauthorizedException());
      await expect(controller.signIn(invalidCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      // Profile endpoint should not be accessible without valid authentication
      // (This would be handled by the AuthGuard in real scenarios)
    });
  });
});
