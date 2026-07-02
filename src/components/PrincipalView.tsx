/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, AlertCircle, ShieldAlert, Award, Search, Sparkles, 
  ArrowUpRight, ArrowDownRight, Shield, TrendingUp, Calendar, ChevronRight,
  UserPlus, Trash2, Edit, CheckCircle2, UserCheck, BarChart3, ListFilter, ClipboardList, Plus, Info
} from 'lucide-react';
import { Student, ClassSection, AttendanceRecord, House, Teacher, HouseMaster } from '../types';

interface PrincipalViewProps {
  students: Student[];
  classes: ClassSection[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onViewStudentHistory: (studentId: string) => void;
  onSelectClassAndSwitchToTeacher: (classId: string) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'schoolId'>) => void;
  onEditStudent: (student: Student) => void;
  onRemoveStudent: (studentId: string) => void;
  onAlphabetizeClass: (classId: string) => void;
  teachers: Teacher[];
  houseMasters: HouseMaster[];
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'schoolId'>) => void;
  onRemoveTeacher: (teacherId: string) => void;
  onChangeHouseMaster: (house: House, masterName: string) => void;
  onChangeClassTeacher: (classId: string, teacherName: string) => void;
}

export const PrincipalView: React.FC<PrincipalViewProps> = ({
  students,
  classes,
  attendanceRecords,
  selectedDate,
  onViewStudentHistory,
  onSelectClassAndSwitchToTeacher,
  onAddStudent,
  onEditStudent,
  onRemoveStudent,
  onAlphabetizeClass,
  teachers,
  houseMasters,
  onAddTeacher,
  onRemoveTeacher,
  onChangeHouseMaster,
  onChangeClassTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouseFilter, setSelectedHouseFilter] = useState<'All' | House>('All');
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<boolean>(false);

  // Administration portal tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'staff-admin'>('dashboard');

  // Student roster builder states
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentClassId, setStudentClassId] = useState('c6');
  const [studentHouse, setStudentHouse] = useState<House>('Aravalli');
  const [studentGender, setStudentGender] = useState<'M' | 'F'>('M');
  const [studentAdmissionNo, setStudentAdmissionNo] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedRosterClassFilter, setSelectedRosterClassFilter] = useState<string>('All');

  // Staff Administration states
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherDesignation, setNewTeacherDesignation] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState('');

  // Submit handler for adding/editing scholars
  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentAdmissionNo.trim() || !studentRollNo.trim()) return;

    if (editingStudentId) {
      const match = students.find(s => s.id === editingStudentId);
      onEditStudent({
        id: editingStudentId,
        schoolId: match?.schoolId || '',
        name: studentName.trim(),
        rollNo: studentRollNo.trim().padStart(2, '0'),
        classId: studentClassId,
        house: studentHouse,
        gender: studentGender,
        admissionNo: studentAdmissionNo.trim(),
      });
      setSuccessMsg(`Successfully updated details of "${studentName.trim()}"`);
      setEditingStudentId(null);
    } else {
      onAddStudent({
        name: studentName.trim(),
        rollNo: studentRollNo.trim().padStart(2, '0'),
        classId: studentClassId,
        house: studentHouse,
        gender: studentGender,
        admissionNo: studentAdmissionNo.trim(),
      });
      setSuccessMsg(`Successfully registered new scholar "${studentName.trim()}" to the JNV database!`);
    }

    // Reset Form
    setStudentName('');
    setStudentRollNo('');
    setStudentAdmissionNo('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherDesignation.trim()) return;

    onAddTeacher({
      name: newTeacherName.trim(),
      designation: newTeacherDesignation.trim(),
      phone: newTeacherPhone.trim() || undefined,
    });

    setStaffSuccessMsg(`Successfully registered teacher "${newTeacherName.trim()}" in school portal!`);
    setNewTeacherName('');
    setNewTeacherDesignation('');
    setNewTeacherPhone('');
    setTimeout(() => setStaffSuccessMsg(''), 5000);
  };

  const startEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentRollNo(student.rollNo);
    setStudentClassId(student.classId);
    setStudentHouse(student.house);
    setStudentGender(student.gender);
    setStudentAdmissionNo(student.admissionNo);
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setStudentName('');
    setStudentRollNo('');
    setStudentAdmissionNo('');
  };

  // Total school students count
  const totalEnrolled = students.length;

  // Get active date records for the whole school
  const activeDateRecords = attendanceRecords.filter((r) => r.date === selectedDate);

  // General counts for today
  const todayStats = students.reduce(
    (acc, s) => {
      const rec = activeDateRecords.find((r) => r.studentId === s.id);
      const status = rec ? rec.status : 'NR';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { P: 0, A: 0, L: 0, OD: 0, NR: 0 }
  );

  const totalMarkedToday = totalEnrolled - todayStats.NR;
  const schoolAttendancePercentage = totalMarkedToday > 0 
    ? Math.round(((todayStats.P + todayStats.OD) / totalMarkedToday) * 100) 
    : 0;

  // Calculate cumulative stats for each student to find those below 75%
  const studentCumulativeStats = students.map((student) => {
    const studentRecs = attendanceRecords.filter((r) => r.studentId === student.id);
    const total = studentRecs.length;
    const nr = studentRecs.filter((r) => r.status === 'NR').length;
    const present = studentRecs.filter((r) => r.status === 'P').length;
    const od = studentRecs.filter((r) => r.status === 'OD').length;

    const activeDays = total - nr;
    const percentage = activeDays > 0 ? Math.round(((present + od) / activeDays) * 100) : 100;

    return {
      student,
      percentage,
      present,
      absent: studentRecs.filter((r) => r.status === 'A').length,
      leave: studentRecs.filter((r) => r.status === 'L').length,
      activeDays,
    };
  });

  // Flagged students (<75%)
  const lowAttendanceStudents = studentCumulativeStats.filter((item) => item.percentage < 75);

  // Calculate Class-wise Performance for today
  const classWiseData = classes.map((cls) => {
    const clsStudents = students.filter((s) => s.classId === cls.id);
    const clsDayRecs = activeDateRecords.filter((r) => 
      clsStudents.map(cs => cs.id).includes(r.studentId)
    );

    const stats = clsStudents.reduce(
      (acc, s) => {
        const rec = clsDayRecs.find((r) => r.studentId === s.id);
        const status = rec ? rec.status : 'NR';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { P: 0, A: 0, L: 0, OD: 0, NR: 0 }
    );

    const total = clsStudents.length;
    const marked = total - stats.NR;
    const rate = marked > 0 ? Math.round(((stats.P + stats.OD) / marked) * 100) : 0;

    return {
      cls,
      total,
      stats,
      marked,
      rate,
    };
  });

  // Calculate House Standings for today
  const houses: House[] = ['Aravalli', 'Nilgiri', 'Shivalik', 'Udaygiri'];
  const houseStandings = houses.map((house) => {
    const houseStudents = students.filter((s) => s.house === house);
    const houseStudentIds = houseStudents.map((s) => s.id);
    
    // Day's stats
    const dayRecs = activeDateRecords.filter((r) => houseStudentIds.includes(r.studentId));
    const dayP = dayRecs.filter((r) => r.status === 'P').length;
    const dayOD = dayRecs.filter((r) => r.status === 'OD').length;
    const dayNR = houseStudents.length - dayRecs.length;
    const dayMarked = houseStudents.length - dayNR;
    const dayRate = dayMarked > 0 ? Math.round(((dayP + dayOD) / dayMarked) * 100) : 0;

    // Cumulative stats
    const cumRecs = attendanceRecords.filter((r) => houseStudentIds.includes(r.studentId));
    const cumP = cumRecs.filter((r) => r.status === 'P').length;
    const cumOD = cumRecs.filter((r) => r.status === 'OD').length;
    const cumNR = cumRecs.filter((r) => r.status === 'NR').length;
    const cumActive = cumRecs.length - cumNR;
    const cumulativeRate = cumActive > 0 ? Math.round(((cumP + cumOD) / cumActive) * 100) : 100;

    return {
      house,
      total: houseStudents.length,
      dayRate,
      cumulativeRate,
    };
  }).sort((a, b) => b.cumulativeRate - a.cumulativeRate); // sorted by historical rate

  // Filter global student directory list
  const filteredStudentsDirectory = studentCumulativeStats.filter((item) => {
    // Search filter
    const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.student.rollNo.includes(searchTerm) ||
                          item.student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // House filter
    const matchesHouse = selectedHouseFilter === 'All' || item.student.house === selectedHouseFilter;

    // Alert filter (< 75%)
    const matchesAlert = !selectedAlertFilter || item.percentage < 75;

    return matchesSearch && matchesHouse && matchesAlert;
  });

  // Rate colour evaluator
  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (rate >= 75) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getPercentageBarColor = (p: number) => {
    if (p >= 90) return 'bg-emerald-600';
    if (p >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6" id="principal-view-container">
      
      {/* Principal Administration Header & Navigation Menu */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-4 bg-white p-4 rounded-2xl shadow-3xs">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100">
            JNV Administration Console
          </span>
          <h2 className="text-lg font-black text-gray-900 mt-2">Institution Command Center</h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage daily student registration rosters and audit class compliance rates.</p>
        </div>
        
        {/* Navigation Menu Tabs */}
        <div className="flex flex-wrap bg-gray-50 p-1 rounded-xl border border-gray-200/50 gap-1 md:max-w-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Dashboard & Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center space-x-1 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'roster' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Student Directory ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staff-admin')}
            className={`flex items-center space-x-1 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'staff-admin' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Staff & House Admin</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Upper 4 Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* School Attendance Gauge */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overall School Attendance</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{schoolAttendancePercentage}%</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  Target CBSE standard: 75%+
                </p>
              </div>
              <div className="relative h-16 w-16 flex items-center justify-center">
                {/* simple SVG circular tracker */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-gray-100" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    className="stroke-blue-600 transition-all duration-500" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - schoolAttendancePercentage / 100)}
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-blue-700">{schoolAttendancePercentage}%</span>
              </div>
            </div>

            {/* Total Enrolled */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Enrollment</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{totalEnrolled}</h3>
                <p className="text-xs text-gray-500 font-semibold">Total Residential Scholars</p>
              </div>
            </div>

            {/* Absentees Today */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Absences Today</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{todayStats.P === 0 && todayStats.A === 0 && todayStats.L === 0 ? 'Pending' : todayStats.A}</h3>
                <p className="text-xs text-rose-600 font-semibold flex items-center">
                  Requires validation logs
                </p>
              </div>
            </div>

            {/* Attendance Alerts Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Critical Defaulters</span>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{lowAttendanceStudents.length}</h3>
                <p className="text-xs text-gray-500 font-semibold">Students strictly under 75%</p>
              </div>
            </div>

          </div>

          {/* Class Register Grid and House Standings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Class Ledger Table (School-Level) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs lg:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">Class-wise Attendance Rates</h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Summary of all registers for {selectedDate}</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 font-bold">
                  School Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                      <th className="py-2.5 px-3">Class Section</th>
                      <th className="py-2.5 px-3">Class Teacher</th>
                      <th className="py-2.5 px-3 text-center">Roster Size</th>
                      <th className="py-2.5 px-3 text-center">P / A / L / OD</th>
                      <th className="py-2.5 px-3 text-right">Register Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {classWiseData.map(({ cls, total, stats, rate }) => {
                      const isPending = stats.NR === total;
                      const displayRate = isPending ? 'Pending' : `${rate}%`;

                      return (
                        <tr key={cls.id} className="hover:bg-gray-50/70 transition-all group">
                          <td className="py-3 px-3 font-extrabold text-gray-900">
                            {cls.name}
                          </td>
                          <td className="py-3 px-3 text-gray-500 font-semibold">
                            {cls.classTeacher}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-600">
                            {total}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex justify-center items-center space-x-1.5 font-mono text-[10px] font-bold">
                              <span className="text-emerald-600" title="Present">{stats.P}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-rose-600" title="Absent">{stats.A}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-amber-600" title="Leave">{stats.L}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-blue-600" title="On Duty">{stats.OD}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              id={`btn-class-drill-${cls.id}`}
                              onClick={() => onSelectClassAndSwitchToTeacher(cls.id)}
                              className="inline-flex items-center space-x-1"
                            >
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${isPending ? 'bg-gray-50 border-gray-200 text-gray-500' : getRateColor(rate)}`}>
                                {displayRate}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JNV Houses Standings */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900">JNV House Standings</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Trophy race based on attendance rates</p>
                  </div>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>

                <div className="space-y-4">
                  {houseStandings.map((standing, index) => {
                    let badgeColor = 'bg-gray-100 text-gray-600';
                    if (index === 0) badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                    if (index === 1) badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                    if (index === 2) badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';

                    return (
                      <div key={standing.house} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-black border ${badgeColor}`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 flex items-center">
                              <Shield className="h-3 w-3 text-blue-500 mr-1.5" />
                              {standing.house} House
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">Size: {standing.total} Scholars</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-900">{standing.cumulativeRate}%</p>
                          <span className="text-[9px] text-gray-400 font-bold block">Overall Avg</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-4 text-[10px] text-blue-800 font-bold flex items-start space-x-1.5">
                <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>
                  Housemasters review cumulative standings weekly to maintain residential discipline and award the House Championship trophy.
                </span>
              </div>
            </div>

          </div>

          {/* Comprehensive Student Directory & Critical Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
            
            {/* Table Top Controls */}
            <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Student Directory & Attendance Warnings</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Search and monitor active scholars across classes</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="principal-search-students"
                    type="text"
                    placeholder="Search by name, roll, adm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full sm:w-48 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* House Filter */}
                <select
                  id="principal-house-filter"
                  value={selectedHouseFilter}
                  onChange={(e) => setSelectedHouseFilter(e.target.value as 'All' | House)}
                  className="p-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-gray-700 cursor-pointer"
                >
                  <option value="All">All Houses</option>
                  {houses.map((h) => (
                    <option key={h} value={h}>{h} House</option>
                  ))}
                </select>

                {/* Alert filter toggle */}
                <button
                  id="principal-alert-toggle"
                  onClick={() => setSelectedAlertFilter(!selectedAlertFilter)}
                  className={`p-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    selectedAlertFilter
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                  {selectedAlertFilter ? 'Show All Students' : 'Show Defaulters (<75%)'}
                </button>
              </div>
            </div>

            {/* Directory Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="principal-directory-table">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4">Scholars Details</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">House Allocation</th>
                    <th className="py-3 px-4 text-center">Working Days</th>
                    <th className="py-3 px-4 text-center">P / A / L</th>
                    <th className="py-3 px-4">Attendance Percentage Progress</th>
                    <th className="py-3 px-4 text-right">Ledger Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudentsDirectory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                        No student directory matches. Adjust filters or contact class teachers to enroll students.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentsDirectory.map(({ student, percentage, present, absent, leave, activeDays }) => {
                      const studentClass = classes.find((c) => c.id === student.classId);

                      return (
                        <tr key={student.id} className="hover:bg-gray-50/70 transition-colors group">
                          {/* Name / Adm */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 leading-tight">
                                {student.name}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                Adm: {student.admissionNo} • Roll: {student.rollNo}
                              </p>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="py-3 px-4 font-bold text-gray-700">
                            {studentClass?.name || student.classId}
                          </td>

                          {/* House */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-600">
                              <Shield className="h-2.5 w-2.5 text-blue-500 mr-1" /> {student.house}
                            </span>
                          </td>

                          {/* Active Days */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">
                            {activeDays}
                          </td>

                          {/* Ledger breakdown counts */}
                          <td className="py-3 px-4">
                            <div className="flex justify-center items-center space-x-1.5 font-mono font-bold">
                              <span className="text-emerald-600">{present} P</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-rose-600">{absent} A</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-amber-600">{leave} L</span>
                            </div>
                          </td>

                          {/* Progress visual bar */}
                          <td className="py-3 px-4">
                            <div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1">
                                <span className={percentage < 75 ? 'text-rose-600' : 'text-emerald-700'}>
                                  {percentage}% {percentage < 75 ? 'Defaulter' : 'Compliant'}
                                </span>
                              </div>
                              <div className="w-36 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${getPercentageBarColor(percentage)}`} 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              id={`btn-drill-ledger-p-${student.id}`}
                              onClick={() => onViewStudentHistory(student.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-md border border-blue-200 transition-colors cursor-pointer"
                            >
                              View Ledger
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'roster' ? (
        <div className="space-y-6 animate-fade-in" id="roster-management-tab">
          
          {/* Success Banner */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-pulse">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Read-Only Directory Protocol Info Banner */}
          <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl text-blue-900 text-xs font-semibold flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-blue-950 text-sm mb-1">Student Roster Directory (Read-Only)</h4>
              <p className="text-blue-800 leading-relaxed font-medium">
                Under current administrative delegation, **Student Profile Modifications (including adding new scholars, editing registration details, and de-registrations)** are managed exclusively by their assigned **Class Teachers** via the Class Teacher terminal. This maintains accurate and compliant local records. The Principal retains read-only access to view the school directory, filter rosters, and review historical profiles.
              </p>
            </div>
          </div>

          {/* Roster list view */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-950">Active Student Roster</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Filter by class or unassigned pool to review scholastic profiles and historic attendance ledgers.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Roster Class selector */}
                <select
                  value={selectedRosterClassFilter}
                  onChange={(e) => setSelectedRosterClassFilter(e.target.value)}
                  className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 font-bold text-gray-700 cursor-pointer"
                >
                  <option value="All">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                  <option value="unassigned">Unassigned Pool</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">JNV House</th>
                    <th className="py-3 px-4 text-center">Gender</th>
                    <th className="py-3 px-4 text-right">Academic Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                  {students.filter(s => {
                    if (selectedRosterClassFilter === 'All') return true;
                    if (selectedRosterClassFilter === 'unassigned') {
                      return s.classId === 'unassigned' || s.classId === '' || s.house === 'Unassigned';
                    }
                    return s.classId === selectedRosterClassFilter;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                        No students enrolled in this selection.
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter(s => {
                        if (selectedRosterClassFilter === 'All') return true;
                        if (selectedRosterClassFilter === 'unassigned') {
                          return s.classId === 'unassigned' || s.classId === '' || s.house === 'Unassigned';
                        }
                        return s.classId === selectedRosterClassFilter;
                      })
                      .sort((a, b) => {
                        if (selectedRosterClassFilter === 'All') {
                          return a.classId.localeCompare(b.classId) || a.rollNo.localeCompare(b.rollNo);
                        }
                        return a.rollNo.localeCompare(b.rollNo);
                      })
                      .map((student) => {
                        const sClass = student.classId === 'unassigned' || !student.classId
                          ? 'Unassigned'
                          : (classes.find((c) => c.id === student.classId)?.name || student.classId);
                        return (
                          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-700">{student.rollNo}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-sm font-black text-gray-900 leading-tight">{student.name}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Adm No: {student.admissionNo}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-800">{sClass}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-600">
                                <Shield className="h-2.5 w-2.5 text-blue-500 mr-1" /> {student.house}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${student.gender === 'F' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                                {student.gender === 'M' ? 'Boy' : 'Girl'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => onViewStudentHistory(student.id)}
                                className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-100 cursor-pointer transition-all"
                              >
                                <ClipboardList className="h-3 w-3 mr-1" /> View Ledger
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in" id="staff-management-tab">
          
          {/* Staff Success Banner */}
          {staffSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-pulse">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{staffSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Side: Forms Column */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Form: Add New Teacher */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex items-center space-x-2 border-b border-gray-50 pb-3 mb-4">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-black text-gray-900">Register New Teacher</h3>
                </div>

                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. S. K. Nair"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PGT Physics"
                      value={newTeacherDesignation}
                      onChange={(e) => setNewTeacherDesignation(e.target.value)}
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Contact Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 98480xxxxx"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(e.target.value)}
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Teacher to Directory
                  </button>
                </form>
              </div>

              {/* Assignment Card: House Masters */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-gray-900">Residential House Masters</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {(['Aravalli', 'Nilgiri', 'Shivalik', 'Udaygiri'] as House[]).map((house) => {
                    const currentHM = houseMasters.find((hm) => hm.house === house)?.masterName || 'Not Assigned';
                    return (
                      <div key={house} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900">{house} House</span>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Hostel Block
                          </span>
                        </div>
                        <div>
                          <label className="block text-[8px] font-extrabold uppercase text-gray-400 tracking-wider mb-1">Assigned House Master / Mistress</label>
                          <select
                            value={currentHM}
                            onChange={(e) => onChangeHouseMaster(house, e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                          >
                            <option value="">-- Unassigned --</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.name}>{t.name} ({t.designation})</option>
                            ))}
                            {!teachers.some(t => t.name === currentHM) && currentHM !== 'Not Assigned' && currentHM !== '' && (
                              <option value={currentHM}>{currentHM}</option>
                            )}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Side Columns */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* Assignment Card: Class Teachers */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex items-center space-x-2 border-b border-gray-50 pb-3 mb-4">
                  <ClipboardList className="h-4 w-4 text-orange-600" />
                  <h3 className="text-sm font-black text-gray-900">Assign Class Teachers</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">{cls.name}</span>
                        <span className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Class Code: {cls.id}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[8px] font-extrabold uppercase text-gray-400 tracking-wider mb-1">Assigned Class Teacher</label>
                        <select
                          value={cls.classTeacher}
                          onChange={(e) => onChangeClassTeacher(cls.id, e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold text-gray-800"
                        >
                          <option value="">-- Unassigned --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.name}>{t.name} ({t.designation})</option>
                          ))}
                          {!teachers.some(t => t.name === cls.classTeacher) && cls.classTeacher !== '' && (
                            <option value={cls.classTeacher}>{cls.classTeacher}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Directory Panel */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-black text-gray-900">Active Teachers Directory</h3>
                  </div>
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-bold">
                    Count: {teachers.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100">
                        <th className="py-2.5 px-3">Teacher Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Contact No</th>
                        <th className="py-2.5 px-3">Assignments</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                      {teachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400 font-medium">
                            No teachers currently registered. Use the register form to add.
                          </td>
                        </tr>
                      ) : (
                        teachers.map((t) => {
                          const assignedClasses = classes.filter((cls) => cls.classTeacher === t.name).map((cls) => cls.name);
                          const assignedHouses = houseMasters.filter((hm) => hm.masterName === t.name).map((hm) => hm.house);
                          
                          return (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-3 font-bold text-gray-900">{t.name}</td>
                              <td className="py-3 px-3 text-gray-500">{t.designation}</td>
                              <td className="py-3 px-3 font-mono text-gray-400 text-[11px]">{t.phone || 'N/A'}</td>
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {assignedClasses.map((clsName) => (
                                    <span key={clsName} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                                      Teacher {clsName}
                                    </span>
                                  ))}
                                  {assignedHouses.map((houseName) => (
                                    <span key={houseName} className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">
                                      {houseName} HM
                                    </span>
                                  ))}
                                  {assignedClasses.length === 0 && assignedHouses.length === 0 && (
                                    <span className="text-gray-400 text-[10px] italic">No active duty</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove "${t.name}" from the teachers list?`)) {
                                      onRemoveTeacher(t.id);
                                      setStaffSuccessMsg(`Successfully removed "${t.name}" from the active staff directory.`);
                                      setTimeout(() => setStaffSuccessMsg(''), 5000);
                                    }
                                  }}
                                  className="inline-flex items-center px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-md border border-rose-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
