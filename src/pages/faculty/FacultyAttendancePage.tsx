import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface StudentAttendanceRow {
  student_id: number;
  roll_no: string;
  name: string;
  status: 'Present' | 'Absent';
}

interface SavedSessionLog {
  id: string;
  date: string;
  division: string;
  subject: string;
  period: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  saved_at: string;
  can_edit: boolean;
}

export const FacultyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'mark' | 'saved_logs' | 'my_attendance' | 'my_timetable'>('mark');

  // Filter selection state for marking attendance
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDivision, setSelectedDivision] = useState<string>('B.Tech CSE - Section A');
  const [selectedSubject, setSelectedSubject] = useState<string>('CS302 - Database Management Systems');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Period 2 (10:15 AM - 11:15 AM)');

  const [roster, setRoster] = useState<StudentAttendanceRow[]>([]);
  const [savedLogs, setSavedLogs] = useState<SavedSessionLog[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [facultyTimetableDay, setFacultyTimetableDay] = useState<string>('All Days');
  const [assignedSections, setAssignedSections] = useState<any[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState<boolean>(false);
  const [lockAttendance, setLockAttendance] = useState<boolean>(false);

  // Timetable slot creation state
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState<boolean>(false);
  const [newSlotDay, setNewSlotDay] = useState<string>('Monday');
  const [newSlotSectionId, setNewSlotSectionId] = useState<number>(1);
  const [newSlotSubjectId, setNewSlotSubjectId] = useState<number>(1);
  const [newSlotStartTime, setNewSlotStartTime] = useState<string>('09:15');
  const [newSlotEndTime, setNewSlotEndTime] = useState<string>('10:15');
  const [newSlotRoom, setNewSlotRoom] = useState<string>('Room 302');
  const [newSlotType, setNewSlotType] = useState<string>('Lecture');
  const [slotSaving, setSlotSaving] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAttendanceData() {
      try {
        setLoading(true);
        const [attRes, dashRes] = await Promise.all([
          api.getFacultyAttendance().catch(() => null),
          api.getFacultyDashboard().catch(() => null)
        ]);

        if (isMounted) {
          if (attRes?.success && attRes.data) {
            const rosterList = attRes.data.roster || (Array.isArray(attRes.data) ? attRes.data : []);
            if (rosterList && rosterList.length > 0) {
              setRoster(rosterList.map((s: any) => ({
                student_id: s.student_id || s.id,
                roll_no: s.roll_no,
                name: s.name || s.student_name,
                status: s.status || 'Present'
              })));
            }
            if (attRes.data.savedLogs) {
              setSavedLogs(attRes.data.savedLogs);
            }
            if (attRes.data.sections && attRes.data.sections.length > 0) {
              setAssignedSections(attRes.data.sections);
              setSelectedDivision(attRes.data.sections[0].section_name);
            }
            if (attRes.data.subjects && attRes.data.subjects.length > 0) {
              setAssignedSubjects(attRes.data.subjects);
              setSelectedSubject(`${attRes.data.subjects[0].subject_code} - ${attRes.data.subjects[0].subject_name}`);
            }
            if (attRes.data.timetable && attRes.data.timetable.length > 0) {
              setTimetableSlots(attRes.data.timetable);
            }
          }
          if (dashRes?.success && dashRes.data?.todayLectures && (!attRes?.data?.timetable || attRes.data.timetable.length === 0)) {
            setTimetableSlots(dashRes.data.todayLectures);
          }
        }
      } catch (err) {
        console.warn('Error fetching faculty attendance data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAttendanceData();
    return () => { isMounted = false; };
  }, []);

  // Modals & Feedback
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle single student attendance
  const handleToggleStatus = (student_id: number) => {
    setRoster(prev => prev.map(s => {
      if (s.student_id === student_id) {
        return {
          ...s,
          status: s.status === 'Present' ? 'Absent' : 'Present'
        };
      }
      return s;
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setRoster(prev => prev.map(s => ({ ...s, status: 'Present' })));
  };

  // Check duplicate before confirmation
  const handleInitiateSave = () => {
    setFeedbackMessage(null);
    const existingLog = savedLogs.find(
      log => log.date === selectedDate &&
             log.division === selectedDivision &&
             log.subject === selectedSubject &&
             log.period === selectedPeriod
    );

    setIsUpdatingExisting(!!existingLog);
    setIsConfirmModalOpen(true);
  };

  // Final submission handler (ACID transaction)
  const handleConfirmSave = async () => {
    const presentCount = roster.filter(s => s.status === 'Present').length;
    const absentCount = roster.length - presentCount;

    try {
      setSaving(true);
      const activeSection = assignedSections.find((s: any) => s.section_name === selectedDivision);
      const activeSubject = assignedSubjects.find((sub: any) => `${sub.subject_code} - ${sub.subject_name}` === selectedSubject);

      const res = await api.saveFacultyAttendance({
        date: selectedDate,
        subject_id: activeSubject?.subject_id || assignedSubjects[0]?.subject_id || 1,
        section_id: activeSection?.section_id || assignedSections[0]?.section_id || 1,
        period: selectedPeriod,
        topic: selectedSubject,
        records: roster.map(s => ({ student_id: s.student_id, status: s.status })),
        lock_attendance: lockAttendance
      });

      const newLog: SavedSessionLog = {
        id: res.sessionId ? `ATT-SES-${res.sessionId}` : `ATT-${selectedDate.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
        date: selectedDate,
        division: selectedDivision,
        subject: selectedSubject,
        period: selectedPeriod,
        total_students: roster.length,
        present_count: presentCount,
        absent_count: absentCount,
        saved_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        can_edit: true
      };

      setSavedLogs(prev => {
        const filtered = prev.filter(l => !(l.date === selectedDate && l.division === selectedDivision && l.subject === selectedSubject && l.period === selectedPeriod));
        return [newLog, ...filtered];
      });

      setIsConfirmModalOpen(false);
      setFeedbackMessage({
        type: 'success',
        text: (res as any).isUpdate
          ? `Attendance session updated in PostgreSQL! Recorded ${presentCount} Present and ${absentCount} Absent.`
          : `Attendance successfully saved to PostgreSQL! Recorded ${presentCount} Present and ${absentCount} Absent.`
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to record attendance to database.'
      });
      setIsConfirmModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Timetable Slot Allocation Handler with Conflict Validation
  const handleAddTimetableSlot = async () => {
    try {
      setSlotSaving(true);
      setSlotError(null);
      const res = await api.createFacultyTimetable({
        section_id: newSlotSectionId || assignedSections[0]?.section_id || 1,
        subject_id: newSlotSubjectId || assignedSubjects[0]?.subject_id || 1,
        semester_id: 5,
        day_of_week: newSlotDay,
        start_time: `${newSlotStartTime}:00`,
        end_time: `${newSlotEndTime}:00`,
        room_no: newSlotRoom,
        timetable_type: newSlotType
      });

      if (res.success) {
        setIsAddSlotModalOpen(false);
        const attRes = await api.getFacultyAttendance().catch(() => null);
        if (attRes?.data?.timetable) {
          setTimetableSlots(attRes.data.timetable);
        }
        setFeedbackMessage({
          type: 'success',
          text: 'Timetable entry added and persisted to PostgreSQL database. Enrolled students will see this slot immediately!'
        });
      }
    } catch (err: any) {
      setSlotError(err.message || 'Failed to allocate timetable slot.');
    } finally {
      setSlotSaving(false);
    }
  };

  // Faculty's personal biometric records
  const facultyOwnAttendance = [
    { date: "2026-10-10", in_time: "08:45 AM", out_time: "04:30 PM", hours: "7.75 hrs", status: "Present" },
    { date: "2026-10-09", in_time: "08:50 AM", out_time: "04:40 PM", hours: "7.83 hrs", status: "Present" },
    { date: "2026-10-08", in_time: "08:40 AM", out_time: "04:35 PM", hours: "7.91 hrs", status: "Present" },
    { date: "2026-10-07", in_time: "08:55 AM", out_time: "04:30 PM", hours: "7.58 hrs", status: "Present" },
    { date: "2026-10-06", in_time: "08:48 AM", out_time: "04:30 PM", hours: "7.70 hrs", status: "Present" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-navy-800" />
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct daily lecture attendance roll, prevent duplicate submissions, review saved logs, and track personal faculty biometric logs.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'mark' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mark Class Attendance
          </button>
          <button
            onClick={() => setActiveTab('saved_logs')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'saved_logs' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Saved Logs ({savedLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('my_attendance')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'my_attendance' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            My Biometric Attendance
          </button>
          <button
            onClick={() => setActiveTab('my_timetable')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'my_timetable' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            My Teaching Timetable
          </button>
        </div>
      </div>

      {activeTab === 'mark' && (
        <div className="space-y-6">
          {/* Notification Alert */}
          {feedbackMessage && (
            <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Workflow Step 1, 2, 3: Filters Card */}
          <div className="erp-card p-6 bg-white space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide">
                Session Parameter Selection
              </h3>
              <p className="text-xs text-slate-500">Select date, class cohort, subject and period before taking attendance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lecture Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-semibold text-navy-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Division *</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => {
                    const newDiv = e.target.value;
                    setSelectedDivision(newDiv);
                    const matchedSec = assignedSections.find((s: any) => s.section_name === newDiv);
                    if (matchedSec) {
                      api.getFacultyAttendance(`section_id=${matchedSec.section_id}`)
                        .then(res => {
                          const list = res?.data?.roster || (Array.isArray(res?.data) ? res.data : []);
                          if (list && list.length > 0) {
                            setRoster(list.map((s: any) => ({
                              student_id: s.student_id || s.id,
                              roll_no: s.roll_no,
                              name: s.name || s.student_name,
                              status: s.status || 'Present'
                            })));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
                >
                  {assignedSections.length > 0 ? (
                    assignedSections.map((sec: any) => (
                      <option key={sec.section_id} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))
                  ) : (
                    <option value="Section 1">{user?.department || 'Department'} - Section 1</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
                >
                  {assignedSubjects.length > 0 ? (
                    assignedSubjects.map((sub: any) => (
                      <option key={sub.subject_id} value={`${sub.subject_code} - ${sub.subject_name}`}>
                        {sub.subject_code} - {sub.subject_name}
                      </option>
                    ))
                  ) : (
                    <option value="Core Department Course">Core Department Course</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lecture Period *</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
                >
                  <option value="Period 1 (09:00 AM - 10:00 AM)">Period 1 (09:00 AM - 10:00 AM)</option>
                  <option value="Period 2 (10:15 AM - 11:15 AM)">Period 2 (10:15 AM - 11:15 AM)</option>
                  <option value="Period 3 (11:15 AM - 12:15 PM)">Period 3 (11:15 AM - 12:15 PM)</option>
                  <option value="Period 4: Practical Lab (01:15 PM - 03:15 PM)">Period 4: Practical Lab (01:15 PM - 03:15 PM)</option>
                  <option value="Period 5: Tutorial & Seminar (03:15 PM - 04:00 PM)">Period 5: Tutorial & Seminar (03:15 PM - 04:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Step 4, 5, 6, 7: Student Roster Table */}
          {(() => {
            const matchingLoggedSession = savedLogs.find(
              log => log.date === selectedDate &&
                     log.division === selectedDivision &&
                     log.subject === selectedSubject &&
                     log.period === selectedPeriod
            );
            const isAutoLocked = matchingLoggedSession ? (!matchingLoggedSession.can_edit) : false;

            return (
              <div className="erp-card p-6 bg-white space-y-4">
                {matchingLoggedSession && (
                  <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    isAutoLocked 
                      ? 'bg-rose-50 border-rose-300 text-rose-900' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isAutoLocked ? 'text-rose-600' : 'text-emerald-600'}`} />
                      <span>
                        <strong>Lecture Attendance Status:</strong> {matchingLoggedSession.period} on {matchingLoggedSession.date} for {matchingLoggedSession.subject} was submitted with {matchingLoggedSession.present_count} Present and {matchingLoggedSession.absent_count} Absent.
                        {isAutoLocked ? ' [LOCKED: Auto-locked after 1 week / finalized. Modifications disabled.]' : ' [ACTIVE: You may update attendance within 1 week of marking.]'}
                      </span>
                    </div>
                    <Badge variant={isAutoLocked ? 'danger' : 'success'}>
                      {isAutoLocked ? 'Locked (Finalized)' : 'Already Marked'}
                    </Badge>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-navy-950">
                      Assigned Student Roster ({roster.length} Enrolled Scholars)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedDivision} • {selectedSubject} • {selectedDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      disabled={isAutoLocked}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark All Present
                    </button>

                    <button
                      type="button"
                      onClick={handleInitiateSave}
                      disabled={isAutoLocked}
                      title={isAutoLocked ? 'Attendance is locked. No modifications permitted.' : 'Save attendance to database'}
                      className="px-4 py-1.5 bg-navy-950 hover:bg-navy-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isAutoLocked ? 'Attendance Locked' : matchingLoggedSession ? 'Update Saved Attendance' : 'Save & Confirm Attendance'}
                    </button>
                  </div>
                </div>

            {/* Roster List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="p-3 w-16">#</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Status Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((student, idx) => (
                    <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-navy-950">{student.roll_no}</td>
                      <td className="p-3 font-semibold text-slate-800">{student.name}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              if (student.status !== 'Present') handleToggleStatus(student.student_id);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              student.status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Check className="w-3 h-3" /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (student.status !== 'Absent') handleToggleStatus(student.student_id);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              student.status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <X className="w-3 h-3" /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  )}

      {activeTab === 'saved_logs' && (
        <div className="erp-card p-6 bg-white space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-navy-950">Recorded Lecture Attendance Sessions</h3>
            <p className="text-xs text-slate-500">Official logs stored in university attendance ledger</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Class & Subject</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-center">Turnout</th>
                  <th className="p-3">Recorded At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {savedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-navy-950">{log.id}</td>
                    <td className="p-3 font-mono text-slate-700">{log.date}</td>
                    <td className="p-3">
                      <span className="font-semibold text-navy-900 block">{log.subject}</span>
                      <span className="text-[11px] text-slate-500">{log.division}</span>
                    </td>
                    <td className="p-3 text-slate-600">{log.period}</td>
                    <td className="p-3 text-center font-mono">
                      <span className="font-bold text-emerald-700">{log.present_count} P</span> /{' '}
                      <span className="font-bold text-rose-600">{log.absent_count} A</span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{log.saved_at}</td>
                    <td className="p-3 text-right">
                      <Badge variant="navy">Locked</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'my_attendance' && (
        <div className="erp-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-navy-950">Faculty Biometric Attendance & Service Log</h3>
              <p className="text-xs text-slate-500">Automated gate RFID & biometric punch recordings</p>
            </div>
            <Badge variant="success">100% Present This Month</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="p-3">Working Date</th>
                  <th className="p-3">Check-In Punch</th>
                  <th className="p-3">Check-Out Punch</th>
                  <th className="p-3">Total Working Hours</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {facultyOwnAttendance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-navy-950">{row.date}</td>
                    <td className="p-3 text-emerald-800">{row.in_time}</td>
                    <td className="p-3 text-slate-600">{row.out_time}</td>
                    <td className="p-3 font-bold text-navy-900">{row.hours}</td>
                    <td className="p-3 text-center">
                      <Badge variant="success">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'my_timetable' && (() => {
        const daysList = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const filtered = facultyTimetableDay === 'All Days'
          ? timetableSlots
          : timetableSlots.filter((s: any) => (s.day || s.day_of_week) === facultyTimetableDay);

        return (
          <div className="erp-card p-6 bg-white space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-navy-700" />
                  Faculty Teaching Schedule (Monday to Saturday, 09:00 AM - 04:00 PM)
                </h3>
                <p className="text-xs text-slate-500">Weekly allocated curriculum lectures, labs, and classroom sessions</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="navy">{timetableSlots.length} Weekly Lectures</Badge>
                <button
                  onClick={() => {
                    setSlotError(null);
                    setIsAddSlotModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-navy-950 text-white rounded-lg text-xs font-bold hover:bg-navy-900 transition-colors shadow-sm"
                >
                  + Add Timetable Entry
                </button>
              </div>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {daysList.map((day) => {
                const isSelected = facultyTimetableDay === day;
                const count = day === 'All Days' ? timetableSlots.length : timetableSlots.filter((s: any) => (s.day || s.day_of_week) === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setFacultyTimetableDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-navy-950 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                    <span className="ml-1.5 opacity-75 font-mono text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-200">
                <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-sm text-navy-950">No Teaching Schedule Found for {facultyTimetableDay}</p>
                <p className="text-xs text-slate-500">No timetable sessions are allocated to your profile on this day.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((slot, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-[#FAFCFD] hover:bg-white hover:shadow-sm transition-all space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-950 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                        {slot.day || slot.day_of_week || 'Weekly'}
                      </span>
                      <Badge variant={slot.type === 'Lab' || slot.timetable_type === 'Lab' ? 'ice' : slot.type === 'Tutorial' ? 'warning' : 'navy'}>
                        {slot.type || slot.timetable_type || 'Lecture'}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-navy-900 leading-snug">{slot.subject || slot.subject_name}</h4>
                    <div className="text-slate-600 font-mono text-[11px] space-y-1 pt-1 border-t border-slate-100">
                      <p className="text-navy-950 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-navy-700" />
                        {slot.time || `${slot.start_time} - ${slot.end_time}`}
                      </p>
                      {(slot.classSection || slot.section_name) && (
                        <p className="text-slate-600">Section: <strong>{slot.classSection || slot.section_name}</strong></p>
                      )}
                      <p className="text-slate-500">Venue: {slot.room || slot.room_no || 'Classroom'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={isUpdatingExisting ? "Update Existing Attendance Session" : "Confirm Attendance Submission"}
          subtitle="Finalize session record before writing to PostgreSQL database"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Go Back & Review
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl shadow-sm disabled:opacity-50"
              >
                {saving ? 'Writing to PostgreSQL...' : (isUpdatingExisting ? 'Commit Session Update' : 'Confirm & Submit Attendance')}
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {isUpdatingExisting ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <strong className="block font-bold">Existing Session Detected:</strong>
                Attendance for this date and period is already recorded. Confirming will execute an ACID transaction updating student records without creating duplicate entries.
              </div>
            ) : (
              <p className="text-slate-700">
                You are about to submit the attendance register for:
              </p>
            )}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono text-slate-800">
              <div>Date: <strong>{selectedDate}</strong></div>
              <div>Class: <strong>{selectedDivision}</strong></div>
              <div>Subject: <strong>{selectedSubject}</strong></div>
              <div>Period: <strong>{selectedPeriod}</strong></div>
              <div className="border-t border-slate-200 pt-1 text-emerald-800 font-bold">
                Present: {roster.filter(s => s.status === 'Present').length} | Absent: {roster.filter(s => s.status === 'Absent').length}
              </div>
            </div>
            <label className="flex items-center gap-2.5 p-3 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={lockAttendance}
                onChange={(e) => setLockAttendance(e.target.checked)}
                className="w-4 h-4 rounded text-navy-950 focus:ring-navy-800"
              />
              <span className="text-xs font-bold text-amber-950">
                Finalize & Lock Attendance (Cannot be modified once locked or after 1 week)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 italic">
              Attendance records are stored in PostgreSQL attendance_records with foreign key and UNIQUE constraints.
            </p>
          </div>
        </Modal>
      )}

      {/* Add Timetable Slot Modal */}
      {isAddSlotModalOpen && (
        <Modal
          isOpen={isAddSlotModalOpen}
          onClose={() => setIsAddSlotModalOpen(false)}
          title="Allocate Timetable Lecture / Lab Slot"
          subtitle="Enforces scheduling conflict detection across section, faculty, and room in PostgreSQL"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddSlotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTimetableSlot}
                disabled={slotSaving}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl shadow-sm disabled:opacity-50"
              >
                {slotSaving ? 'Validating & Persisting...' : 'Save & Publish Slot'}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {slotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{slotError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Day of Week *</label>
                <select
                  value={newSlotDay}
                  onChange={(e) => setNewSlotDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Type *</label>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Laboratory</option>
                  <option value="Tutorial">Tutorial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Section *</label>
                <select
                  value={newSlotSectionId}
                  onChange={(e) => setNewSlotSectionId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  {assignedSections.map((s: any) => (
                    <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Curriculum Subject *</label>
                <select
                  value={newSlotSubjectId}
                  onChange={(e) => setNewSlotSubjectId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  {assignedSubjects.map((sub: any) => (
                    <option key={sub.subject_id} value={sub.subject_id}>{sub.subject_code} - {sub.subject_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={newSlotStartTime}
                  onChange={(e) => setNewSlotStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={newSlotEndTime}
                  onChange={(e) => setNewSlotEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Classroom / Lab *</label>
                <input
                  type="text"
                  value={newSlotRoom}
                  onChange={(e) => setNewSlotRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Conflict engine validates in PostgreSQL: 1) Section schedule clash, 2) Faculty clash, 3) Room clash.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
