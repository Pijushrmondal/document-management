import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  /**
   * Mock login - creates/finds user and returns JWT
   * In production, this would validate credentials
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find or create user (mock authentication)
    const user = await this.usersService.findOrCreate({
      email: loginDto.email,
      role: loginDto.role,
    });

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '24h');

    return new AuthResponseDto(accessToken, expiresIn);
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
