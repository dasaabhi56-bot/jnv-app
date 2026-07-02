import { db } from './index.ts';
import { schools, classes, teachers, houseMasters, students, attendance, users } from './schema.ts';
import { eq, and } from 'drizzle-orm';
import { INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_TEACHERS, INITIAL_HOUSE_MASTERS, generateInitialAttendance } from '../initialData.ts';
import { Student, AttendanceRecord, AttendanceStatus, House } from '../types.ts';

const SEED_STUDENTS = [
  { id: 's1', schoolId: 'JNV-Vattem', name: 'Ramesh Kumar', rollNo: '01', classId: 'c6', house: 'Aravalli' as const, gender: 'M' as const, admissionNo: 'V-2026/001' },
  { id: 's2', schoolId: 'JNV-Vattem', name: 'Sita Devi', rollNo: '02', classId: 'c6', house: 'Nilgiri' as const, gender: 'F' as const, admissionNo: 'V-2026/002' },
  { id: 's3', schoolId: 'JNV-Vattem', name: 'Amit Patel', rollNo: '03', classId: 'c6', house: 'Shivalik' as const, gender: 'M' as const, admissionNo: 'V-2026/003' },
  { id: 's4', schoolId: 'JNV-Vattem', name: 'Priya Sharma', rollNo: '01', classId: 'c7', house: 'Udaygiri' as const, gender: 'F' as const, admissionNo: 'V-2026/010' },
  { id: 's5', schoolId: 'JNV-Vattem', name: 'Vijay Singh', rollNo: '02', classId: 'c7', house: 'Aravalli' as const, gender: 'M' as const, admissionNo: 'V-2026/011' },
  { id: 's6', schoolId: 'JNV-Vattem', name: 'Kavitha Reddy', rollNo: '01', classId: 'c8', house: 'Nilgiri' as const, gender: 'F' as const, admissionNo: 'V-2026/020' },
  { id: 's7', schoolId: 'JNV-Vattem', name: 'Rahul Prasad', rollNo: '02', classId: 'c8', house: 'Shivalik' as const, gender: 'M' as const, admissionNo: 'V-2026/021' },
  { id: 's8', schoolId: 'JNV-Vattem', name: 'Sneha Rao', rollNo: '01', classId: 'c9', house: 'Udaygiri' as const, gender: 'F' as const, admissionNo: 'V-2026/030' },
  { id: 's9', schoolId: 'JNV-Vattem', name: 'Mohammad Ali', rollNo: '02', classId: 'c9', house: 'Aravalli' as const, gender: 'M' as const, admissionNo: 'V-2026/031' },
  { id: 's10', schoolId: 'JNV-Vattem', name: 'Anjali Nair', rollNo: '01', classId: 'c10', house: 'Nilgiri' as const, gender: 'F' as const, admissionNo: 'V-2026/040' },
  { id: 's11', schoolId: 'JNV-Vattem', name: 'Suresh Babu', rollNo: '02', classId: 'c10', house: 'Shivalik' as const, gender: 'M' as const, admissionNo: 'V-2026/041' },
  { id: 's12', schoolId: 'JNV-Vattem', name: 'Deepika Choudhury', rollNo: '01', classId: 'c11_sci', house: 'Udaygiri' as const, gender: 'F' as const, admissionNo: 'V-2026/050' },
  { id: 's13', schoolId: 'JNV-Vattem', name: 'Arjun Sen', rollNo: '02', classId: 'c11_sci', house: 'Aravalli' as const, gender: 'M' as const, admissionNo: 'V-2026/051' },
  { id: 's14', schoolId: 'JNV-Vattem', name: 'Meera Krishnan', rollNo: '01', classId: 'c12_sci', house: 'Nilgiri' as const, gender: 'F' as const, admissionNo: 'V-2026/060' },
  { id: 's15', schoolId: 'JNV-Vattem', name: 'Nikhil Verma', rollNo: '02', classId: 'c12_sci', house: 'Shivalik' as const, gender: 'M' as const, admissionNo: 'V-2026/061' },
];

export async function bootstrapDatabase() {
  try {
    const existingSchools = await db.select().from(schools);
    if (existingSchools.length === 0) {
      console.log('Seeding initial JNV Vattem schools and directories...');
      
      // Seed schools
      await db.insert(schools).values(INITIAL_SCHOOLS);

      // Seed classes
      await db.insert(classes).values(INITIAL_CLASSES);

      // Seed teachers
      await db.insert(teachers).values(INITIAL_TEACHERS);

      // Seed house masters
      await db.insert(houseMasters).values(INITIAL_HOUSE_MASTERS);

      // Seed default student profiles
      await db.insert(students).values(SEED_STUDENTS);

      // Generate and seed historical attendance
      const records = generateInitialAttendance(SEED_STUDENTS);
      if (records.length > 0) {
        // Bulk insert attendance records in chunks if there are many to prevent parameter limits
        const chunkSize = 100;
        for (let i = 0; i < records.length; i += chunkSize) {
          const chunk = records.slice(i, i + chunkSize);
          await db.insert(attendance).values(chunk);
        }
      }

      console.log('Database bootstrap and seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error during database bootstrap:', error);
  }
}

// Users and profile synchronization
export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name,
        role: 'Teacher',
        schoolId: 'JNV-Vattem',
        classId: 'c6'
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name: name || '',
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database user synchronization failed.', { cause: error });
  }
}

export async function updateUserRole(uid: string, role: string, schoolId?: string, classId?: string) {
  try {
    const result = await db.update(users)
      .set({
        role,
        ...(schoolId && { schoolId }),
        ...(classId && { classId }),
      })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    throw new Error('Failed to update user profile in database.', { cause: error });
  }
}

export async function getSchoolsList() {
  try {
    return await db.select().from(schools);
  } catch (error) {
    console.error('Error in getSchoolsList:', error);
    throw new Error('Failed to retrieve schools directory.', { cause: error });
  }
}

export async function getClassesList() {
  try {
    return await db.select().from(classes);
  } catch (error) {
    console.error('Error in getClassesList:', error);
    throw new Error('Failed to retrieve class list.', { cause: error });
  }
}

export async function getTeachersList() {
  try {
    return await db.select().from(teachers);
  } catch (error) {
    console.error('Error in getTeachersList:', error);
    throw new Error('Failed to retrieve teachers directory.', { cause: error });
  }
}

export async function getHouseMastersList() {
  try {
    return await db.select().from(houseMasters);
  } catch (error) {
    console.error('Error in getHouseMastersList:', error);
    throw new Error('Failed to retrieve house masters list.', { cause: error });
  }
}

export async function getStudentsList() {
  try {
    return await db.select().from(students);
  } catch (error) {
    console.error('Error in getStudentsList:', error);
    throw new Error('Failed to retrieve student roster.', { cause: error });
  }
}

export async function getAttendanceList() {
  try {
    return await db.select().from(attendance);
  } catch (error) {
    console.error('Error in getAttendanceList:', error);
    throw new Error('Failed to retrieve attendance register.', { cause: error });
  }
}

export async function saveStudentProfile(studentData: Student) {
  try {
    const result = await db.insert(students)
      .values(studentData)
      .onConflictDoUpdate({
        target: students.id,
        set: {
          schoolId: studentData.schoolId,
          name: studentData.name,
          rollNo: studentData.rollNo,
          classId: studentData.classId,
          house: studentData.house,
          gender: studentData.gender,
          admissionNo: studentData.admissionNo,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveStudentProfile:', error);
    throw new Error('Failed to save student profile in database.', { cause: error });
  }
}

export async function removeStudentFromDb(id: string) {
  try {
    // Delete historical attendance first to prevent orphan foreign keys
    await db.delete(attendance).where(eq(attendance.studentId, id));
    // Delete student
    return await db.delete(students).where(eq(students.id, id));
  } catch (error) {
    console.error('Error in removeStudentFromDb:', error);
    throw new Error('Failed to delete student from database.', { cause: error });
  }
}

export async function saveAttendanceRecord(record: AttendanceRecord) {
  try {
    const result = await db.insert(attendance)
      .values(record)
      .onConflictDoUpdate({
        target: attendance.id,
        set: {
          status: record.status,
          markedBy: record.markedBy,
          markedAt: record.markedAt,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveAttendanceRecord:', error);
    throw new Error('Failed to submit attendance mark.', { cause: error });
  }
}

export async function saveClassSection(cls: { id: string; name: string; classTeacher?: string }) {
  try {
    const result = await db.insert(classes)
      .values(cls)
      .onConflictDoUpdate({
        target: classes.id,
        set: {
          name: cls.name,
          classTeacher: cls.classTeacher || '',
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveClassSection:', error);
    throw new Error('Failed to save class section.', { cause: error });
  }
}

export async function deleteClassSection(id: string) {
  try {
    return await db.delete(classes).where(eq(classes.id, id));
  } catch (error) {
    console.error('Error in deleteClassSection:', error);
    throw new Error('Failed to delete class section.', { cause: error });
  }
}

export async function saveTeacherProfile(teacherData: { id: string; name: string; schoolId: string; designation: string; phone?: string }) {
  try {
    const result = await db.insert(teachers)
      .values(teacherData)
      .onConflictDoUpdate({
        target: teachers.id,
        set: {
          name: teacherData.name,
          schoolId: teacherData.schoolId,
          designation: teacherData.designation,
          phone: teacherData.phone || '',
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveTeacherProfile:', error);
    throw new Error('Failed to save teacher profile.', { cause: error });
  }
}

export async function deleteTeacherProfile(id: string) {
  try {
    return await db.delete(teachers).where(eq(teachers.id, id));
  } catch (error) {
    console.error('Error in deleteTeacherProfile:', error);
    throw new Error('Failed to delete teacher profile.', { cause: error });
  }
}

export async function saveHouseMasterProfile(masterData: { house: House; schoolId: string; masterName: string }) {
  try {
    const result = await db.insert(houseMasters)
      .values(masterData)
      .onConflictDoUpdate({
        target: [houseMasters.house, houseMasters.schoolId],
        set: {
          masterName: masterData.masterName,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveHouseMasterProfile:', error);
    throw new Error('Failed to save house master details.', { cause: error });
  }
}

export async function deleteHouseMasterProfile(houseName: House, schoolId: string) {
  try {
    return await db.delete(houseMasters).where(and(eq(houseMasters.house, houseName), eq(houseMasters.schoolId, schoolId)));
  } catch (error) {
    console.error('Error in deleteHouseMasterProfile:', error);
    throw new Error('Failed to delete house master profile.', { cause: error });
  }
}
