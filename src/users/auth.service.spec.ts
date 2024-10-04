import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { DeepPartial } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => {
          user.email === email;
        });
        return Promise.resolve(filteredUsers);
      },
      findByEmail: (email: string) => {
        const filteredUser = users.find((user) => user.email === email);

        return Promise.resolve(filteredUser || null);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
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

    service = module.get<AuthService>(AuthService);
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ email: 'a', password: '1' } as User]);
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
    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if sign in is called with an unused email', async () => {
    await expect(
      service.sigin('asdflkj@asdlfkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws an error if an invalid password is provided', async () => {
    await service.signup('asdf@asdf.com', 'asdf');

    await expect(service.sigin('asdf@asdf.com', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('return a user if password is correct', async () => {
    await service.signup('oauife@gmail.com', '12345');

    const user = await service.sigin('oauife@gmail.com', '12345');
    expect(user).toBeDefined();
  });
});
