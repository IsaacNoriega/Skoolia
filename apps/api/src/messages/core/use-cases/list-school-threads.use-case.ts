import { BadRequestException, Inject } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class ListSchoolThreadsUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(user: JwtPayload) {
    if (user.role !== 'private') {
      throw new BadRequestException(
        'Only private users can list school threads',
      );
    }

    return this.repository.listSchoolThreadsByOwner(user.sub);
  }
}
