/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Teacher' | 'Principal' | 'Regional';

export type House = 'Aravalli' | 'Nilgiri' | 'Shivalik' | 'Udaygiri' | 'Unassigned';

export type AttendanceStatus = 'P' | 'A' | 'L' | 'OD' | 'NR'; // Present, Absent, Leave, On Duty, Not Recorded

export interface School {
  id: string; // school ID used for login e.g. "JNV-Vattem"
  name: string;
  region: string; // e.g., "Hyderabad", "Pune", "Jaipur", "Bhopal", "Chandigarh", "Patna", "Shillong", "Lucknow"
  state: string;
  pinCode: string;
  passwordHash: string; // login password
}

export interface Student {
  id: string;
  schoolId: string; // reference to School
  name: string;
  rollNo: string;
  classId: string;
  house: House;
  gender: 'M' | 'F';
  admissionNo: string;
}

export interface ClassSection {
  id: string;
  name: string;
  classTeacher: string;
}

export interface Teacher {
  id: string;
  name: string;
  schoolId: string;
  designation: string;
  phone?: string;
}

export interface HouseMaster {
  house: House;
  schoolId: string;
  masterName: string;
}

export interface AttendanceRecord {
  id: string; // key: `${schoolId}_${studentId}_${date}`
  schoolId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy: string;
  markedAt: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  leave: number;
  od: number; // On Duty
  nr: number; // Not Recorded
  total: number;
  percentage: number;
}
