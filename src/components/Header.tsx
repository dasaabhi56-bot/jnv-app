/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { School, Calendar, Users, Briefcase, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedDate,
  onDateChange,
}) => {
  // Format the date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Adjust date by a number of days (for prev/next shortcuts)
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    // skip Sundays if moving day-by-day
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + (days > 0 ? 1 : -1));
    }
    onDateChange(d.toISOString().split('T')[0]);
  };

  return (
    <header id="app-header" className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
          
          {/* JNV Brand / School Title */}
          <div className="flex items-center space-x-3.5">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center">
              <School className="h-6 w-6" id="school-logo-icon" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                  Govt. of India
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-100">
                  Hyderabad Region
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                JNV Vattem
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Jawahar Navodaya Vidyalaya, Nagarkurnool Dist, Telangana
              </p>
            </div>
          </div>

          {/* Center Date Picker & Navigation */}
          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 self-start lg:self-center">
            <button
              id="btn-prev-date"
              onClick={() => adjustDate(-1)}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-gray-500 transition-all shadow-2xs hover:shadow-3xs active:scale-95"
              title="Previous Working Day"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-2 px-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <input
                id="header-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-800 border-none outline-hidden focus:ring-0 cursor-pointer"
              />
              <span className="hidden sm:inline-block text-xs font-medium text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-md">
                {formatDate(selectedDate)}
              </span>
            </div>

            <button
              id="btn-next-date"
              onClick={() => adjustDate(1)}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-gray-500 transition-all shadow-2xs hover:shadow-3xs active:scale-95"
              title="Next Working Day"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right Role-Selector Switcher */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
            {(['Teacher', 'Principal', 'Regional'] as UserRole[]).map((role) => {
              const isActive = currentRole === role;
              let roleColor = 'text-blue-600 bg-white shadow-xs border-gray-100';
              let roleIcon = <Briefcase className="h-3.5 w-3.5 mr-1.5" />;
              
              if (role === 'Principal') {
                roleIcon = <Award className="h-3.5 w-3.5 mr-1.5" />;
                if (isActive) roleColor = 'text-purple-700 bg-white shadow-xs border-gray-100';
              } else if (role === 'Regional') {
                roleIcon = <Users className="h-3.5 w-3.5 mr-1.5" />;
                if (isActive) roleColor = 'text-emerald-700 bg-white shadow-xs border-gray-100';
              }

              return (
                <button
                  key={role}
                  id={`role-tab-${role.toLowerCase()}`}
                  onClick={() => onRoleChange(role)}
                  className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all border border-transparent cursor-pointer ${
                    isActive
                      ? `${roleColor}`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
                  }`}
                >
                  {roleIcon}
                  {role === 'Teacher' ? 'Class Teacher' : role === 'Principal' ? 'Principal' : 'Regional HQ'}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </header>
  );
};
