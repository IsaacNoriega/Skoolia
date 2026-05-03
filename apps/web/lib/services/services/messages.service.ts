import { api } from '../api';

export interface ParentThread {
  schoolId: string;
  schoolName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
}

export interface ParentMessage {
  id: string;
  schoolId: string;
  schoolName: string;
  senderId?: string;
  senderType?: 'parent' | 'school';
  senderRole: 'public' | 'private';
  content: string;
  createdAt: string;
}

export interface SchoolThread {
  publicUserId: string;
  publicUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
}

export interface SchoolMessage {
  id: string;
  publicUserId: string;
  publicUserName: string;
  senderRole: 'public' | 'private';
  content: string;
  createdAt: string;
}

export const messagesService = {
  async sendParentMessage(schoolId: string, content: string, userId: string) {
    // Usa el endpoint /messages (POST) con el body esperado por el backend
    return api<ParentMessage>(`/messages`, {
      method: 'POST',
      body: {
        content,
        senderId: userId,
        senderType: 'parent',
        receiverId: schoolId,
        receiverType: 'school',
        threadId: `${schoolId}_${userId}`,
      },
    });
  },

  async listParentThreads(userId: string) {
    return api<ParentThread[]>(`/messages/parents?userId=${userId}`);
  },

  async listParentThreadMessages(schoolId: string, userId: string) {
    // El threadId es schoolId_userId
    const threadId = `${schoolId}_${userId}`;
    return api<ParentMessage[]>(`/messages/thread/${threadId}`);
  },

  async listSchoolThreads(ownerId: string) {
    // Usa el endpoint existente de threads con participantType=school
    return api<SchoolThread[]>(`/messages/threads?participantId=${ownerId}&participantType=school`);
  },

  async listSchoolThreadMessages(publicUserId: string, ownerId: string) {
    // El threadId es ownerId_publicUserId
    const threadId = `${ownerId}_${publicUserId}`;
    return api<SchoolMessage[]>(`/messages/thread/${threadId}`);
  },

  async sendSchoolMessage(publicUserId: string, content: string, schoolId: string) {
    // El threadId es schoolId_publicUserId
    const threadId = `${schoolId}_${publicUserId}`;
    return api<SchoolMessage>(`/messages`, {
      method: 'POST',
      body: {
        content,
        senderId: schoolId,
        senderType: 'school',
        receiverId: publicUserId,
        receiverType: 'parent',
        threadId,
      },
    });
  },
};
