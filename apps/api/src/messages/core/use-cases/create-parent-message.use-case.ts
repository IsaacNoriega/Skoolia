import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class CreateParentMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(params: {
    user: JwtPayload;
    schoolId: string;
    content: string;
  }) {
    if (params.user.role !== 'public') {
      throw new BadRequestException(
        'Only public users can send parent messages',
      );
    }

    const schoolExists = await this.repository.schoolExists(params.schoolId);
    if (!schoolExists) {
      throw new NotFoundException('School not found');
    }

    return this.repository.createMessage({
      schoolId: params.schoolId,
      publicUserId: params.user.sub,
      senderRole: 'public',
      content: params.content,
    });
  }
}
