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
  async sendParentMessage(schoolId: string, content: string) {
    return api<ParentMessage>(`/messages/schools/${schoolId}`, {
      method: 'POST',
      body: { content },
    });
  },

  async listParentThreads(userId: string) {
    return api<ParentThread[]>(`/messages/parents?userId=${userId}`);
  },

  async listParentThreadMessages(schoolId: string) {
    return api<ParentMessage[]>(`/messages/parents/${schoolId}`);
  },

  async listSchoolThreads() {
    return api<SchoolThread[]>('/messages/schools/me');
  },

  async listSchoolThreadMessages(publicUserId: string) {
    return api<SchoolMessage[]>(`/messages/schools/me/${publicUserId}`);
  },

  async sendSchoolMessage(publicUserId: string, content: string) {
    return api<SchoolMessage>(`/messages/schools/me/${publicUserId}`, {
      method: 'POST',
      body: { content },
    });
  },
};
