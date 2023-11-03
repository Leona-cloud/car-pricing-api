import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    //create a fake copy of userservice

    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@gmail.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if a user signs up with an email in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    try {
      await service.signup('asdf@asdf.com', 'asdf');
    } catch (err) {
      return err;
    }
  });

  it('throws if sign in is called with an unused email', async () => {
    try {
      await service.sigin('asdflkj@asdlfkj.com', 'passdflkj');
    } catch (err) {
      return err;
    }
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ email: 'asdf@asdf.com', password: 'asdf' } as User]);
    try {
      await service.sigin('jjjjgdbeiw@email.com', 'password');
    } catch (error) {
      return error;
    }
  });

  it('return a user if password is correct', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        {
          email: 'asdf@asdf.com',
          password:
            'e655a73cd9db6085.ecad4b6fe6c083b5f3c06dc0224586601f81c1665acbd5a4a9f287936f9b139f',
        } as User,
      ]);
    const user = await service.sigin('asdf@asdf.com', 'mypassword');
    expect(user).toBeDefined();
    
  });
});
