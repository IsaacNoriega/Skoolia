export class Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderType: 'parent' | 'school' | 'course';
  senderRole?: 'public' | 'private';
  receiverId: string;
  receiverType: 'school' | 'course' | 'parent';
  threadId: string;
}

export type MessageThread = {
  id: string;
  participants?: Array<{ id: string; type: 'parent' | 'school' | 'course' }>;
  lastMessageAt: Date | string;
  type?: 'school' | 'course';
  courseId?: string;
  courseName?: string;
  publicUserId?: string;
  publicUserName?: string;
  lastMessage?: string;
  lastSenderRole?: string;
  unreadCount?: number;
  threadHasUnread?: boolean;
  leadStatus?: string;
};
// Mensajes de curso
export interface CourseMessage {
  id: string;
  courseId: string;
  publicUserId: string;
  senderRole: 'public' | 'private';
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface CourseThreadSummary {
  courseId: string;
  courseName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
}

export interface CourseThreadSummaryForOwner {
  courseId: string;
  courseName: string;
  publicUserId: string;
  publicUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: 'public' | 'private';
  unreadCount: number;
  threadHasUnread: boolean;
  leadStatus?: string;
}
export type SenderRole = 'public' | 'private';

export interface SchoolMessage {
  id: string;
  schoolId: string;
  publicUserId: string;
  senderRole: SenderRole;
  content: string;
  createdAt: Date;
}

export interface ParentThreadSummary {
  schoolId: string;
  schoolName: string;
  lastMessage: string;
  lastMessageAt: Date;
  lastSenderRole: SenderRole;
}

export interface SchoolThreadSummary {
  publicUserId: string;
  publicUserName: string;
  lastMessage: string;
  lastMessageAt: Date;
  lastSenderRole: SenderRole;
  unreadCount: number;
  threadHasUnread: boolean;
  leadStatus?: string;
}

export interface ParentThreadMessage {
  id: string;
  schoolId: string;
  schoolName: string;
  senderRole: SenderRole;
  content: string;
  createdAt: Date;
}

export interface SchoolThreadMessage {
  id: string;
  publicUserId: string;
  publicUserName: string;
  senderRole: SenderRole;
  content: string;
  createdAt: Date;
}
