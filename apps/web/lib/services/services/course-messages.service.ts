import { api } from '../api';

export interface CourseThread {
  courseId: string;
  courseName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
}

export interface CourseMessage {
  id: string;
  courseId: string;
  publicUserId: string;
  senderRole: 'public' | 'private';
  content: string;
  createdAt: string;
}

export const courseMessagesService = {
  async sendCourseMessage(courseId: string, content: string, user?: { id: string; role: 'public' | 'private' }) {
    if (!user) throw new Error('Usuario no autenticado');
    return api<CourseMessage>(`/messages/courses/${courseId}`, {
      method: 'POST',
      body: {
        content,
        senderId: user.id,
        senderType: user.role === 'public' ? 'parent' : 'school',
      },
    });
  },

  async listCourseThreads(userId: string) {
    return api<CourseThread[]>(`/messages/courses/threads?userId=${userId}`);
  },

  async listCourseThreadMessages(courseId: string, userId: string) {
    return api<CourseMessage[]>(`/messages/courses/${courseId}/messages?userId=${userId}`);
  },
  
  // ----------- PRIVADO (dueño del curso) -----------
  async listCourseThreadsByOwner() {
    return api<CourseThreadForOwner[]>(`/messages/courses/me/threads`);
  },
  
  async listCourseThreadMessagesByOwner(courseId: string, publicUserId: string) {
    return api<CourseMessage[]>(`/messages/courses/me/${courseId}/${publicUserId}/messages`);
  },
}
export interface CourseThreadForOwner {
  courseId: string;
  courseName: string;
  publicUserId: string;
  publicUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
}
