/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, FileSpreadsheet, Download, Users, CheckCircle, 
  AlertTriangle, Eye, HelpCircle, Activity, Heart, Award, 
  ArrowUpRight, School as SchoolIcon, Shield, PlusCircle, Search, 
  Filter, CalendarRange, Key, Globe, LayoutGrid
} from 'lucide-react';
import { Student, ClassSection, AttendanceRecord, AttendanceStatus, House, School, Teacher, HouseMaster } from '../types';

interface RegionalViewProps {
  schools: School[];
  students: Student[];
  classes: ClassSection[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onAddSchool: (school: School) => void;
  teachers: Teacher[];
  houseMasters: HouseMaster[];
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'schoolId'>) => void;
  onRemoveTeacher: (teacherId: string) => void;
  onChangeHouseMaster: (house: House, masterName: string) => void;
  onChangeClassTeacher: (classId: string, teacherName: string) => void;
}

export const RegionalView: React.FC<RegionalViewProps> = ({
  schools,
  students,
  classes,
  attendanceRecords,
  selectedDate,
  onAddSchool,
  teachers,
  houseMasters,
  onAddTeacher,
  onRemoveTeacher,
  onChangeHouseMaster,
  onChangeClassTeacher,
}) => {
  // Menu navigation in regional admin console
  type MenuTab = 'dashboard' | 'schools-list' | 'live-attendance' | 'performance-logs' | 'demographics' | 'register-school';
  const [activeMenu, setActiveMenu] = useState<MenuTab>('dashboard');

  // School filtration
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('All');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('All');
  
  // Search state in student directory
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Live Attendance Register states
  const [selectedLiveSchoolId, setSelectedLiveSchoolId] = useState<string>(schools[0]?.id || 'JNV-Vattem');
  const [selectedLiveClassId, setSelectedLiveClassId] = useState<string>('c6');
  const [selectedLiveDate, setSelectedLiveDate] = useState<string>(selectedDate);

  // Add School form state
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false);
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolRegion, setNewSchoolRegion] = useState('Hyderabad');
  const [newSchoolState, setNewSchoolState] = useState('Telangana');
  const [newSchoolPin, setNewSchoolPin] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');
  const [schoolAddSuccess, setSchoolAddSuccess] = useState(false);

  // Available regions
  const JNV_REGIONS = [
    'Bhopal', 'Chandigarh', 'Hyderabad', 'Jaipur', 'Lucknow', 'Patna', 'Pune', 'Shillong'
  ];

  // Form submit handler
  const handleAddSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolId.trim() || !newSchoolName.trim() || !newSchoolPassword.trim()) return;

    onAddSchool({
      id: newSchoolId.trim(),
      name: newSchoolName.trim(),
      region: newSchoolRegion,
      state: newSchoolState.trim(),
      pinCode: newSchoolPin.trim() || '500001',
      passwordHash: newSchoolPassword,
    });

    // Reset Form
    setNewSchoolId('');
    setNewSchoolName('');
    setNewSchoolPin('');
    setNewSchoolPassword('');
    setShowAddSchoolForm(false);
    setSchoolAddSuccess(true);
    setTimeout(() => setSchoolAddSuccess(false), 5000);
  };

  // Filter schools based on region
  const filteredSchools = schools.filter(s => 
    selectedRegionFilter === 'All' || s.region === selectedRegionFilter
  );

  // Filter students based on school ID & regional office
  const filteredStudents = students.filter(s => {
    const school = schools.find(sch => sch.id === s.schoolId);
    if (!school) return false;
    
    const matchesSchool = selectedSchoolId === 'All' || s.schoolId === selectedSchoolId;
    const matchesRegion = selectedRegionFilter === 'All' || school.region === selectedRegionFilter;
    const matchesClass = classFilter === 'All' || s.classId === classFilter;
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.rollNo.includes(studentSearch);

    return matchesSchool && matchesRegion && matchesClass && matchesSearch;
  });

  // Calculate stats for current selected filters
  const currentDayRecords = attendanceRecords.filter((r) => r.date === selectedDate);

  const stats = filteredStudents.reduce(
    (acc, s) => {
      // Find current day record
      const rec = currentDayRecords.find((r) => r.studentId === s.id && r.schoolId === s.schoolId);
      const status = rec ? rec.status : 'NR';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { P: 0, A: 0, L: 0, OD: 0, NR: 0 }
  );

  const totalMarked = filteredStudents.length - stats.NR;
  const complianceRate = totalMarked > 0 
    ? Math.round(((stats.P + stats.OD) / totalMarked) * 100) 
    : 100;

  // Compile detailed student profile attendance reports
  const studentReports = filteredStudents.map((student) => {
    const studentRecs = attendanceRecords.filter((r) => r.studentId === student.id && r.schoolId === student.schoolId);
    const total = studentRecs.length;
    const nr = studentRecs.filter((r) => r.status === 'NR').length;
    const p = studentRecs.filter((r) => r.status === 'P').length;
    const a = studentRecs.filter((r) => r.status === 'A').length;
    const l = studentRecs.filter((r) => r.status === 'L').length;
    const od = studentRecs.filter((r) => r.status === 'OD').length;

    const activeDays = total - nr;
    const percentage = activeDays > 0 ? Math.round(((p + od) / activeDays) * 100) : 100;

    return {
      student,
      p, a, l, od, activeDays, percentage
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Demographics compilation for active scope
  const boys = studentReports.filter(r => r.student.gender === 'M');
  const girls = studentReports.filter(r => r.student.gender === 'F');

  const boysAvg = boys.length > 0 ? Math.round(boys.reduce((sum, item) => sum + item.percentage, 0) / boys.length) : 100;
  const girlsAvg = girls.length > 0 ? Math.round(girls.reduce((sum, item) => sum + item.percentage, 0) / girls.length) : 100;

  // CSV Simulation download
  const downloadReportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'School,Region,Admission No,Roll No,Name,Class,Present Days,Absent Days,Leave Days,On Duty Days,Attendance Rate\n';
    
    studentReports.forEach(({ student, p, a, l, od, percentage }) => {
      const sch = schools.find(s => s.id === student.schoolId);
      const clsName = classes.find((c) => c.id === student.classId)?.name || student.classId;
      csvContent += `"${sch?.name || student.schoolId}","${sch?.region || ''}","${student.admissionNo}","${student.rollNo}","${student.name}","${clsName}",${p},${a},${l},${od},${percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JNV_Regional_Compliance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic calculation for all JNV schools for dashboard summary
  const schoolComplianceSummary = schools.map(sch => {
    const schoolStudents = students.filter(s => s.schoolId === sch.id);
    const totalCount = schoolStudents.length;
    // Count attendance records for this school on selectedDate
    const todaySchRecs = attendanceRecords.filter(r => r.schoolId === sch.id && r.date === selectedDate);
    
    const markedCount = schoolStudents.filter(s => 
      todaySchRecs.some(r => r.studentId === s.id && r.status !== 'NR')
    ).length;
    
    const presentCount = schoolStudents.filter(s => 
      todaySchRecs.some(r => r.studentId === s.id && (r.status === 'P' || r.status === 'OD'))
    ).length;

    const rate = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 100;
    const isPending = markedCount === 0;

    return {
      school: sch,
      totalCount,
      markedCount,
      rate,
      isPending
    };
  });

  return (
    <div className="space-y-6" id="regional-view-container">
      
      {/* Upper regional executive KPI header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-md border border-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-emerald-600/30 text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-500/20">
              NVS Regional Commissioner Office
            </span>
            <span className="text-emerald-300 text-xs">• Indian Region Directory</span>
          </div>
          <h2 className="text-xl font-black mt-2">JNV Central Attendance Auditor & Register</h2>
          <p className="text-xs text-emerald-100/80 font-semibold mt-1">
            Real-time compliance monitoring, multi-school credentials management, and student attendance ledger logs.
          </p>
        </div>
        
        <div className="bg-white/10 p-4 rounded-xl border border-white/5 text-right flex flex-col justify-center">
          <span className="text-[9px] uppercase font-bold text-emerald-200">Active Date Compliance</span>
          <p className="text-2xl font-black mt-0.5">{complianceRate}%</p>
          <span className="text-[10px] text-emerald-100/75 mt-0.5 font-bold">
            Marked: {totalMarked} / {filteredStudents.length} Scholars
          </span>
        </div>
      </div>

      {/* Modern Horizontal Navigation Menu */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-white p-1.5 rounded-xl shadow-3xs">
        <button
          onClick={() => setActiveMenu('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveMenu('schools-list')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'schools-list' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <SchoolIcon className="h-3.5 w-3.5" />
          <span>Schools Directory ({schools.length})</span>
        </button>
        <button
          onClick={() => setActiveMenu('live-attendance')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'live-attendance' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Live Attendance Auditor</span>
        </button>
        <button
          onClick={() => setActiveMenu('performance-logs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'performance-logs' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Audit Ledger Logs</span>
        </button>
        <button
          onClick={() => setActiveMenu('demographics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'demographics' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Demographics Metrics</span>
        </button>
        <button
          onClick={() => setActiveMenu('register-school')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
            activeMenu === 'register-school' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Register JNV School</span>
        </button>
      </div>

      {/* Tab content: 1. Dashboard Overview */}
      {activeMenu === 'dashboard' && (
        <div className="space-y-6">
          {/* Dashboard Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                <SchoolIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registered Schools</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{schools.length}</h3>
                <p className="text-xs text-gray-500 font-semibold">Active Samiti Campuses</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Region Scholars</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{students.length}</h3>
                <p className="text-xs text-gray-500 font-semibold">Residential Enrollment</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-purple-50 text-purple-600 p-3.5 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Rosters Marked Today</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">
                  {schools.filter(sc => attendanceRecords.some(r => r.schoolId === sc.id && r.date === selectedDate && r.status !== 'NR')).length} / {schools.length}
                </h3>
                <p className="text-xs text-purple-600 font-semibold">JNV branches compliant today</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center space-x-4">
              <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overall region compliance</span>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">{complianceRate}%</h3>
                <p className="text-xs text-gray-500 font-semibold">Average of active registers</p>
              </div>
            </div>
          </div>

          {/* School Performance Leaderboard */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
            <div className="border-b border-gray-50 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-gray-950">School Attendance Performance & Status</h3>
                <p className="text-xs text-gray-400 mt-0.5">Summary reports for all JNV institutions on {selectedDate}</p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md border border-blue-100">
                Audited in Hyderabad HQ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="py-2.5 px-3">School Name</th>
                    <th className="py-2.5 px-3">ID / Username</th>
                    <th className="py-2.5 px-3">NVS Region</th>
                    <th className="py-2.5 px-3 text-center">Enrollment</th>
                    <th className="py-2.5 px-3 text-center">Today's Roster Status</th>
                    <th className="py-2.5 px-3 text-right">Today's Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                  {schoolComplianceSummary.map(({ school, totalCount, markedCount, rate, isPending }) => (
                    <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-black text-gray-950">{school.name}</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-bold">{school.id}</td>
                      <td className="py-3 px-3">{school.region} Region</td>
                      <td className="py-3 px-3 text-center font-bold">{totalCount} Scholars</td>
                      <td className="py-3 px-3 text-center">
                        {isPending ? (
                          <span className="inline-flex px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-400 rounded text-[10px] font-black uppercase">
                            Pending Submission
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase">
                            Submitted ({markedCount} marked)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black">
                        {isPending ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <span className={rate >= 75 ? 'text-emerald-700' : 'text-rose-600'}>
                            {rate}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab content: 2. Schools Directory */}
      {activeMenu === 'schools-list' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-950">Active Schools Directory</h3>
                <p className="text-xs text-gray-500 font-medium">Full index of authorized JNV branches across the samiti. These branches log daily scholar registrations.</p>
              </div>
              <button
                onClick={() => setActiveMenu('register-school')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" /> Onboard JNV Campus
              </button>
            </div>

            {/* School Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-extrabold tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="py-3 px-4">School ID</th>
                    <th className="py-3 px-4">School Name</th>
                    <th className="py-3 px-4">NVS Region</th>
                    <th className="py-3 px-4">State & Location</th>
                    <th className="py-3 px-4">Registered Scholars</th>
                    <th className="py-3 px-4 text-right">Login Key Credentials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                  {schools.map(sch => {
                    const schoolStudentsCount = students.filter(s => s.schoolId === sch.id).length;
                    return (
                      <tr key={sch.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{sch.id}</td>
                        <td className="py-3 px-4 font-black text-gray-900">{sch.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {sch.region}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-500">
                          {sch.state} (PIN: {sch.pinCode})
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-600">
                          {schoolStudentsCount} scholars
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center text-[10px] font-mono font-bold bg-gray-100 p-1 rounded-md text-gray-500 border border-gray-200">
                            <Key className="h-3 w-3 mr-1 text-amber-500" /> password: {sch.passwordHash}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab content: 3. Live Attendance Auditor */}
      {activeMenu === 'live-attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
            <div className="border-b border-gray-50 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-gray-950">Real-Time Classroom Register Lookups</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select any authorized JNV campus, classroom, and audit date to query local rosters instantly.</p>
            </div>

            {/* Selector Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target School *</label>
                <select
                  value={selectedLiveSchoolId}
                  onChange={(e) => setSelectedLiveSchoolId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  {schools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class Section *</label>
                <select
                  value={selectedLiveClassId}
                  onChange={(e) => setSelectedLiveClassId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Roster Date *</label>
                <input
                  type="date"
                  value={selectedLiveDate}
                  onChange={(e) => setSelectedLiveDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            {/* Live Class Details Table */}
            {(() => {
              const liveStudents = students.filter(s => s.schoolId === selectedLiveSchoolId && s.classId === selectedLiveClassId);
              const liveRecords = attendanceRecords.filter(r => r.schoolId === selectedLiveSchoolId && r.date === selectedLiveDate);
              const targetSchoolName = schools.find(s => s.id === selectedLiveSchoolId)?.name || selectedLiveSchoolId;
              const targetClassName = classes.find(c => c.id === selectedLiveClassId)?.name || selectedLiveClassId;

              const presentCount = liveStudents.filter(s => {
                const rec = liveRecords.find(r => r.studentId === s.id);
                return rec?.status === 'P';
              }).length;

              const absentCount = liveStudents.filter(s => {
                const rec = liveRecords.find(r => r.studentId === s.id);
                return rec?.status === 'A';
              }).length;

              const leaveCount = liveStudents.filter(s => {
                const rec = liveRecords.find(r => r.studentId === s.id);
                return rec?.status === 'L';
              }).length;

              const odCount = liveStudents.filter(s => {
                const rec = liveRecords.find(r => r.studentId === s.id);
                return rec?.status === 'OD';
              }).length;

              const pendingCount = liveStudents.length - (presentCount + absentCount + leaveCount + odCount);

              return (
                <div className="space-y-4">
                  {/* Classroom stats summary bar */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Roster Scholars</p>
                      <p className="text-lg font-black text-gray-900">{liveStudents.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-emerald-600">Present (P)</p>
                      <p className="text-lg font-black text-emerald-600">{presentCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-rose-600">Absent (A)</p>
                      <p className="text-lg font-black text-rose-600">{absentCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-amber-600">Leave (L)</p>
                      <p className="text-lg font-black text-amber-600">{leaveCount}</p>
                    </div>
                    <div className="text-center col-span-2 md:col-span-1">
                      <p className="text-[9px] uppercase font-bold text-blue-600">On Duty / Pending</p>
                      <p className="text-lg font-black text-blue-600">{odCount} / {pendingCount}</p>
                    </div>
                  </div>

                  {/* Classroom student list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] uppercase font-extrabold tracking-wider text-gray-400 border-b border-gray-100">
                          <th className="py-2.5 px-3">Roll No</th>
                          <th className="py-2.5 px-3">Admission No</th>
                          <th className="py-2.5 px-3">Scholar Name</th>
                          <th className="py-2.5 px-3">JNV House</th>
                          <th className="py-2.5 px-3">Gender</th>
                          <th className="py-2.5 px-3 text-right">Roster Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                        {liveStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-400">
                              No scholars registered under {targetSchoolName} for {targetClassName} class.
                            </td>
                          </tr>
                        ) : (
                          liveStudents.sort((a,b) => a.name.localeCompare(b.name)).map((s) => {
                            const rec = liveRecords.find(r => r.studentId === s.id);
                            const status = rec ? rec.status : 'NR';
                            
                            let statusBadge = (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 border border-gray-200 text-[10px] font-bold rounded uppercase">
                                Not Recorded
                              </span>
                            );
                            if (status === 'P') statusBadge = <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded uppercase">Present (P)</span>;
                            if (status === 'A') statusBadge = <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold rounded uppercase">Absent (A)</span>;
                            if (status === 'L') statusBadge = <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded uppercase">On Leave (L)</span>;
                            if (status === 'OD') statusBadge = <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded uppercase">On Duty (OD)</span>;

                            return (
                              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-gray-500">{s.rollNo}</td>
                                <td className="py-2.5 px-3 font-mono text-gray-400">{s.admissionNo}</td>
                                <td className="py-2.5 px-3 font-black text-gray-900">{s.name}</td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold">
                                    {s.house}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium">{s.gender === 'M' ? 'Boy (M)' : 'Girl (F)'}</td>
                                <td className="py-2.5 px-3 text-right">{statusBadge}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab content: 4. Audit Ledger Logs */}
      {activeMenu === 'performance-logs' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
            <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Audit Scope & Roster Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Region Filter */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Region</label>
                <select
                  value={selectedRegionFilter}
                  onChange={(e) => {
                    setSelectedRegionFilter(e.target.value);
                    setSelectedSchoolId('All');
                  }}
                  className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold font-semibold"
                >
                  <option value="All">All Regions (India)</option>
                  {JNV_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg} Region</option>
                  ))}
                </select>
              </div>

              {/* School filter */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold font-semibold"
                >
                  <option value="All">All Schools (Selected Region)</option>
                  {schools
                    .filter(s => selectedRegionFilter === 'All' || s.region === selectedRegionFilter)
                    .map(sch => (
                      <option key={sch.id} value={sch.id}>{sch.name}</option>
                    ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class Section</label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold font-semibold"
                >
                  <option value="All">All Class Registers</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* CSV Simulation export */}
              <div className="flex items-end">
                <button
                  onClick={downloadReportCSV}
                  className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-sm flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export Compiled Audit Ledger (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Daily counts indicator */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-3xs">
              <span className="text-[9px] uppercase font-bold text-gray-400">Scholars in Scope</span>
              <p className="text-xl font-black text-gray-900 mt-1">{filteredStudents.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-3xs">
              <span className="text-[9px] uppercase font-bold text-emerald-600">Present (Today)</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{stats.P}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-3xs">
              <span className="text-[9px] uppercase font-bold text-rose-600">Absent (Today)</span>
              <p className="text-xl font-black text-rose-600 mt-1">{stats.A}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-3xs">
              <span className="text-[9px] uppercase font-bold text-amber-600">Leave (Today)</span>
              <p className="text-xl font-black text-amber-600 mt-1">{stats.L}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-3xs col-span-2 md:col-span-1">
              <span className="text-[9px] uppercase font-bold text-blue-600">On Duty (Today)</span>
              <p className="text-xl font-black text-blue-600 mt-1">{stats.OD}</p>
            </div>
          </div>

          {/* Searchable Student Directory with Attendance Records */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-950">Scholar Compliance Ledger Directory</h3>
                <p className="text-xs text-gray-400 font-medium">Search and view aggregated historical counts across JNV institutions</p>
              </div>

              {/* Interactive Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, admission no..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-extrabold tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="py-3 px-4">Scholar Details</th>
                    <th className="py-3 px-4">School Name</th>
                    <th className="py-3 px-4">NVS Region</th>
                    <th className="py-3 px-4 text-center">Working Days</th>
                    <th className="py-3 px-4 text-center">P / A / L / OD</th>
                    <th className="py-3 px-4 text-right">Attendance Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                  {studentReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                        No scholar records match the active search/filters criteria.
                      </td>
                    </tr>
                  ) : (
                    studentReports.map(({ student, p, a, l, od, activeDays, percentage }) => {
                      const sch = schools.find(s => s.id === student.schoolId);
                      const cls = classes.find(c => c.id === student.classId)?.name || student.classId;
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-black text-gray-900 leading-tight">{student.name}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
                                Adm: {student.admissionNo} • Roll: {student.rollNo} • Class: {cls}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-blue-700">{sch?.name || student.schoolId}</td>
                          <td className="py-3 px-4 text-xs font-medium text-gray-500">{sch?.region} Region</td>
                          <td className="py-3 px-4 text-center font-mono text-gray-600">{activeDays} days</td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="text-emerald-600">{p}P</span> / <span className="text-rose-500">{a}A</span> / <span className="text-amber-500">{l}L</span> / <span className="text-blue-500">{od}O</span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">
                            <span className={percentage < 75 ? 'text-rose-600' : 'text-emerald-700'}>
                              {percentage}%
                            </span>
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
      )}

      {/* Tab content: 5. Demographics */}
      {activeMenu === 'demographics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Gender Parity Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-gray-900">Gender Parity Attendance Audit</h3>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              
              <p className="text-xs text-gray-500 font-medium mb-4">
                JNV ensures healthy educational parity across co-educational systems. Regional office monitors daily boys vs girls attendance.
              </p>

              <div className="space-y-4">
                {/* Boys metric */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-blue-900 uppercase">Boys Demographics</p>
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">Enrollment: {boys.length} Scholars</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-700">{boysAvg}%</p>
                    <span className="text-[9px] text-gray-400 font-bold">Cumulative Rate</span>
                  </div>
                </div>

                {/* Girls metric */}
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-rose-950 uppercase">Girls Demographics</p>
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">Enrollment: {girls.length} Scholars</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-rose-700">{girlsAvg}%</p>
                    <span className="text-[9px] text-gray-400 font-bold">Cumulative Rate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-50 pt-3 flex justify-between text-xs font-bold text-gray-500">
              <span>Standard Co-ed Parity Target:</span>
              <span className="text-emerald-700">&gt; 92.5%</span>
            </div>
          </div>

          {/* Regional Information Note */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-gray-900">JNV Regional Directives</h3>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              
              <div className="space-y-3.5 text-xs text-gray-600 font-medium leading-relaxed">
                <p>
                  1. **Admission Logs & Rosters**: Each institution must keep their scholar rosters synchronized alphabetically at the beginning of each calendar month.
                </p>
                <p>
                  2. **Audit Trails**: Attendance entries undergo automatic nightly audits from Regional Headquarters to verify that leave forms (L) and on-duty marks (OD) have matching physical application paperwork uploaded at the school level.
                </p>
                <p>
                  3. **Low-Attendance Defaulters**: Any residential scholar falling below 75% attendance triggers an automated advisory letter dispatched to parents, and requires principal-level validation.
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-50 pt-3 flex justify-between text-xs font-bold text-gray-400">
              <span>NVS Commissionerate Office, New Delhi</span>
            </div>
          </div>

        </div>
      )}

      {/* Tab content: 6. Register JNV School */}
      {activeMenu === 'register-school' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-950">Register New JNV Campus Node</h3>
                <p className="text-xs text-gray-500 font-medium">Add new JNV campuses to the samiti cluster. Each school gets an exclusive login ID and password.</p>
              </div>
            </div>

            {schoolAddSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs font-bold mb-4 animate-pulse">
                🎉 Success! New Jawahar Navodaya Vidyalaya has been registered and provisioned on central databases. Access is immediately enabled with the designated credentials.
              </div>
            )}

            <form onSubmit={handleAddSchoolSubmit} className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">JNV Registration Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Unique School ID (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JNV-Nalgonda"
                    value={newSchoolId}
                    onChange={(e) => setNewSchoolId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JNV Nalgonda"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">School Region *</label>
                  <select
                    value={newSchoolRegion}
                    onChange={(e) => setNewSchoolRegion(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold"
                  >
                    {JNV_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg} Region</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telangana"
                    value={newSchoolState}
                    onChange={(e) => setNewSchoolState(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pin Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 508001"
                    value={newSchoolPin}
                    onChange={(e) => setNewSchoolPin(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Allocated Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter school-specific key"
                    value={newSchoolPassword}
                    onChange={(e) => setNewSchoolPassword(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden font-bold text-blue-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-emerald-700 cursor-pointer flex items-center space-x-1"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>Deploy School Node & Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
