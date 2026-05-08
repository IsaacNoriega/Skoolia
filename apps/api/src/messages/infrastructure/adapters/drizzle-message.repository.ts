import { Injectable, Inject } from '@nestjs/common';
import { MessageRepository } from '../../core/ports/message.repository';
import { Message, MessageThread } from '../../core/entities/message.types';
import { DATABASE } from '../../../db/db.module';
import type { Database } from '../../../db/db.types';
import { schoolMessages } from '../../../../drizzle/schemas/messages/school-messages';
import { courseMessages } from '../../../../drizzle/schemas/messages/course-messages';
import { eq, and } from 'drizzle-orm';
import { schools } from '../../../../drizzle/schemas/schools/school';
import { publicUsers } from '../../../../drizzle/schemas/users/public-users';
import { courses } from '../../../../drizzle/schemas/courses/courses';
import { leads } from '../../../../drizzle/schemas/leads';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async createMessage(
    message: Omit<Message, 'id' | 'createdAt'>,
  ): Promise<Message> {
    if (message.receiverType === 'school') {
      // Mensaje de padre a escuela
      const [created] = await this.db
        .insert(schoolMessages)
        .values({
          schoolId: message.receiverId,
          publicUserId: message.senderId,
          senderRole: message.senderType === 'parent' ? 'public' : 'private',
          content: message.content,
        })
        .returning();
      return {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt,
        senderId: created.publicUserId,
        senderType: created.senderRole === 'public' ? 'parent' : 'school',
        receiverId: created.schoolId,
        receiverType: 'school',
        threadId: `${created.schoolId}_${created.publicUserId}`,
      };
    } else if (message.receiverType === 'parent') {
      // Mensaje de institución a padre
      if (message.senderType === 'course') {
        const [created] = await this.db
          .insert(courseMessages)
          .values({
            courseId: message.senderId,
            publicUserId: message.receiverId,
            senderRole: 'private',
            content: message.content,
          })
          .returning();
        return {
          id: created.id,
          content: created.content,
          createdAt: created.createdAt,
          senderId: created.courseId,
          senderType: 'course',
          receiverId: created.publicUserId,
          receiverType: 'parent',
          threadId: `${created.courseId}_${created.publicUserId}`,
        };
      } else {
        // Por defecto school
        const [created] = await this.db
          .insert(schoolMessages)
          .values({
            schoolId: message.senderId,
            publicUserId: message.receiverId,
            senderRole: 'private', // siempre escuela
            content: message.content,
          })
          .returning();
        return {
          id: created.id,
          content: created.content,
          createdAt: created.createdAt,
          senderId: created.schoolId,
          senderType: 'school',
          receiverId: created.publicUserId,
          receiverType: 'parent',
          threadId: `${created.schoolId}_${created.publicUserId}`,
        };
      }
    } else if (message.receiverType === 'course') {
      const [created] = await this.db
        .insert(courseMessages)
        .values({
          courseId: message.receiverId,
          publicUserId: message.senderId,
          senderRole: message.senderType === 'parent' ? 'public' : 'private',
          content: message.content,
        })
        .returning();
      return {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt,
        senderId: created.publicUserId,
        senderType: created.senderRole === 'public' ? 'parent' : 'school',
        receiverId: created.courseId,
        receiverType: 'course',
        threadId: `${created.courseId}_${created.publicUserId}`,
      };
    }
    throw new Error('Tipo de receptor no soportado');
  }

  async getMessagesByThread(threadId: string): Promise<Message[]> {
    // threadId: "schoolId_publicUserId" o "courseId_publicUserId"
    console.log('[getMessagesByThread] threadId recibido:', threadId);
    const [id, userId] = threadId.split('_', 2);
    console.log('[getMessagesByThread] id:', id, 'userId:', userId);
    if (!id || !userId) {
      console.error('[getMessagesByThread] threadId inválido:', threadId, { id, userId });
      throw new Error('threadId inválido');
    }

    // Determinar si es school o course por el contexto externo (el endpoint que llama)
    // Si el id existe en schoolMessages, es school, si existe en courseMessages, es course
    // Pero aquí asumimos que el endpoint ya sabe a cuál tabla consultar
    // Si el id es UUID de curso, buscar en courseMessages
    // Si el id es UUID de escuela, buscar en schoolMessages
    // Para mantener compatibilidad, intentamos ambos y devolvemos el que tenga mensajes
    const schoolRows = await this.db
      .select()
      .from(schoolMessages)
      .where(
        and(
          eq(schoolMessages.schoolId, id),
          eq(schoolMessages.publicUserId, userId),
        ),
      )
      .orderBy(schoolMessages.createdAt);
    if (schoolRows.length > 0) {
      return schoolRows.map((msg) => {
        const isParent = msg.senderRole === 'public';
        return {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          senderId: isParent ? msg.publicUserId : msg.schoolId,
          senderType: isParent ? 'parent' as const : 'school' as const,
          senderRole: msg.senderRole,
          receiverId: isParent ? msg.schoolId : msg.publicUserId,
          receiverType: isParent ? 'school' as const : 'parent' as const,
          threadId,
        };
      });
    }
    const courseRows = await this.db
      .select()
      .from(courseMessages)
      .where(
        and(
          eq(courseMessages.courseId, id),
          eq(courseMessages.publicUserId, userId),
        ),
      )
      .orderBy(courseMessages.createdAt);
    if (courseRows.length > 0) {
      return courseRows.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderId: msg.senderRole === 'public' ? msg.publicUserId : msg.courseId,
        senderType: msg.senderRole === 'public' ? 'parent' : 'course',
        senderRole: msg.senderRole,
        receiverId: msg.senderRole === 'public' ? msg.courseId : msg.publicUserId,
        receiverType: 'course',
        threadId,
      }));
    }
    throw new Error('threadId no soportado');
  }

  async getThreadsByParticipant(
    participantId: string,
    participantType: 'parent' | 'school' | 'course',
  ): Promise<any[]> {
    // parent: buscar threads donde publicUserId = participantId (en ambas tablas)
    // school: threads donde schoolId = participantId
    // course: threads donde courseId = participantId
    // Usar imports directos arriba del archivo

      if (!participantId || participantId === 'undefined') {
        throw new Error('El parámetro participantId es requerido y no puede ser undefined.');
      }
    let threads: any[] = [];
    if (participantType === 'parent') {
      // School threads
      const schoolRows = await this.db
        .select({
          schoolId: schoolMessages.schoolId,
          schoolName: schools.name,
          lastMessage: schoolMessages.content,
          lastMessageAt: schoolMessages.createdAt,
          lastSenderRole: schoolMessages.senderRole,
        })
        .from(schoolMessages)
        .leftJoin(schools, eq(schoolMessages.schoolId, schools.id))
        .where(eq(schoolMessages.publicUserId, participantId));
      threads = threads.concat(
        schoolRows.map((row) => ({
          schoolId: row.schoolId,
          schoolName: row.schoolName,
          lastMessage: row.lastMessage,
          lastMessageAt: row.lastMessageAt,
          lastSenderRole: row.lastSenderRole,
          threadHasUnread: false, // TODO: implementar lógica de no leídos
          unreadCount: 0,
        })),
      );
      // Course threads
      const courseRows = await this.db
        .select({
          courseId: courseMessages.courseId,
          courseName: courses.name,
          lastMessage: courseMessages.content,
          lastMessageAt: courseMessages.createdAt,
          lastSenderRole: courseMessages.senderRole,
        })
        .from(courseMessages)
        .leftJoin(courses, eq(courseMessages.courseId, courses.id))
        .where(eq(courseMessages.publicUserId, participantId));
      threads = threads.concat(
        courseRows.map((row) => ({
          courseId: row.courseId,
          courseName: row.courseName,
          lastMessage: row.lastMessage,
          lastMessageAt: row.lastMessageAt,
          lastSenderRole: row.lastSenderRole,
          threadHasUnread: false, // TODO: implementar lógica de no leídos
          unreadCount: 0,
        })),
      );
    } else if (participantType === 'school') {
          // 1. Buscar la escuela del owner para tener el schoolId y ownerId
          const [schoolRow] = await this.db
            .select({ id: schools.id, ownerId: schools.ownerId })
            .from(schools)
            .where(eq(schools.ownerId, participantId))
            .limit(1);

          const threadMap = new Map<string, any>();
          const schoolOwnerId = schoolRow?.ownerId ?? participantId;

          // 2. Obtener threads directos de la escuela
          if (schoolRow) {
            const schoolRows = await this.db
              .select({
                schoolId: schoolMessages.schoolId,
                publicUserId: schoolMessages.publicUserId,
                lastMessage: schoolMessages.content,
                lastMessageAt: schoolMessages.createdAt,
                lastSenderRole: schoolMessages.senderRole,
                publicUserName: publicUsers.name,
                leadStatus: leads.status,
              })
              .from(schoolMessages)
              .leftJoin(publicUsers, eq(schoolMessages.publicUserId, publicUsers.id))
              .leftJoin(
                leads,
                and(
                  eq(leads.userId, schoolMessages.publicUserId),
                  eq(leads.targetId, schoolMessages.schoolId),
                ),
              )
              .where(eq(schoolMessages.schoolId, schoolRow.id));

            for (const row of schoolRows) {
              const key = `school_${row.publicUserId}`;
              if (!threadMap.has(key) || threadMap.get(key).lastMessageAt < row.lastMessageAt) {
                threadMap.set(key, {
                  id: `${row.schoolId}_${row.publicUserId}`,
                  type: 'school',
                  publicUserId: row.publicUserId,
                  publicUserName: row.publicUserName || 'Usuario Público',
                  lastMessage: row.lastMessage,
                  lastMessageAt: row.lastMessageAt,
                  lastSenderRole: row.lastSenderRole,
                  threadHasUnread: false,
                  unreadCount: 0,
                  leadStatus: row.leadStatus || 'NUEVO',
                });
              }
            }
          }

          // 3. Obtener threads de cursos del mismo owner (siempre, no depende de school threads)
          const courseOwnerRows = await this.db
            .select({
              courseId: courseMessages.courseId,
              courseName: courses.name,
              publicUserId: courseMessages.publicUserId,
              publicUserName: publicUsers.name,
              lastMessage: courseMessages.content,
              lastMessageAt: courseMessages.createdAt,
              lastSenderRole: courseMessages.senderRole,
              leadStatus: leads.status,
            })
            .from(courseMessages)
            .leftJoin(courses, eq(courseMessages.courseId, courses.id))
            .leftJoin(publicUsers, eq(courseMessages.publicUserId, publicUsers.id))
            .leftJoin(
              leads,
              and(
                eq(leads.userId, courseMessages.publicUserId),
                eq(leads.targetId, courseMessages.courseId),
              ),
            )
            .where(eq(courses.ownerId, schoolOwnerId));

          for (const row of courseOwnerRows) {
            const key = `course_${row.courseId}_${row.publicUserId}`;
            if (!threadMap.has(key) || threadMap.get(key).lastMessageAt < row.lastMessageAt) {
              threadMap.set(key, {
                id: `${row.courseId}_${row.publicUserId}`,
                type: 'course',
                courseId: row.courseId,
                courseName: row.courseName,
                publicUserId: row.publicUserId,
                publicUserName: row.publicUserName || 'Usuario Público',
                lastMessage: row.lastMessage,
                lastMessageAt: row.lastMessageAt,
                lastSenderRole: row.lastSenderRole,
                threadHasUnread: false,
                unreadCount: 0,
                leadStatus: row.leadStatus || 'NUEVO',
              });
            }
          }

          return Array.from(threadMap.values());
    } else if (participantType === 'course') {
      // Buscar todos los cursos donde ownerId = participantId
      // y obtener los threads (conversaciones) con cada publicUserId
      const courseOwnerRows = await this.db
        .select({
          courseId: courseMessages.courseId,
          courseName: courses.name,
          publicUserId: courseMessages.publicUserId,
          publicUserName: publicUsers.name,
          lastMessage: courseMessages.content,
          lastMessageAt: courseMessages.createdAt,
          lastSenderRole: courseMessages.senderRole,
          leadStatus: leads.status,
        })
        .from(courseMessages)
        .leftJoin(courses, eq(courseMessages.courseId, courses.id))
        .leftJoin(publicUsers, eq(courseMessages.publicUserId, publicUsers.id))
        .leftJoin(
          leads,
          and(
            eq(leads.userId, courseMessages.publicUserId),
            eq(leads.targetId, courseMessages.courseId),
          ),
        )
        .where(eq(courses.ownerId, participantId));

      // Agrupar por courseId + publicUserId para obtener el último mensaje de cada conversación
      const threadMap = new Map<string, any>();
      for (const row of courseOwnerRows) {
        const key = `${row.courseId}_${row.publicUserId}`;
        if (!threadMap.has(key) || threadMap.get(key).lastMessageAt < row.lastMessageAt) {
          threadMap.set(key, {
            id: `${row.courseId}_${row.publicUserId}`,
            type: 'course',
            courseId: row.courseId,
            courseName: row.courseName,
            publicUserId: row.publicUserId,
            publicUserName: row.publicUserName || 'Usuario Público',
            lastMessage: row.lastMessage,
            lastMessageAt: row.lastMessageAt,
            lastSenderRole: row.lastSenderRole,
            threadHasUnread: false,
            unreadCount: 0,
            leadStatus: row.leadStatus || 'NUEVO',
          });
        }
      }
      return Array.from(threadMap.values());
    }

    // Para padres: agrupar por schoolId o courseId
    const threadMap = new Map<string, any>();
    for (const t of threads) {
      const id = t.schoolId || t.courseId;
      if (!threadMap.has(id) || threadMap.get(id).lastMessageAt < t.lastMessageAt) {
        threadMap.set(id, t);
      }
    }
    return Array.from(threadMap.values());
  }
}
