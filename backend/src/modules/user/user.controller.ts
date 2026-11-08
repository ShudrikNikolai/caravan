import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './services/user.service';
import { SearchUsersQueryDto } from './schemas/search-users-query.schema';
import { UpdateUserDto } from './schemas/user-update.schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateUserSchema: UpdateUserDto,
  ) {
    return this.usersService.updateById(userId, updateUserSchema);
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users by username or email' })
  async search(
    @CurrentUser('id') userId: string,
    @Query() query: SearchUsersQueryDto,
  ) {
    return this.usersService.search(query.q, userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
