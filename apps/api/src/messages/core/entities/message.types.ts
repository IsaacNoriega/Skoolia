export class Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderType: 'parent' | 'school';
  receiverId: string;
  receiverType: 'school' | 'course';
  threadId: string;
}

export type MessageThread = {
  id: string;
  participants: Array<{ id: string; type: 'parent' | 'school' | 'course' }>;
  lastMessageAt: Date;
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
