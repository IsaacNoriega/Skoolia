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
  id: string;
  publicUserId: string;
  publicUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
  leadStatus?: string;
  courseId?: string;
  courseName?: string;
  type?: 'school' | 'course';
}

export type LeadStage = 'nuevo_contacto' | 'interesado' | 'visita' | 'inscrito';

export function inferDefaultStage(thread: SchoolThread): LeadStage {
	if (thread.leadStatus) {
		const status = thread.leadStatus.toLowerCase();
		if (status === "inscrito") return "inscrito";
		if (status === "visita") return "visita";
		if (status === "interesado") return "interesado";
		if (status === "nuevo") return "nuevo_contacto";
	}

	if (thread.threadHasUnread) {
		return "nuevo_contacto";
	}

	if (thread.lastSenderRole === "private") {
		return "interesado";
	}

	return "nuevo_contacto";
}

export interface SchoolMessage {
  id: string;
  publicUserId: string;
  publicUserName: string;
  senderId: string;
  senderType: 'parent' | 'school' | 'course';
  senderRole: 'public' | 'private';
  content: string;
  createdAt: string;
}

export const messagesService = {
  async sendParentMessage(targetId: string, content: string, userId: string, targetType: 'school' | 'course' = 'school') {
    return api<ParentMessage>(`/messages`, {
      method: 'POST',
      body: {
        content,
        senderId: userId,
        senderType: 'parent',
        receiverId: targetId,
        receiverType: targetType,
        threadId: `${targetId}_${userId}`,
      },
    });
  },

  async listParentThreads(userId: string) {
    return api<ParentThread[]>(`/messages/parents?userId=${userId}`);
  },

  async listParentThreadMessages(schoolId: string, userId: string) {
    const threadId = `${schoolId}_${userId}`;
    return api<ParentMessage[]>(`/messages/thread/${threadId}`);
  },

  async listSchoolThreads(ownerId: string) {
    return api<SchoolThread[]>(`/messages/threads?participantId=${ownerId}&participantType=school`);
  },

  async listCourseThreadsByOwner(ownerId: string) {
    return api<SchoolThread[]>(`/messages/courses/me/threads?ownerId=${ownerId}`);
  },

  async listSchoolThreadMessages(publicUserId: string, schoolId: string) {
    const threadId = `${schoolId}_${publicUserId}`;
    return api<SchoolMessage[]>(`/messages/thread/${threadId}`);
  },

  async listThreadMessages(threadId: string) {
    return api<SchoolMessage[]>(`/messages/thread/${threadId}`);
  },

  async listCourseThreadMessagesByOwner(publicUserId: string, courseId: string) {
    const threadId = `${courseId}_${publicUserId}`;
    return api<SchoolMessage[]>(`/messages/thread/${threadId}`);
  },

  async sendSchoolMessage(publicUserId: string, content: string, schoolId: string) {
    return api<SchoolMessage>(`/messages`, {
      method: 'POST',
      body: {
        content,
        senderId: schoolId,
        senderType: 'school',
        receiverId: publicUserId,
        receiverType: 'parent',
        threadId: `${schoolId}_${publicUserId}`,
      },
    });
  },

  async sendCourseMessage(publicUserId: string, content: string, courseId: string) {
    return api<SchoolMessage>(`/messages`, {
      method: 'POST',
      body: {
        content,
        senderId: courseId,
        senderType: 'course',
        receiverId: publicUserId,
        receiverType: 'parent',
        threadId: `${courseId}_${publicUserId}`,
      },
    });
  },
};
