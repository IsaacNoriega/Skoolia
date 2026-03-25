import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class ListSchoolThreadMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(params: { user: JwtPayload; publicUserId: string }) {
    if (params.user.role !== 'private') {
      throw new BadRequestException(
        'Only private users can read school threads',
      );
    }

    const schoolId = await this.repository.findSchoolIdByOwner(params.user.sub);
    if (!schoolId) {
      throw new NotFoundException('School not found for current owner');
    }

    return this.repository.listSchoolThreadMessagesByOwner({
      ownerId: params.user.sub,
      publicUserId: params.publicUserId,
    });
  }
}
