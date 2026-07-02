import { Student, AttendanceRecord, School, Teacher, HouseMaster, House, ClassSection } from '../types.ts';

export async function fetchSchools(): Promise<School[]> {
  const res = await fetch('/api/schools');
  if (!res.ok) throw new Error('Failed to fetch schools');
  return res.json();
}

export async function fetchClasses(): Promise<ClassSection[]> {
  const res = await fetch('/api/classes');
  if (!res.ok) throw new Error('Failed to fetch classes');
  return res.json();
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const res = await fetch('/api/teachers');
  if (!res.ok) throw new Error('Failed to fetch teachers');
  return res.json();
}

export async function fetchHouseMasters(): Promise<HouseMaster[]> {
  const res = await fetch('/api/house-masters');
  if (!res.ok) throw new Error('Failed to fetch house masters');
  return res.json();
}

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch('/api/students');
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const res = await fetch('/api/attendance');
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

export async function syncAuthUser(uid: string, email: string, name?: string) {
  const res = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, name }),
  });
  if (!res.ok) throw new Error('Failed to synchronize auth user');
  return res.json();
}

export async function updateAuthUserRole(uid: string, role: string, schoolId?: string, classId?: string) {
  const res = await fetch('/api/auth/role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, role, schoolId, classId }),
  });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json();
}

export async function saveStudent(student: Student): Promise<Student> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error('Failed to save student profile');
  return res.json();
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete student');
}

export async function saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to save attendance record');
  return res.json();
}

export async function saveClass(cls: ClassSection): Promise<ClassSection> {
  const res = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cls),
  });
  if (!res.ok) throw new Error('Failed to save class');
  return res.json();
}

export async function deleteClass(id: string): Promise<void> {
  const res = await fetch(`/api/classes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete class');
}

export async function saveTeacher(teacher: Teacher): Promise<Teacher> {
  const res = await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacher),
  });
  if (!res.ok) throw new Error('Failed to save teacher');
  return res.json();
}

export async function deleteTeacher(id: string): Promise<void> {
  const res = await fetch(`/api/teachers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete teacher');
}

export async function saveHouseMaster(hm: HouseMaster): Promise<HouseMaster> {
  const res = await fetch('/api/house-masters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hm),
  });
  if (!res.ok) throw new Error('Failed to save house master');
  return res.json();
}

export async function deleteHouseMaster(house: House, schoolId: string): Promise<void> {
  const res = await fetch(`/api/house-masters/${house}/${schoolId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete house master');
}
