/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Trash2, CalendarRange, UserPlus, Search, ArrowUpDown, CheckCircle, 
  UserMinus, AlertTriangle, Shield, Check, X, HelpCircle, Activity, Edit2, Cpu, ShieldOff,
  Download
} from 'lucide-react';
import { Student, ClassSection, AttendanceRecord, AttendanceStatus, House } from '../types';
import { AutomationHub } from './AutomationHub';

interface TeacherViewProps {
  students: Student[];
  classes: ClassSection[];
  attendanceRecords: AttendanceRecord[];
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  selectedDate: string;
  onUpdateStatus: (studentId: string, date: string, status: AttendanceStatus) => void;
  onMarkAllPresent: (classId: string, date: string) => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onRemoveStudent: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
  onAlphabetizeClass: (classId: string) => void;
  onViewStudentHistory: (studentId: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  students,
  classes,
  attendanceRecords,
  selectedClassId,
  onClassChange,
  selectedDate,
  onUpdateStatus,
  onMarkAllPresent,
  onAddStudent,
  onRemoveStudent,
  onEditStudent,
  onAlphabetizeClass,
  onViewStudentHistory,
}) => {
  // Navigation within Teacher space
  const [activeTab, setActiveTab] = useState<'register' | 'automation'>('register');

  // Local state for search & add/edit forms
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSortSuccess, setShowSortSuccess] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<'roll' | 'alpha'>('roll');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  // Add Form Inputs
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newHouse, setNewHouse] = useState<House>('Aravalli');
  const [newAdmNo, setNewAdmNo] = useState('');
  const [newRollNo, setNewRollNo] = useState('');

  // Edit Form Inputs
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'M' | 'F'>('M');
  const [editHouse, setEditHouse] = useState<House>('Aravalli');
  const [editAdmNo, setEditAdmNo] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editClassId, setEditClassId] = useState('');

  // Active class section details
  const activeClass = classes.find((c) => c.id === selectedClassId);

  // Filter students in current class
  const classStudents = students
    .filter((s) => {
      if (selectedClassId === 'unassigned') {
        return s.classId === 'unassigned' || s.classId === '' || s.house === 'Unassigned';
      }
      return s.classId === selectedClassId;
    })
    // Dynamic sort based on user selection
    .sort((a, b) => {
      if (displayOrder === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      const rollA = parseInt(a.rollNo) || 0;
      const rollB = parseInt(b.rollNo) || 0;
      if (rollA !== rollB) return rollA - rollB;
      return a.name.localeCompare(b.name);
    });

  // Filter based on search term
  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.includes(searchTerm) ||
    s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate day statistics for this class
  const classStudentIds = classStudents.map((s) => s.id);
  const classDayRecords = attendanceRecords.filter(
    (r) => r.date === selectedDate && classStudentIds.includes(r.studentId)
  );

  const stats = classStudents.reduce(
    (acc, student) => {
      const record = classDayRecords.find((r) => r.studentId === student.id);
      const status = record ? record.status : 'NR';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { P: 0, A: 0, L: 0, OD: 0, NR: 0 }
  );

  const totalClassEnrolment = classStudents.length;
  const markedCount = totalClassEnrolment - stats.NR;
  const markedPercentage = totalClassEnrolment > 0 
    ? Math.round((markedCount / totalClassEnrolment) * 100) 
    : 0;

  // Check if selectedDate is at the start of the month (Day 1 to 5)
  const dateObj = new Date(selectedDate);
  const isStartOfMonth = !isNaN(dateObj.getTime()) && dateObj.getDate() <= 5;
  const monthName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-IN', { month: 'long' }) : 'new month';

  // Trigger editing state
  const startEditing = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditGender(student.gender);
    setEditHouse(student.house);
    setEditAdmNo(student.admissionNo);
    setEditRollNo(student.rollNo);
    setEditClassId(student.classId);
    setShowAddForm(false); // close add form if open
  };

  // Handle student submit
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Default next roll number if not specified
    let finalRollNo = newRollNo.trim();
    if (!finalRollNo) {
      const maxRoll = classStudents.reduce((max, s) => {
        const r = parseInt(s.rollNo);
        return !isNaN(r) && r > max ? r : max;
      }, 0);
      finalRollNo = String(maxRoll + 1).padStart(2, '0');
    }

    const finalAdmNo = newAdmNo.trim() || `V-2026/${Math.floor(100 + Math.random() * 900)}`;

    onAddStudent({
      name: newName.trim(),
      rollNo: finalRollNo,
      classId: selectedClassId,
      house: newHouse,
      gender: newGender,
      admissionNo: finalAdmNo,
    });

    // Reset Form
    setNewName('');
    setNewRollNo('');
    setNewAdmNo('');
    setShowAddForm(false);
  };

  // Handle student edit submit
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim()) return;

    onEditStudent({
      ...editingStudent,
      name: editName.trim(),
      rollNo: editRollNo.trim() || editingStudent.rollNo,
      classId: editClassId,
      house: editHouse,
      gender: editGender,
      admissionNo: editAdmNo.trim() || editingStudent.admissionNo,
    });

    setEditingStudent(null);
  };

  // House color-code helper
  const getHouseBadgeStyle = (house: House) => {
    switch (house) {
      case 'Aravalli':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Nilgiri':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shivalik':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Udaygiri':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Unassigned':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleAlphabeticalSortClick = () => {
    onAlphabetizeClass(selectedClassId);
    setShowSortSuccess(true);
    setTimeout(() => setShowSortSuccess(false), 4000);
  };

  const handleExportCSV = () => {
    if (classStudents.length === 0) {
      setExportError('No students found in this class to export.');
      setTimeout(() => setExportError(''), 4000);
      return;
    }

    try {
      const dateObj = new Date(selectedDate);
      if (isNaN(dateObj.getTime())) {
        setExportError('Invalid selected date.');
        setTimeout(() => setExportError(''), 4000);
        return;
      }

      const year = dateObj.getFullYear();
      const monthIdx = dateObj.getMonth();
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'long' });
      const formattedMonth = String(monthIdx + 1).padStart(2, '0');
      const yearMonthStr = `${year}-${formattedMonth}`;

      const totalDays = new Date(year, monthIdx + 1, 0).getDate();

      const headers = [
        'Roll No',
        'Admission No',
        'Name',
        'Gender',
        'House',
      ];

      for (let d = 1; d <= totalDays; d++) {
        headers.push(`${String(d).padStart(2, '0')}-${formattedMonth}-${year}`);
      }

      headers.push('P (Present)', 'A (Absent)', 'L (Leave)', 'OD (On Duty)', 'NR (Unrecorded)', 'Attendance %');

      const rows = classStudents.map((student) => {
        const studentRecords = attendanceRecords.filter(
          (r) => r.studentId === student.id && r.date.startsWith(yearMonthStr)
        );

        let countP = 0;
        let countA = 0;
        let countL = 0;
        let countOD = 0;
        let countNR = 0;

        const dayCells: string[] = [];
        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${yearMonthStr}-${String(d).padStart(2, '0')}`;
          const rec = studentRecords.find((r) => r.date === dateStr);
          const status = rec ? rec.status : 'NR';
          dayCells.push(status);

          if (status === 'P') countP++;
          else if (status === 'A') countA++;
          else if (status === 'L') countL++;
          else if (status === 'OD') countOD++;
          else countNR++;
        }

        const totalMarked = countP + countA + countL + countOD;
        const attendancePercentage = totalMarked > 0 
          ? Math.round(((countP + countOD) / totalMarked) * 100) 
          : 0;

        const rowData = [
          student.rollNo,
          student.admissionNo,
          `"${student.name.replace(/"/g, '""')}"`,
          student.gender,
          student.house,
          ...dayCells,
          String(countP),
          String(countA),
          String(countL),
          String(countOD),
          String(countNR),
          `${attendancePercentage}%`
        ];

        return rowData.join(',');
      });

      const csvContent = [
        `"JNV Offline Attendance Backup & Report"`,
        `"Class Section: ${activeClass?.name || 'Unassigned Pool'}"`,
        `"Reporting Month: ${monthLabel} ${year}"`,
        `"Generated On: ${new Date().toLocaleString()}"`,
        '',
        headers.join(','),
        ...rows
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `JNV_Attendance_${activeClass?.name || 'Unassigned'}_${yearMonthStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportError('');
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setExportError('Export failed: ' + (err.message || err));
      setTimeout(() => setExportError(''), 4000);
    }
  };

  return (
    <div className="space-y-6" id="teacher-view-container">
      
      {/* Teacher workspace header tabs */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl shadow-3xs max-w-xs">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'register'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Daily Register
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === 'automation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Cpu className="h-3 w-3" />
          <span>Smart Automation</span>
        </button>
      </div>

      {activeTab === 'automation' ? (
        <AutomationHub
          students={students}
          selectedClassId={selectedClassId}
          selectedDate={selectedDate}
          onUpdateStatus={onUpdateStatus}
        />
      ) : (
        <>
          {/* Upper Class Selection & Core Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Class Selection Box */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Classroom Register</h2>
                <p className="text-sm text-gray-500 mb-4 font-medium">Select a class section to view and record daily attendance.</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      id={`btn-class-select-${c.id}`}
                      onClick={() => {
                        onClassChange(c.id);
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2 text-xs font-extrabold rounded-lg border transition-all text-center cursor-pointer ${
                        selectedClassId === c.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    id="btn-class-select-unassigned"
                    onClick={() => {
                      onClassChange('unassigned');
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-xs font-extrabold rounded-lg border transition-all text-center cursor-pointer col-span-3 sm:col-span-4 lg:col-span-3 ${
                      selectedClassId === 'unassigned'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70'
                    }`}
                  >
                    ⚠️ Unassigned Pool ({students.filter(s => s.classId === 'unassigned' || s.classId === '' || s.house === 'Unassigned').length})
                  </button>
                </div>
                
                {activeClass && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-xs flex justify-between items-center mt-3">
                    <span className="text-blue-800 font-semibold">Class Teacher:</span>
                    <span className="text-gray-700 font-extrabold">{activeClass.classTeacher}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Date Stat Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">
                    Attendance Status Dashboard for {activeClass?.name}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Date: {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                
                <button
                  id="btn-mark-all-present"
                  onClick={() => onMarkAllPresent(selectedClassId, selectedDate)}
                  disabled={totalClassEnrolment === 0}
                  className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Mark All Present
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Present</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">{stats.P}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-600">Absent</span>
                  <p className="text-xl font-extrabold text-rose-700 mt-1">{stats.A}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Leave</span>
                  <p className="text-xl font-extrabold text-amber-700 mt-1">{stats.L}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-600">On Duty</span>
                  <p className="text-xl font-extrabold text-blue-700 mt-1">{stats.OD}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Unrecorded</span>
                  <p className="text-xl font-extrabold text-gray-600 mt-1">{stats.NR}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-1.5">
                  <span>Marking Progress: {markedCount} / {totalClassEnrolment} students</span>
                  <span className="text-blue-600">{markedPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${markedPercentage}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Monthly Preparation Tool Banner or Start of Month Notification */}
          {isStartOfMonth ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 text-amber-800 p-2 rounded-xl">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">Month-Beginning Alphabetical Roster Sync!</h3>
                  <p className="text-xs text-amber-700 font-semibold">
                    Roster regulations require alphabetizing student names at the beginning of {monthName} and re-assigning neat sequential rolls.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAlphabeticalSortClick}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Sync Roster Alphabetically
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-xl mt-0.5 sm:mt-0">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Alphabetical Monthly Roster Prep</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Required at month-beginning. This tool arranges student lists alphabetically by Name and automatically recalculates continuous roll indices (01, 02, 03...).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-center">
                {showSortSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center animate-pulse">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Roster Organized!
                  </span>
                )}
                <button
                  id="btn-trigger-month-sort"
                  onClick={handleAlphabeticalSortClick}
                  disabled={totalClassEnrolment <= 1}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Sort Alphabetically
                </button>
              </div>
            </div>
          )}

          {/* Main Table and Control Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
            
            {/* Table Top Controls */}
            <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* Search bar */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="search-students-input"
                    type="text"
                    placeholder="Search name, roll, adm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700"
                  />
                </div>

                {/* Sorting order display filter */}
                <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start">
                  <button
                    onClick={() => setDisplayOrder('roll')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      displayOrder === 'roll' ? 'bg-white text-blue-700 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    By Roll No
                  </button>
                  <button
                    onClick={() => setDisplayOrder('alpha')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      displayOrder === 'alpha' ? 'bg-white text-blue-700 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Alphabetical View
                  </button>
                </div>
              </div>

              {/* Action Toggles: Export CSV and Add Student */}
              <div className="flex flex-wrap items-center gap-2">
                {showExportSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center animate-pulse">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> CSV Downloaded!
                  </span>
                )}
                {exportError && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> {exportError}
                  </span>
                )}
                <button
                  id="btn-export-attendance-csv"
                  onClick={handleExportCSV}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg transition-all border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100/70 cursor-pointer"
                  title="Download offline backup grid for the current month"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export Monthly CSV
                </button>

                <button
                  id="btn-toggle-add-student-form"
                  onClick={() => {
                    setEditingStudent(null);
                    setShowAddForm(!showAddForm);
                  }}
                  className={`inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                    showAddForm
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100/70'
                  }`}
                >
                  {showAddForm ? (
                    <>
                      <X className="h-3.5 w-3.5 mr-1.5" /> Close Roster Add
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Student to {activeClass?.name}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Add Student Form */}
            {showAddForm && !editingStudent && (
              <form onSubmit={handleAddStudentSubmit} className="p-5 bg-gray-50/40 border-b border-gray-50 space-y-4 animate-fade-in" id="add-student-form">
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">New Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name *</label>
                    <input
                      id="add-student-name"
                      type="text"
                      required
                      placeholder="Full Name (e.g. M. Sai Ram)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender *</label>
                    <select
                      id="add-student-gender"
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700"
                    >
                      <option value="M">Boy (M)</option>
                      <option value="F">Girl (F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">House Allocation *</label>
                    <select
                      id="add-student-house"
                      value={newHouse}
                      onChange={(e) => setNewHouse(e.target.value as House)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700"
                    >
                      <option value="Aravalli">Aravalli</option>
                      <option value="Nilgiri">Nilgiri</option>
                      <option value="Shivalik">Shivalik</option>
                      <option value="Udaygiri">Udaygiri</option>
                      <option value="Unassigned">Unassigned / None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Adm No (Optional)</label>
                    <input
                      id="add-student-adm-no"
                      type="text"
                      placeholder="e.g. V-2026/180"
                      value={newAdmNo}
                      onChange={(e) => setNewAdmNo(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Roll No (Optional)</label>
                    <input
                      id="add-student-roll-no"
                      type="text"
                      placeholder="Auto (next logical)"
                      value={newRollNo}
                      onChange={(e) => setNewRollNo(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-add-student"
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-extrabold rounded-lg shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Save Student Roster
                  </button>
                </div>
              </form>
            )}

            {/* Edit Student Form overlay */}
            {editingStudent && (
              <form onSubmit={handleEditStudentSubmit} className="p-5 bg-amber-50/50 border-b border-amber-100 space-y-4 animate-fade-in" id="edit-student-form">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <h3 className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center">
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit Student Profile Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="p-1 hover:bg-amber-100 text-amber-800 rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name *</label>
                    <input
                      id="edit-student-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender *</label>
                    <select
                      id="edit-student-gender"
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as 'M' | 'F')}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700"
                    >
                      <option value="M">Boy (M)</option>
                      <option value="F">Girl (F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">House *</label>
                    <select
                      id="edit-student-house"
                      value={editHouse}
                      onChange={(e) => setEditHouse(e.target.value as House)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700"
                    >
                      <option value="Aravalli">Aravalli</option>
                      <option value="Nilgiri">Nilgiri</option>
                      <option value="Shivalik">Shivalik</option>
                      <option value="Udaygiri">Udaygiri</option>
                      <option value="Unassigned">-- No House (Unassigned) --</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Adm No *</label>
                    <input
                      id="edit-student-adm-no"
                      type="text"
                      required
                      value={editAdmNo}
                      onChange={(e) => setEditAdmNo(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Roll No *</label>
                    <input
                      id="edit-student-roll-no"
                      type="text"
                      required
                      value={editRollNo}
                      onChange={(e) => setEditRollNo(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Class Section *</label>
                    <select
                      id="edit-student-class"
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                      <option value="unassigned">-- No Class (Unassigned) --</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-edit-student"
                    className="px-4 py-1.5 bg-amber-600 text-white text-xs font-extrabold rounded-lg shadow-sm hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Update Profile Details
                  </button>
                </div>
              </form>
            )}

            {/* Student Ledger Register */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="teacher-attendance-register-table">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="py-3 px-4 w-16">Roll No</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">House Allocation</th>
                    <th className="py-3 px-4 text-center">Daily Attendance Register</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">
                        {searchTerm ? 'No students match your search criteria.' : 'No students enrolled in this class section yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      // Get day record
                      const record = classDayRecords.find((r) => r.studentId === student.id);
                      const currentStatus = record ? record.status : 'NR';

                      return (
                        <tr key={student.id} className="hover:bg-gray-50/70 transition-colors group">
                          {/* Roll Number */}
                          <td className="py-3 px-4 font-mono text-sm font-bold text-gray-400">
                            {student.rollNo}
                          </td>
                          
                          {/* Name / Admission */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 leading-tight">
                                {student.name}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                Adm: {student.admissionNo} • {student.gender === 'M' ? 'Boy' : 'Girl'}
                              </p>
                            </div>
                          </td>
                          
                          {/* House Badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getHouseBadgeStyle(student.house)}`}>
                              <Shield className="h-2.5 w-2.5 mr-1" /> {student.house}
                            </span>
                          </td>

                          {/* Attendance Buttons */}
                          <td className="py-3 px-4">
                            {selectedClassId === 'unassigned' ? (
                              <div className="text-center py-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                  Assign Class to Track
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                                {[
                                  { code: 'P', label: 'Present', activeColor: 'bg-emerald-600 text-white shadow-xs scale-105 border-emerald-600' },
                                  { code: 'A', label: 'Absent', activeColor: 'bg-rose-600 text-white shadow-xs scale-105 border-rose-600' },
                                  { code: 'L', label: 'Leave', activeColor: 'bg-amber-500 text-white shadow-xs scale-105 border-amber-500' },
                                  { code: 'OD', label: 'On Duty', activeColor: 'bg-blue-600 text-white shadow-xs scale-105 border-blue-600' },
                                ].map((opt) => {
                                  const isSelected = currentStatus === opt.code;
                                  return (
                                    <button
                                      key={opt.code}
                                      id={`btn-mark-${student.id}-${opt.code.toLowerCase()}`}
                                      type="button"
                                      title={`Mark ${student.name} as ${opt.label}`}
                                      onClick={() => onUpdateStatus(student.id, selectedDate, opt.code as AttendanceStatus)}
                                      className={`w-10 h-10 sm:w-11 sm:h-11 flex flex-col items-center justify-center text-xs font-black rounded-xl border transition-all cursor-pointer ${
                                        isSelected
                                          ? opt.activeColor
                                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
                                      }`}
                                    >
                                      {opt.code}
                                    </button>
                                  );
                                })}
                                
                                {/* Unmark Button */}
                                {currentStatus !== 'NR' && (
                                  <button
                                    type="button"
                                    title="Clear Attendance mark"
                                    onClick={() => onUpdateStatus(student.id, selectedDate, 'NR')}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                  >
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                id={`btn-view-ledger-${student.id}`}
                                onClick={() => onViewStudentHistory(student.id)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="View Student Profile & Ledger"
                              >
                                <CalendarRange className="h-4 w-4" />
                              </button>
                              
                              {/* Edit Student Button */}
                              <button
                                id={`btn-edit-student-${student.id}`}
                                onClick={() => startEditing(student)}
                                className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                                title="Edit Student Profile Details"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              
                              {/* Remove from Class Button */}
                              {student.classId !== 'unassigned' && (
                                <button
                                  id={`btn-unassign-class-${student.id}`}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove ${student.name} from their current class section? They will be moved to the Unassigned Pool.`)) {
                                      onEditStudent({
                                        ...student,
                                        classId: 'unassigned'
                                      });
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                                  title="Remove from Class"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              )}

                              {/* Remove from House Button */}
                              {student.house !== 'Unassigned' && (
                                <button
                                  id={`btn-unassign-house-${student.id}`}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove ${student.name} from their assigned house?`)) {
                                      onEditStudent({
                                        ...student,
                                        house: 'Unassigned'
                                      });
                                    }
                                  }}
                                  className="p-1.5 hover:bg-slate-100 text-gray-600 rounded-lg transition-colors"
                                  title="Remove from House"
                                >
                                  <ShieldOff className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                id={`btn-remove-student-${student.id}`}
                                onClick={() => {
                                  if (window.confirm(`Are you absolutely sure you want to remove ${student.name} (Adm: ${student.admissionNo}) from school records? This will delete their past register logs.`)) {
                                    onRemoveStudent(student.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity"
                                title="De-register Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 text-center border-t border-gray-100 text-[10px] text-gray-400 font-bold">
              Jawahar Navodaya Vidyalayas require 75% attendance for term final progression examinations.
            </div>
          </div>
        </>
      )}

    </div>
  );
};
