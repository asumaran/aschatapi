import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOneByEmail(email);

    if (user === null) {
      // TODO: Fail only in dev mode, in production we should not tell if the user isn't found to avoid enumeration attacks.
      throw new BadRequestException('User not found');
    }

    // TODO: Improve encryption/decryption strategy. This is only for quick prototyping.
    const encrypted_password = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');

    if (encrypted_password !== user.password) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
