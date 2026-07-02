/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, User, Calendar, Award, Shield, CheckCircle, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import { Student, AttendanceRecord, ClassSection, AttendanceStatus } from '../types';

interface StudentHistoryModalProps {
  student: Student;
  classes: ClassSection[];
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onUpdateStatus?: (date: string, status: AttendanceStatus) => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  student,
  classes,
  attendanceRecords,
  onClose,
  onUpdateStatus,
}) => {
  const studentClass = classes.find((c) => c.id === student.classId);

  // Filter records for this student
  const studentRecords = attendanceRecords
    .filter((r) => r.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date)); // descending date

  // Calculate stats
  const totalRecords = studentRecords.length;
  const presentCount = studentRecords.filter((r) => r.status === 'P').length;
  const absentCount = studentRecords.filter((r) => r.status === 'A').length;
  const leaveCount = studentRecords.filter((r) => r.status === 'L').length;
  const odCount = studentRecords.filter((r) => r.status === 'OD').length;
  const nrCount = studentRecords.filter((r) => r.status === 'NR').length;

  const activeDaysCount = totalRecords - nrCount;
  const attendancePercentage = activeDaysCount > 0 
    ? Math.round(((presentCount + odCount) / activeDaysCount) * 100) 
    : 100;

  // Badge styles helper
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'P':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Present
          </span>
        );
      case 'A':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Absent
          </span>
        );
      case 'L':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="h-3 w-3 mr-1" /> Leave
          </span>
        );
      case 'OD':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Activity className="h-3 w-3 mr-1" /> On Duty
          </span>
        );
      case 'NR':
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
            <HelpCircle className="h-3 w-3 mr-1" /> Unmarked
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="student-history-overlay">
      <div 
        id="student-history-modal" 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">{student.name}</h2>
              <p className="text-xs text-blue-100 font-medium">
                Admission No: {student.admissionNo} • Roll No: {student.rollNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            id="btn-close-history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Class</span>
              <p className="text-sm font-extrabold text-gray-800">{studentClass?.name || student.classId}</p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">House</span>
              <p className="text-sm font-extrabold text-gray-800 flex items-center">
                <Shield className="h-3.5 w-3.5 text-blue-500 mr-1" />
                {student.house}
              </p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Gender</span>
              <p className="text-sm font-extrabold text-gray-800">{student.gender === 'M' ? 'Boy (M)' : 'Girl (F)'}</p>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Attendance %</span>
              <p className={`text-lg font-extrabold ${attendancePercentage < 75 ? 'text-rose-600' : 'text-blue-700'}`}>
                {attendancePercentage}%
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Metrics Summary</h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <p className="font-extrabold text-emerald-700">{presentCount}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Present</p>
              </div>
              <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                <p className="font-extrabold text-rose-700">{absentCount}</p>
                <p className="text-[10px] text-rose-600 font-medium">Absent</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <p className="font-extrabold text-amber-700">{leaveCount}</p>
                <p className="text-[10px] text-amber-600 font-medium">Leave</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                <p className="font-extrabold text-blue-700">{odCount}</p>
                <p className="text-[10px] text-blue-600 font-medium">On Duty</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="font-extrabold text-gray-600">{nrCount}</p>
                <p className="text-[10px] text-gray-500 font-medium">Unmarked</p>
              </div>
            </div>
            {attendancePercentage < 75 && (
              <div className="mt-3 bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-600" />
                <span>
                  <strong>Shortage of Attendance Alert:</strong> This student falls below the mandatory 75% CBSE criteria for Jawahar Navodaya Vidyalayas.
                </span>
              </div>
            )}
          </div>

          {/* Detailed Ledger Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Attendance Ledger</h3>
              <span className="text-xs font-medium text-gray-500">Showing {studentRecords.length} recorded days</span>
            </div>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
              {studentRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No attendance records exist for this student yet.
                </div>
              ) : (
                studentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {onUpdateStatus ? (
                        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                          {(['P', 'A', 'L', 'OD'] as AttendanceStatus[]).map((status) => (
                            <button
                              key={status}
                              onClick={() => onUpdateStatus(record.date, status)}
                              className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                                record.status === status
                                  ? status === 'P'
                                    ? 'bg-emerald-600 text-white'
                                    : status === 'A'
                                    ? 'bg-rose-600 text-white'
                                    : status === 'L'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-600 text-white'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      ) : (
                        getStatusBadge(record.status)
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 text-sm font-bold rounded-lg border border-gray-200 shadow-3xs hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
