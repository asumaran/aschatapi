import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string | null;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signupData: SignupDto): Promise<UserResponse> {
    const { name, email, password } = signupData;

    // Validate input data
    if (!name || !email || !password) {
      throw new BadRequestException('Name, email, and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    // Check if user already exists
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    // Return user without password
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; userId: number }> {
    const user = await this.usersService.findOneByEmail(email);

    if (user === null) {
      // TODO: Fail only in dev mode, in production we should not tell if the user isn't found to avoid enumeration attacks.
      throw new BadRequestException('User not found');
    }

    // Use bcrypt to verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };
    return {
      userId: user.id,
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
