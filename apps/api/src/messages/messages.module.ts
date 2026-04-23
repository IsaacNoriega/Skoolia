import { Module } from '@nestjs/common';
import { MessagesController } from './application/messages.controller';
import {
  CreateMessageUseCase,
  ListMessagesByThreadUseCase,
  ListThreadsByParticipantUseCase,
} from './core/use-cases/message.use-cases';
import { DrizzleMessageRepository } from './infrastructure/adapters/drizzle-message.repository';
import { MESSAGE_REPOSITORY } from './core/ports/tokens';

@Module({
  controllers: [MessagesController],
  providers: [
    CreateMessageUseCase,
    ListMessagesByThreadUseCase,
    ListThreadsByParticipantUseCase,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: DrizzleMessageRepository,
    },
  ],
})
export class MessagesModule {}
