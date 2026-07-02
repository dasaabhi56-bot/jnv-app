/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Radio, Camera, Cpu, Zap, Shield, Play, Square, 
  Terminal, CheckCircle, Clock, Award, Check, AlertTriangle 
} from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface AutomationHubProps {
  students: Student[];
  selectedClassId: string;
  selectedDate: string;
  onUpdateStatus: (studentId: string, date: string, status: AttendanceStatus) => void;
}

export const AutomationHub: React.FC<AutomationHubProps> = ({
  students,
  selectedClassId,
  selectedDate,
  onUpdateStatus,
}) => {
  const [activeTech, setActiveTech] = useState<'qr' | 'nfc' | 'face'>('qr');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [currentScanningStudent, setCurrentScanningStudent] = useState<Student | null>(null);
  const [progressCount, setProgressCount] = useState(0);
  
  const classStudents = students.filter(s => s.classId === selectedClassId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSimLogs((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 30));
  };

  const startSimulation = () => {
    if (classStudents.length === 0) {
      addLog("⚠️ Error: No students registered in this class to simulate.");
      return;
    }
    
    setIsSimulating(true);
    setProgressCount(0);
    setSimLogs([]);
    addLog(`🚀 Initializing automated ${activeTech.toUpperCase()} attendance reader engine...`);
    addLog(`📅 Targeting Date: ${selectedDate} • Class Size: ${classStudents.length} scholars`);

    let index = 0;
    
    timerRef.current = setInterval(() => {
      if (index >= classStudents.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSimulating(false);
        setCurrentScanningStudent(null);
        addLog(`✅ Automation Batch Complete! Successfully synced all ${classStudents.length} records to JNV Central Registry.`);
        return;
      }

      const student = classStudents[index];
      setCurrentScanningStudent(student);
      setProgressCount(index + 1);

      // Determine a realistic status: ~88% Present, 8% Absent, 4% On Duty
      const rand = Math.random();
      let status: AttendanceStatus = 'P';
      let statusLabel = 'PRESENT';
      if (rand < 0.08) {
        status = 'A';
        statusLabel = 'ABSENT';
      } else if (rand < 0.12) {
        status = 'OD';
        statusLabel = 'ON DUTY';
      }

      // Actually update the state
      onUpdateStatus(student.id, selectedDate, status);

      // Log the event
      if (activeTech === 'qr') {
        addLog(`🔍 [QR CODE DECODED] CardID V-QR-${student.admissionNo.replace('/', '-')} detected. Student: ${student.name} (Roll ${student.rollNo}) -> Marked ${statusLabel}`);
      } else if (activeTech === 'nfc') {
        addLog(`📡 [NFC TAP SUCCESS] UID 04:A3:F8:${student.rollNo}:B5:${student.id.toUpperCase()} scanned. Student: ${student.name} (Roll ${student.rollNo}) -> Marked ${statusLabel}`);
      } else {
        addLog(`🤖 [AI FACE MATCH] Confidence 98.4% for profile ${student.admissionNo}. Student: ${student.name} (Roll ${student.rollNo}) -> Marked ${statusLabel}`);
      }

      index++;
    }, 1500);
  };

  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
    setCurrentScanningStudent(null);
    addLog("🛑 Simulation stopped by operator. Roster registration paused.");
  };

  const techDetails = {
    qr: {
      title: 'QR Code Attendance Badge system',
      icon: <QrCode className="h-6 w-6 text-blue-600" />,
      hardware: ['1D/2D High-Speed USB Scanner', 'Raspberry Pi / Android Gateway Tablet', 'Printed ID Badges with laminated custom QR code'],
      cost: 'Very Low (Cost-effective deployment, printable badges)',
      benefits: 'Negligible hardware expenses, robust backup (laminated badges last years), instant visual feedback on screen.',
      implementation: [
        'Each student gets a high-durability QR code printed on the reverse of their standard JNV student ID card.',
        'A camera-equipped scanning terminal is mounted at the classroom doorway or study hall entrance.',
        'As scholars enter, they hold their badge to the reader. The gateway decodes the unique ID and syncs with the app instantly.',
      ]
    },
    nfc: {
      title: 'NFC Contactless ID Card system',
      icon: <Radio className="h-6 w-6 text-emerald-600" />,
      hardware: ['Passive HF 13.56MHz RFID/NFC Cards', 'USB NFC Desktop Reader (e.g., ACR122U)', 'Classroom Edge micro-controller'],
      cost: 'Medium (Smart NFC cards require budget allocation)',
      benefits: 'Extremely fast tap speed (under 200ms), highly resistant to dirt and wear, zero line-of-sight required.',
      implementation: [
        'Equip all boarding scholars with smart NFC-embedded physical student wristbands or proximity badges.',
        'Mount compact, weather-sealed tap-in nodes beside classroom doors and dining hall entrance columns.',
        'Students tap their cards upon entry. Real-time logging is handled at the edge, sending lightweight websocket packets to the region database.',
      ]
    },
    face: {
      title: 'AI Facial Recognition Assembly Scan',
      icon: <Camera className="h-6 w-6 text-purple-600" />,
      hardware: ['4K Wide-angle CCTV Dome Cameras', 'Local Edge AI Compute Unit (NVIDIA Jetson)', 'NVS Regional cloud authentication engine'],
      cost: 'High (Requires initial camera array & GPU setup)',
      benefits: '100% passive (scholars don\'t need to tap or scan), complete elimination of "proxy attendance", audits entire assembly in seconds.',
      implementation: [
        'Mount wide-angle, high-resolution cameras in the morning assembly hall or at classroom doors.',
        'Use local deep learning algorithms to detect and register facial geometry vectors compared against the JNV Admission directory.',
        'Automated rolls are compiled asynchronously at 09:00 AM, reporting absentees to classroom teachers for instant verification.',
      ]
    }
  };

  return (
    <div className="space-y-6" id="automation-hub-root">
      
      {/* Informational Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-100 flex items-center">
                <Cpu className="h-3 w-3 mr-1" /> Tech Proposal Engine
              </span>
              <span className="text-xs text-gray-400 font-semibold">• JNV Vattem Digitalization Initiative</span>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mt-2">Attendance Automation & Edge Integration</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Proposing smart, modern alternatives to manual roll-calls to maximize classroom instruction hours and eliminate clerical overhead.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50/50 px-3 py-2 rounded-xl border border-blue-100">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-800">Saves ~15 mins per day</span>
          </div>
        </div>

        {/* Technology Selection Tabs */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {(['qr', 'nfc', 'face'] as const).map((tech) => {
            const isSelected = activeTech === tech;
            const item = techDetails[tech];
            return (
              <button
                key={tech}
                onClick={() => {
                  if (isSimulating) stopSimulation();
                  setActiveTech(tech);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-300 shadow-3xs'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="text-xs font-extrabold text-gray-800 capitalize">{tech === 'qr' ? 'QR Codes' : tech === 'nfc' ? 'NFC Tags' : 'Face ID'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Double-Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Proposal Details Pane */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 border-b border-gray-50 pb-3">
              {techDetails[activeTech].icon}
              <h3 className="text-sm font-black text-gray-900">{techDetails[activeTech].title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Estimated Capital Cost</span>
                <p className="font-extrabold text-gray-700 mt-1">{techDetails[activeTech].cost}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Core Benefit</span>
                <p className="font-extrabold text-gray-700 mt-1">High Speed, High Accuracy</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Required Hardware:</h4>
              <ul className="list-disc pl-4 text-xs font-semibold text-gray-600 space-y-1">
                {techDetails[activeTech].hardware.map((hw, i) => (
                  <li key={i}>{hw}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">How It Works (Step-by-Step Implementation):</h4>
              <ol className="list-decimal pl-4 text-xs text-gray-600 font-medium space-y-2">
                {techDetails[activeTech].implementation.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mt-4 text-[11px] text-blue-900 font-semibold leading-relaxed">
            <span className="font-black text-blue-900">Why adopt?</span> {techDetails[activeTech].benefits}
          </div>
        </div>

        {/* Live Simulator Terminal Panel */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-950 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">Edge Node Live Simulator</span>
              </div>
              <span className="text-[9px] uppercase font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                Classroom node: #VATT-C6-MAIN
              </span>
            </div>

            {/* Simulated Viewfinder */}
            <div className="relative bg-slate-950 h-40 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-4">
              {isSimulating ? (
                <>
                  {/* scanning scanner beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-bounce top-1/2 z-10" />
                  
                  {currentScanningStudent ? (
                    <div className="text-center space-y-3 z-20 animate-pulse">
                      <div className="mx-auto w-12 h-12 bg-blue-900/40 rounded-full border border-blue-500/50 flex items-center justify-center text-blue-400">
                        {activeTech === 'qr' ? <QrCode className="h-6 w-6" /> : activeTech === 'nfc' ? <Radio className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{currentScanningStudent.name}</p>
                        <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                          Adm: {currentScanningStudent.admissionNo} • Roll: {currentScanningStudent.rollNo}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-900/50">
                        <CheckCircle className="h-3 w-3 mr-1" /> Reader Sync Status: 200 OK
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold animate-pulse">Awaiting first tap / scan...</p>
                  )}
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">Automation simulator is idle</p>
                  <p className="text-[10px] text-slate-600">Select technology above and click "Run" to test</p>
                </div>
              )}
            </div>

            {/* Terminal output logs */}
            <div className="mt-4 bg-slate-950/60 p-3 rounded-lg h-36 overflow-y-auto font-mono text-[10px] space-y-1.5 border border-slate-800/50">
              {simLogs.length === 0 ? (
                <span className="text-slate-600 italic">No terminal signals recorded yet.</span>
              ) : (
                simLogs.map((log, i) => {
                  let color = "text-slate-300";
                  if (log.includes("Marked PRESENT") || log.includes("Batch Complete")) color = "text-emerald-400 font-bold";
                  if (log.includes("Marked ABSENT") || log.includes("⚠️")) color = "text-rose-400";
                  if (log.includes("On Leave") || log.includes("Marked ON DUTY")) color = "text-amber-400";
                  return <p key={i} className={`${color} leading-tight`}>{log}</p>;
                })
              )}
            </div>
          </div>

          {/* Simulator Actions */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            {isSimulating ? (
              <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-2">
                <Clock className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                <span>Scanning: {progressCount} / {classStudents.length} Students</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 font-bold">Safe Sandbox Mode</span>
            )}

            <div className="flex space-x-2">
              {isSimulating ? (
                <button
                  onClick={stopSimulation}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg flex items-center shadow-sm cursor-pointer"
                >
                  <Square className="h-3 w-3 mr-1" /> Stop Sync
                </button>
              ) : (
                <button
                  onClick={startSimulation}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center shadow-sm cursor-pointer"
                >
                  <Play className="h-3 w-3 mr-1" /> Run Automated Morning Attendance
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
