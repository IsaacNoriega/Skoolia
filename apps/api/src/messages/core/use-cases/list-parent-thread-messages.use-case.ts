import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { MESSAGE_REPOSITORY } from '../ports/tokens';
import type { MessageRepository } from '../ports/message.repository';

export class ListParentThreadMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repository: MessageRepository,
  ) {}

  async execute(params: { user: JwtPayload; schoolId: string }) {
    if (params.user.role !== 'public') {
      throw new BadRequestException(
        'Only public users can read parent threads',
      );
    }

    const schoolExists = await this.repository.schoolExists(params.schoolId);
    if (!schoolExists) {
      throw new NotFoundException('School not found');
    }

    return this.repository.listParentThreadMessages({
      publicUserId: params.user.sub,
      schoolId: params.schoolId,
    });
  }
}
