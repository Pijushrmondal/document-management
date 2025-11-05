import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  token_type: string = 'Bearer';
  access_token: string;
  expires_in: string;
  user?: UserResponseDto; // Optional user object

  constructor(
    access_token: string,
    expires_in: string = '24h',
    user?: UserResponseDto,
  ) {
    this.access_token = access_token;
    this.expires_in = expires_in;
    this.user = user;
  }
}
