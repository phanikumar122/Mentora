export type Role = 'ROLE_STUDENT' | 'ROLE_TEACHER' | 'ROLE_ADMIN' | 'ROLE_PARENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  teacherName?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subjectName?: string;
  dueDate: string;
  maxMarks: number;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
}

export interface AttendanceRecord {
  id: number;
  subjectName: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  percentage?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
}

export interface DiscussionPost {
  id: number;
  title: string;
  content: string;
  authorName: string;
  category: 'ACADEMIC' | 'GENERAL' | 'EXAM_PREP' | 'PROJECTS';
  upvotesCount: number;
  repliesCount?: number;
  createdAt: string;
}

export interface StudyMaterial {
  id: number;
  title: string;
  description: string;
  subjectName: string;
  materialType: 'DOCUMENT' | 'SLIDES' | 'VIDEO_LINK' | 'CODE_SAMPLE';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id?: number | string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  roomId?: string;
  content: string;
  sentAt: string;
}
