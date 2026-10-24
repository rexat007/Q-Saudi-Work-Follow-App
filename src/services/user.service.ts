import { userRepository } from '../repositories/user.repository';
import { UserEntity } from '../types/entities';

export class UserService {
  async getUser(userId: string): Promise<UserEntity | null> {
    return userRepository.findById(userId);
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return userRepository.listAll();
  }

  subscribeToUsers(onData: (users: UserEntity[]) => void) {
    return userRepository.subscribeToUsers(onData);
  }
}

export const userService = new UserService();
