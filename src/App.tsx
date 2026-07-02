/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TeacherView } from './components/TeacherView';
import { PrincipalView } from './components/PrincipalView';
import { RegionalView } from './components/RegionalView';
import { StudentHistoryModal } from './components/StudentHistoryModal';
import { Student, ClassSection, AttendanceRecord, UserRole, AttendanceStatus, School, Teacher, HouseMaster, House } from './types';
import { INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_SCHOOLS, INITIAL_TEACHERS, INITIAL_HOUSE_MASTERS, generateInitialAttendance } from './initialData';
import { AlertCircle, BookOpen, Heart, Shield, Lock, LogOut, Key, Check, Sparkles } from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import * as api from './lib/api.ts';

export default function App() {
  // 1. Schools Directory State
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);

  // 2. Authentication and Role States
  const [role, setRole] = useState<UserRole>('Teacher');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('JNV-Vattem');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if user was authenticated locally or through session
    return localStorage.getItem('jnv_is_authenticated') === 'true';
  });
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Login form inputs
  const [loginSchoolId, setLoginSchoolId] = useState('JNV-Vattem');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 3. Core Persistent States (Students & Attendance Register)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>(INITIAL_CLASSES);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [houseMasters, setHouseMasters] = useState<HouseMaster[]>(INITIAL_HOUSE_MASTERS);

  const [selectedClassId, setSelectedClassId] = useState<string>('c6');
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-29'); // Seeding date for initial visual graphs
  const [activeStudentIdForHistory, setActiveStudentIdForHistory] = useState<string | null>(null);

  // Load database data
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSchools, fetchedClasses, fetchedTeachers, fetchedHouseMasters, fetchedStudents, fetchedAttendance] = await Promise.all([
        api.fetchSchools(),
        api.fetchClasses(),
        api.fetchTeachers(),
        api.fetchHouseMasters(),
        api.fetchStudents(),
        api.fetchAttendance(),
      ]);

      if (fetchedSchools.length > 0) setSchools(fetchedSchools);
      if (fetchedClasses.length > 0) setClasses(fetchedClasses);
      if (fetchedTeachers.length > 0) setTeachers(fetchedTeachers);
      if (fetchedHouseMasters.length > 0) setHouseMasters(fetchedHouseMasters);
      setStudents(fetchedStudents);
      setAttendance(fetchedAttendance);
    } catch (error) {
      console.error('Failed to sync with Cloud SQL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronize with database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDatabaseData();
    }
  }, [isAuthenticated]);

  // Keep authenticated state saved
  useEffect(() => {
    localStorage.setItem('jnv_is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  // Google Single Sign-In Authentication handler
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      setLoginError('');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      setGoogleUser(user);

      // Sync user profile with Cloud SQL PostgreSQL
      const syncedUser = await api.syncAuthUser(user.uid, user.email || '', user.displayName || '');

      setRole(syncedUser.role || 'Teacher');
      setSelectedSchoolId(syncedUser.schoolId || 'JNV-Vattem');
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      setLoginError(error.message || 'Google Sign-In authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform traditional school login check
  const handleSchoolLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = schools.find(s => s.id === loginSchoolId);
    if (!targetSchool) {
      setLoginError('Invalid school ID selected.');
      return;
    }

    if (targetSchool.passwordHash === loginPassword) {
      setSelectedSchoolId(loginSchoolId);
      setIsAuthenticated(true);
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('Incorrect password credentials for ' + targetSchool.name);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setGoogleUser(null);
    setLoginPassword('');
  };

  // 4. State Actions synced with Cloud SQL

  const handleUpdateStatus = async (studentId: string, date: string, status: AttendanceStatus) => {
    const recordId = `${selectedSchoolId}_${studentId}_${date}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      schoolId: selectedSchoolId,
      studentId,
      date,
      status,
      markedBy: role,
      markedAt: new Date().toISOString(),
    };

    // Optimistically update local React state
    setAttendance((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === recordId);
      const updated = [...prev];
      if (existingIdx > -1) {
        updated[existingIdx] = newRecord;
      } else {
        updated.push(newRecord);
      }
      return updated;
    });

    // Save to PostgreSQL via API
    try {
      await api.saveAttendance(newRecord);
    } catch (error) {
      console.error('Failed to sync attendance record to Cloud SQL:', error);
    }
  };

  const handleMarkAllPresent = async (classId: string, date: string) => {
    const classStudents = students.filter((s) => s.classId === classId && s.schoolId === selectedSchoolId);
    
    // Optimistically update locally
    setAttendance((prev) => {
      const updated = [...prev];
      classStudents.forEach((student) => {
        const recordId = `${selectedSchoolId}_${student.id}_${date}`;
        const existingIdx = updated.findIndex((r) => r.id === recordId);
        const newRec = {
          id: recordId,
          schoolId: selectedSchoolId,
          studentId: student.id,
          date,
          status: 'P' as AttendanceStatus,
          markedBy: role,
          markedAt: new Date().toISOString(),
        };

        if (existingIdx > -1) {
          updated[existingIdx] = newRec;
        } else {
          updated.push(newRec);
        }
      });
      return updated;
    });

    // Bulk save in background
    try {
      await Promise.all(classStudents.map((student) => {
        const recordId = `${selectedSchoolId}_${student.id}_${date}`;
        return api.saveAttendance({
          id: recordId,
          schoolId: selectedSchoolId,
          studentId: student.id,
          date,
          status: 'P',
          markedBy: role,
          markedAt: new Date().toISOString(),
        });
      }));
    } catch (error) {
      console.error('Failed to mark all present in database:', error);
    }
  };

  const handleAddStudent = async (newStudent: Omit<Student, 'id' | 'schoolId'>) => {
    const newId = `s_${Date.now()}`;
    const studentToAdd: Student = {
      ...newStudent,
      schoolId: selectedSchoolId,
      id: newId,
    };

    setStudents((prev) => [...prev, studentToAdd]);

    try {
      await api.saveStudent(studentToAdd);
    } catch (error) {
      console.error('Failed to add student to database:', error);
    }

    // Initialize status as unmarked (NR)
    await handleUpdateStatus(newId, selectedDate, 'NR');
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => s.id === updatedStudent.id ? updatedStudent : s));
    try {
      await api.saveStudent(updatedStudent);
    } catch (error) {
      console.error('Failed to update student profile in database:', error);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setAttendance((prev) => prev.filter((r) => r.studentId !== studentId));
    try {
      await api.deleteStudent(studentId);
    } catch (error) {
      console.error('Failed to delete student from database:', error);
    }
  };

  const handleAlphabetizeClass = async (classId: string) => {
    const thisClassStudents = students.filter((s) => s.classId === classId && s.schoolId === selectedSchoolId);
    const sortedThisClass = [...thisClassStudents].sort((a, b) => a.name.localeCompare(b.name));
    const reIndexed = sortedThisClass.map((student, index) => ({
      ...student,
      rollNo: String(index + 1).padStart(2, '0'),
    }));

    setStudents((prev) => {
      const otherClassStudents = prev.filter((s) => s.classId !== classId || s.schoolId !== selectedSchoolId);
      return [...otherClassStudents, ...reIndexed];
    });

    try {
      await Promise.all(reIndexed.map((s) => api.saveStudent(s)));
    } catch (error) {
      console.error('Failed to update sorted student rolls in database:', error);
    }
  };

  const handleAddTeacher = async (newTeacher: Omit<Teacher, 'id' | 'schoolId'>) => {
    const teacherToAdd: Teacher = {
      ...newTeacher,
      id: `t_${Date.now()}`,
      schoolId: selectedSchoolId,
    };
    setTeachers((prev) => [...prev, teacherToAdd]);
    try {
      await api.saveTeacher(teacherToAdd);
    } catch (error) {
      console.error('Failed to save teacher to database:', error);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    try {
      await api.deleteTeacher(teacherId);
    } catch (error) {
      console.error('Failed to delete teacher from database:', error);
    }
  };

  const handleChangeHouseMaster = async (house: House, masterName: string) => {
    const newMaster = { house, schoolId: selectedSchoolId, masterName };
    setHouseMasters((prev) => {
      const existingIdx = prev.findIndex((hm) => hm.house === house && hm.schoolId === selectedSchoolId);
      const updated = [...prev];
      if (existingIdx > -1) {
        updated[existingIdx] = newMaster;
      } else {
        updated.push(newMaster);
      }
      return updated;
    });
    try {
      await api.saveHouseMaster(newMaster);
    } catch (error) {
      console.error('Failed to save house master to database:', error);
    }
  };

  const handleChangeClassTeacher = async (classId: string, teacherName: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    const updatedClass = { ...cls, classTeacher: teacherName };
    setClasses((prev) => prev.map((c) => c.id === classId ? updatedClass : c));
    try {
      await api.saveClass(updatedClass);
    } catch (error) {
      console.error('Failed to save class teacher to database:', error);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setRole(newRole);
    setLoginError('');
    if (googleUser) {
      try {
        await api.updateAuthUserRole(googleUser.uid, newRole, selectedSchoolId, selectedClassId);
      } catch (e) {
        console.error('Failed to sync updated user role:', e);
      }
    }
  };

  const handleSelectClassAndSwitchToTeacher = (classId: string) => {
    setSelectedClassId(classId);
    handleRoleChange('Teacher');
  };

  // 5. Drill-down Student Object Finder
  const activeStudentForHistory = students.find((s) => s.id === activeStudentIdForHistory);

  // 6. Active authenticated school details
  const activeSchool = schools.find(s => s.id === selectedSchoolId) || schools[0];

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans flex flex-col justify-between" id="app-root-container">
      
      {/* Top Banner & Header */}
      <div>
        <div className="bg-blue-900 text-white py-1 px-4 text-center text-[10px] font-black uppercase tracking-wider select-none flex items-center justify-center space-x-1">
          <BookOpen className="h-3 w-3 text-orange-400" />
          <span>Navodaya Vidyalaya Samiti • Government of India Initiative</span>
        </div>
        
        <Header
          currentRole={role}
          onRoleChange={handleRoleChange}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Main Dashboard Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
          
          {/* Show Login panel for Teacher/Principal if not authenticated */}
          {role !== 'Regional' && !isAuthenticated ? (
            <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-100 shadow-xl mt-8">
              <div className="text-center space-y-2 mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black text-gray-900">JNV Portal Authentication</h2>
                <p className="text-xs text-gray-500 font-semibold">Authorized teachers and principal access. Choose school below.</p>
              </div>

              {/* Traditional Password Login Form */}
              <form onSubmit={handleSchoolLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Target School</label>
                  <select
                    value={loginSchoolId}
                    onChange={(e) => {
                      setLoginSchoolId(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                  >
                    {schools.map(sch => (
                      <option key={sch.id} value={sch.id}>{sch.name} ({sch.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Portal Access Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter school login password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      className="pl-9 pr-4 py-3 w-full text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1">Hint for Vattem: <span className="font-bold text-blue-600">vattem123</span></span>
                </div>

                {loginError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50/50 p-2 rounded-lg border border-rose-100 text-center">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                >
                  Unlock School Portal
                </button>
              </form>

              {/* Google SSO OAuth Access */}
              <div className="mt-4 space-y-4">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase">Or Secure SSO Access</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer space-x-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Access via Google Account</span>
                </button>
              </div>
              
              <div className="mt-6 border-t border-gray-50 pt-4 text-center">
                <button
                  onClick={() => setRole('Regional')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Switch to Regional Headquarters panel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sync Loader status */}
              {isLoading && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 mb-4 animate-pulse">
                  <Sparkles className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Synchronizing administrative rosters with Cloud SQL...</span>
                </div>
              )}

              {/* If authenticated to a school, show a beautiful logout/switch header for teachers & principals */}
              {role !== 'Regional' && (
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 text-blue-700 p-2 rounded-lg font-bold text-xs uppercase">
                      ACTIVE PORTAL
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{activeSchool.name}</p>
                      <p className="text-[10px] text-gray-500 font-semibold">{activeSchool.region} Region • State: {activeSchool.state}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" /> Switch School / Log Out
                  </button>
                </div>
              )}

              {/* Renders dashboard according to current role */}
              {role === 'Teacher' && (
                <TeacherView
                  students={students.filter(s => s.schoolId === selectedSchoolId)}
                  classes={classes}
                  attendanceRecords={attendance.filter(r => r.schoolId === selectedSchoolId)}
                  selectedClassId={selectedClassId}
                  onClassChange={setSelectedClassId}
                  selectedDate={selectedDate}
                  onUpdateStatus={handleUpdateStatus}
                  onMarkAllPresent={handleMarkAllPresent}
                  onAddStudent={handleAddStudent}
                  onRemoveStudent={handleRemoveStudent}
                  onEditStudent={handleEditStudent}
                  onAlphabetizeClass={handleAlphabetizeClass}
                  onViewStudentHistory={setActiveStudentIdForHistory}
                />
              )}

              {role === 'Principal' && (
                <PrincipalView
                  students={students.filter(s => s.schoolId === selectedSchoolId)}
                  classes={classes}
                  attendanceRecords={attendance.filter(r => r.schoolId === selectedSchoolId)}
                  selectedDate={selectedDate}
                  onViewStudentHistory={setActiveStudentIdForHistory}
                  onSelectClassAndSwitchToTeacher={handleSelectClassAndSwitchToTeacher}
                  onAddStudent={handleAddStudent}
                  onEditStudent={handleEditStudent}
                  onRemoveStudent={handleRemoveStudent}
                  onAlphabetizeClass={handleAlphabetizeClass}
                  teachers={teachers.filter((t) => t.schoolId === selectedSchoolId)}
                  houseMasters={houseMasters.filter((hm) => hm.schoolId === selectedSchoolId)}
                  onAddTeacher={handleAddTeacher}
                  onRemoveTeacher={handleRemoveTeacher}
                  onChangeHouseMaster={handleChangeHouseMaster}
                  onChangeClassTeacher={handleChangeClassTeacher}
                />
              )}

              {role === 'Regional' && (
                <RegionalView
                  schools={schools}
                  students={students}
                  classes={classes}
                  attendanceRecords={attendance}
                  selectedDate={selectedDate}
                  onAddSchool={async (newSchool) => {
                    setSchools(prev => [...prev, newSchool]);
                  }}
                  teachers={teachers}
                  houseMasters={houseMasters}
                  onAddTeacher={handleAddTeacher}
                  onRemoveTeacher={handleRemoveTeacher}
                  onChangeHouseMaster={handleChangeHouseMaster}
                  onChangeClassTeacher={handleChangeClassTeacher}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Student Ledger Drill-down Modal */}
      {activeStudentIdForHistory && activeStudentForHistory && (
        <StudentHistoryModal
          student={activeStudentForHistory}
          classes={classes}
          attendanceRecords={attendance}
          onClose={() => setActiveStudentIdForHistory(null)}
          onUpdateStatus={
            role === 'Teacher' 
              ? (date, status) => handleUpdateStatus(activeStudentForHistory.id, date, status)
              : undefined // only teachers can edit past states from modal
          }
        />
      )}

      {/* Footer Credentials */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-semibold shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center text-gray-500">
            <Shield className="h-4 w-4 text-blue-600 mr-1.5" />
            JNV School Attendance Register & Administration Controller
          </p>
          <div className="flex space-x-3 text-[10px] uppercase tracking-wider text-gray-400">
            <span>Nagarkurnool, Telangana</span>
            <span>•</span>
            <span className="text-orange-600 flex items-center">
              Hyderabad Region <Heart className="h-2.5 w-2.5 text-rose-500 ml-1 fill-rose-500" />
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
