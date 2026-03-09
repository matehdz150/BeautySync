import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GetUsersUseCase } from '../../core/use-cases/get-users.use-case';
import { GetUserUseCase } from '../../core/use-cases/get-user.use-case';
import { CreateUserUseCase } from '../../core/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../core/use-cases/update-user.use-case';
import { UpdatePasswordUseCase } from '../../core/use-cases/update-password.use-case';
import { DeleteUserUseCase } from '../../core/use-cases/delete-user.use-case';
import { CreateUserDto } from '../dto/craete-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from 'src/modules/auth/application/guards/organization-access.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly getUsers: GetUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updatePassword: UpdatePasswordUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @UseGuards(OrganizationAccessGuard)
  @Get()
  findAll() {
    return this.getUsers.execute();
  }

  @UseGuards(OrganizationAccessGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getUser.execute(id);
  }

  @UseGuards(OrganizationAccessGuard)
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.createUser.execute(body);
  }

  @UseGuards(OrganizationAccessGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.updateUser.execute(id, body);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.updatePassword.execute(id, body.password);
  }

  @UseGuards(OrganizationAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteUser.execute(id);
  }
}
