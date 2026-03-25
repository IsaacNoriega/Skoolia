import { BadRequestException, Inject } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class ListParentThreadsUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(user: JwtPayload) {
    if (user.role !== 'public') {
      throw new BadRequestException(
        'Only public users can list parent threads',
      );
    }

    return this.repository.listParentThreads(user.sub);
  }
}
