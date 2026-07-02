/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, ClassSection, AttendanceRecord, House, AttendanceStatus, School, Teacher, HouseMaster } from './types';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'JNV-Vattem',
    name: 'JNV Vattem (Nagarkurnool)',
    region: 'Hyderabad',
    state: 'Telangana',
    pinCode: '509204',
    passwordHash: 'vattem123',
  },
  {
    id: 'JNV-Rangareddy',
    name: 'JNV Rangareddy',
    region: 'Hyderabad',
    state: 'Telangana',
    pinCode: '501203',
    passwordHash: 'rangareddy123',
  },
  {
    id: 'JNV-Medak',
    name: 'JNV Medak',
    region: 'Hyderabad',
    state: 'Telangana',
    pinCode: '502001',
    passwordHash: 'medak123',
  },
  {
    id: 'JNV-Pune',
    name: 'JNV Pune',
    region: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
    passwordHash: 'pune123',
  },
];

export const INITIAL_CLASSES: ClassSection[] = [
  { id: 'c6', name: 'Class VI', classTeacher: 'Mr. K. Ramarao' },
  { id: 'c7', name: 'Class VII', classTeacher: 'Mrs. G. Sunitha' },
  { id: 'c8', name: 'Class VIII', classTeacher: 'Mr. S. K. Naidu' },
  { id: 'c9', name: 'Class IX', classTeacher: 'Mrs. P. Lakshmi' },
  { id: 'c10', name: 'Class X', classTeacher: 'Mr. V. Chandra' },
  { id: 'c11_sci', name: 'Class XI (Science)', classTeacher: 'Dr. M. Prabhakar' },
  { id: 'c12_sci', name: 'Class XII (Science)', classTeacher: 'Mr. J. Srinivasan' },
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Mr. K. Ramarao', schoolId: 'JNV-Vattem', designation: 'PGT Mathematics', phone: '9848022311' },
  { id: 't2', name: 'Mrs. G. Sunitha', schoolId: 'JNV-Vattem', designation: 'TGT Social Studies', phone: '9848022312' },
  { id: 't3', name: 'Mr. S. K. Naidu', schoolId: 'JNV-Vattem', designation: 'PGT English', phone: '9848022313' },
  { id: 't4', name: 'Mrs. P. Lakshmi', schoolId: 'JNV-Vattem', designation: 'TGT Science', phone: '9848022314' },
  { id: 't5', name: 'Mr. V. Chandra', schoolId: 'JNV-Vattem', designation: 'PGT Physics', phone: '9848022315' },
  { id: 't6', name: 'Dr. M. Prabhakar', schoolId: 'JNV-Vattem', designation: 'PGT Chemistry', phone: '9848022316' },
  { id: 't7', name: 'Mr. J. Srinivasan', schoolId: 'JNV-Vattem', designation: 'PGT Biology', phone: '9848022317' },
  { id: 't8', name: 'Mr. Rajesh Kumar', schoolId: 'JNV-Vattem', designation: 'TGT Physical Education', phone: '9848022318' },
  { id: 't9', name: 'Mrs. S. Anitha', schoolId: 'JNV-Vattem', designation: 'PGT Computer Science', phone: '9848022319' },
  { id: 't10', name: 'Mr. P. Venkat', schoolId: 'JNV-Vattem', designation: 'TGT Hindi', phone: '9848022320' },
  { id: 't11', name: 'Mr. K. Raghavan', schoolId: 'JNV-Vattem', designation: 'PGT Telugu', phone: '9848022321' },
];

export const INITIAL_HOUSE_MASTERS: HouseMaster[] = [
  { house: 'Aravalli', schoolId: 'JNV-Vattem', masterName: 'Mr. Rajesh Kumar' },
  { house: 'Nilgiri', schoolId: 'JNV-Vattem', masterName: 'Mrs. S. Anitha' },
  { house: 'Shivalik', schoolId: 'JNV-Vattem', masterName: 'Mr. P. Venkat' },
  { house: 'Udaygiri', schoolId: 'JNV-Vattem', masterName: 'Mr. K. Raghavan' },
  
  { house: 'Aravalli', schoolId: 'JNV-Rangareddy', masterName: 'Mr. B. Srinivasa' },
  { house: 'Nilgiri', schoolId: 'JNV-Rangareddy', masterName: 'Mrs. S. Radhika' },
  { house: 'Shivalik', schoolId: 'JNV-Rangareddy', masterName: 'Mr. M. Sridhar' },
  { house: 'Udaygiri', schoolId: 'JNV-Rangareddy', masterName: 'Mr. T. Naresh' },
];

export const INITIAL_STUDENTS: Student[] = [];

/**
 * Programmatically generates past attendance records for realistic data visualisations.
 * Generates records for the past 14 calendar days prior to 2026-06-29, skipping Sundays.
 */
export function generateInitialAttendance(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statusOptions: AttendanceStatus[] = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'A', 'L', 'OD']; // mostly present, minor absents
  
  // Start from June 12, 2026 to June 29, 2026
  const startDate = new Date('2026-06-12');
  const endDate = new Date('2026-06-29');

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dateStr = d.toISOString().split('T')[0];

    students.forEach((student) => {
      // Seed a pseudo-random but deterministic status based on student name and date hash
      const hash = (student.name.charCodeAt(0) + student.name.charCodeAt(1 || 0) + d.getDate()) % statusOptions.length;
      let status = statusOptions[hash];
      
      // Let's make sure good students stay good, and general attendance is ~90%
      if (hash < 8) {
        status = 'P';
      }

      records.push({
        id: `${student.schoolId}_${student.id}_${dateStr}`,
        schoolId: student.schoolId,
        studentId: student.id,
        date: dateStr,
        status: status,
        markedBy: 'System Seed',
        markedAt: `${dateStr}T09:00:00.000Z`,
      });
    });
  }

  return records;
}
