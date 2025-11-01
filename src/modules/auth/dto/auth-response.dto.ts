export class AuthResponseDto {
  access_token: string;
  token_type: string = 'Bearer';
  expires_in: string;

  constructor(access_token: string, expires_in: string = '24h') {
    this.access_token = access_token;
    this.expires_in = expires_in;
  }
}
