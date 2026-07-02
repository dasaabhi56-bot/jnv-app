import { pgTable, text, timestamp, serial, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (linked to Firebase Auth uid)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('Teacher'), // 'Teacher' | 'Principal' | 'Regional'
  schoolId: text('school_id').default('JNV-Vattem'),
  classId: text('class_id').default('c6'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Schools table
export const schools = pgTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  state: text('state').notNull(),
  pinCode: text('pin_code').notNull(),
  passwordHash: text('password_hash').notNull(),
});

// Classes table
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  classTeacher: text('class_teacher'),
});

// Teachers table
export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  schoolId: text('school_id').notNull(),
  designation: text('designation').notNull(),
  phone: text('phone'),
});

// House Masters table (Composite Primary Key)
export const houseMasters = pgTable('house_masters', {
  house: text('house').notNull(),
  schoolId: text('school_id').notNull(),
  masterName: text('master_name').notNull(),
}, (table) => [
  primaryKey({ columns: [table.house, table.schoolId] })
]);

// Students table
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  rollNo: text('roll_no').notNull(),
  classId: text('class_id').notNull(),
  house: text('house').notNull(),
  gender: text('gender').notNull(),
  admissionNo: text('admission_no').notNull(),
});

// Attendance table
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(), // schoolId_studentId_date
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // 'P' | 'A' | 'L' | 'OD' | 'NR'
  markedBy: text('marked_by').notNull(),
  markedAt: text('marked_at').notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classSection: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  attendanceRecords: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
}));
