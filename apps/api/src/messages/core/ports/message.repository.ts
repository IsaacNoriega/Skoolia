import type { Message, MessageThread } from '../entities/message.types';

export abstract class MessageRepository {
  abstract createMessage(
    message: Omit<Message, 'id' | 'createdAt'>,
  ): Promise<Message>;
  abstract getMessagesByThread(threadId: string): Promise<Message[]>;
  abstract getThreadsByParticipant(
    participantId: string,
    participantType: 'parent' | 'school' | 'course',
  ): Promise<MessageThread[]>;
}
