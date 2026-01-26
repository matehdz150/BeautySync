import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  create(@Body() body) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.users.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.users.update(id, body);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.users.updatePassword(id, body.password);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
