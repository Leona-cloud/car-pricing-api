import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Delete,
  Patch,
  NotFoundException,
  Session,
  UseGuards
} from '@nestjs/common';
import { createUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { AuthService } from './auth.service';
import { currentUser } from './decorators/current-user.decorator';
import { User } from './user.entity';
import { AuthGuard } from 'src/guards/auth.guards';

@Controller('auth')
@Serialize(UserDto)

export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService 
    ) {}

  @Post('/signup')
  async createUser(@Body() body: createUserDto, @Session() session: any) {
    const user = await  this.authService.signup(body.email, body.password);
    session.userId = user.id;
    return user;
  };



  @Get('/whoami')
  @UseGuards(AuthGuard)
  whoAmI(@currentUser() user: User){
    return user
  };

  @Post('/signin')
  async signin(@Body() body: createUserDto, @Session() session: any){
    const user = await this.authService.sigin(body.email, body.password);
    session.userId = user.id
    return user;
  };

  
  @Post('/signout')
  signOut(@Session() session: any){
    session.userId = null
  }

  // @UseInterceptors( new SerializeInterceptor(UserDto))
  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user =  await this.usersService.findOne(parseInt(id));
    if(!user){
        throw new NotFoundException('user not found')
    };
    return user;
  }

  @Get()
  findAllUsers(@Query('email') email: string) {
    return this.usersService.find(email);
  }

  @Delete('/:id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(parseInt(id));
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(parseInt(id), body);
  }
}
