
export enum Role {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  link?: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  rating: number; // 1-5
  message: string;
  createdAt: Date;
}