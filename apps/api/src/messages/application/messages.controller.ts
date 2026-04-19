
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  CreateMessageUseCase,
  ListMessagesByThreadUseCase,
  ListThreadsByParticipantUseCase,
} from '../core/use-cases/message.use-cases';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly listMessagesByThreadUseCase: ListMessagesByThreadUseCase,
    private readonly listThreadsByParticipantUseCase: ListThreadsByParticipantUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateMessageDto) {
    return this.createMessageUseCase.execute(dto);
  }

  @Get('thread/:threadId')
  async getMessages(@Param('threadId') threadId: string) {
    return this.listMessagesByThreadUseCase.execute(threadId);
  }

  @Get('threads')
  async getThreads(
    @Query('participantId') participantId: string,
    @Query('participantType') participantType: 'parent' | 'school' | 'course',
  ) {
    return this.listThreadsByParticipantUseCase.execute(
      participantId,
      participantType,
    );
  }
    // Obtener mensajes de un curso para el usuario autenticado
  @Get('courses/:courseId/messages')
  async getCourseMessages(
    @Param('courseId') courseId: string,
    @Query('userId') userId: string
  ) {
    // El threadId es courseId_userId
      console.log('[getCourseMessages] Params:', { courseId, userId });
      const threadId = `${courseId}_${userId}`;
    return this.listMessagesByThreadUseCase.execute(threadId);
  }
  // Obtener threads de padres para el usuario autenticado
  @Get('parents')
  async getParentThreads(@Query('userId') userId: string) {
    // participantType debe ser 'parent' para usuarios públicos
    return this.listThreadsByParticipantUseCase.execute(userId, 'parent');
  }

    // Obtener threads de cursos para el usuario autenticado (parent)
  @Get('courses/threads')
  async getCourseThreads(@Query('userId') userId: string) {
    // participantType debe ser 'parent' para usuarios públicos
    return this.listThreadsByParticipantUseCase.execute(userId, 'parent');
  }
  // Nuevo endpoint para mensajes de curso
  @Post('courses/:courseId')
  async createCourseMessage(
    @Param('courseId') courseId: string,
    @Body() body: { content: string; senderId: string; senderType: 'parent' | 'school' }
  ) {
    // El threadId será courseId_senderId
    const threadId = `${courseId}_${body.senderId}`;
    // receiverType es 'course', receiverId es courseId
    const messageDto = {
      content: body.content,
      senderId: body.senderId,
      senderType: body.senderType,
      receiverId: courseId,
      receiverType: 'course' as 'course',
      threadId,
    };
    // Esto creará el thread si no existe (por la lógica actual)
    return this.createMessageUseCase.execute(messageDto);
  }
}
