import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get<string>('jwt.expiresIn'),
  },
});
