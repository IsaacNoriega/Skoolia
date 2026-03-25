import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class CreateSchoolMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(params: {
    user: JwtPayload;
    publicUserId: string;
    content: string;
  }) {
    if (params.user.role !== 'private') {
      throw new BadRequestException(
        'Only private users can send school messages',
      );
    }

    const schoolId = await this.repository.findSchoolIdByOwner(params.user.sub);
    if (!schoolId) {
      throw new NotFoundException('School not found for current owner');
    }

    return this.repository.createMessage({
      schoolId,
      publicUserId: params.publicUserId,
      senderRole: 'private',
      content: params.content,
    });
  }
}
