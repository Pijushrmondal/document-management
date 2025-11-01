import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(
    @CurrentUser('sub') userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(userId);
  }
}
