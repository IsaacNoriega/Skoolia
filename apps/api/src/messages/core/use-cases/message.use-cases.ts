import { Injectable, Inject } from '@nestjs/common';
import { MessageRepository } from '../ports/message.repository';
import { MESSAGE_REPOSITORY } from '../ports/tokens';
import { Message, MessageThread } from '../entities/message.types';

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(input: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    return this.messageRepository.createMessage(input);
  }
}

@Injectable()
export class ListMessagesByThreadUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(threadId: string): Promise<Message[]> {
    return this.messageRepository.getMessagesByThread(threadId);
  }
}

@Injectable()
export class ListThreadsByParticipantUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(participantId: string, participantType: 'parent' | 'school' | 'course'): Promise<MessageThread[]> {
    return this.messageRepository.getThreadsByParticipant(participantId, participantType);
  }
}
