import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard) // Toutes les routes protégées
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.getUsers();
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Patch(':id') // Note: dans Express c'est PATCH, pas PUT
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    // Vérifier que l'utilisateur modifie son propre compte (isOwner)
    if (req.user.id !== id) {
      throw new Error('Forbidden');
    }
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // Vérifier que l'utilisateur supprime son propre compte (isOwner)
    if (req.user.id !== id) {
      throw new Error('Forbidden');
    }
    await this.userService.deleteUser(id);
  }
}