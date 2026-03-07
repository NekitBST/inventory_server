import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }
}
