import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  RefreshCw, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  BookOpen, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from './Badge';

interface StudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: number;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId = 1
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(defaultStudentId);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'timetable' | 'fees'>('attendance');

  const fetchPreview = async (sId: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFacultyStudentPreview(sId);
      if (res.success) {
        setPreviewData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load live student preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreview(selectedStudentId);
    }
  }, [isOpen, selectedStudentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">FACULTY DEMO PREVIEW: STUDENT INTERFACE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  READ-ONLY LIVE VIEW
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Demonstrates real-time PostgreSQL synchronization without exposing confidential student credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Preview Student ID:</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(parseInt(e.target.value, 10) || 1)}
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-navy-950 outline-none focus:ring-1 focus:ring-navy-900"
            />
            <button
              onClick={() => fetchPreview(selectedStudentId)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 bg-navy-950 text-white rounded-lg font-semibold hover:bg-navy-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Fetch Live Supabase Record</span>
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                activeTab === 'attendance' ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Attendance Record
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                activeTab === 'timetable' ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Timetable
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                activeTab === 'fees' ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fee Balance
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-navy-800" />
              <p className="text-xs font-semibold text-slate-600">Querying authoritative PostgreSQL database...</p>
            </div>
          ) : previewData?.student ? (
            <div className="space-y-4 text-xs">
              {/* Profile Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy-950 text-white font-bold flex items-center justify-center text-sm">
                    {previewData.student.student_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-950">{previewData.student.student_name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Roll: <strong className="text-navy-900">{previewData.student.roll_no}</strong> • PRN: {previewData.student.prn}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Badge variant="navy">{previewData.student.department_name}</Badge>
                  <Badge variant="neutral">{previewData.student.section_name || 'Section 1'}</Badge>
                  <Badge variant="success">Semester {previewData.student.current_semester}</Badge>
                </div>
              </div>

              {/* Tab 1: Live Attendance */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-950 text-xs uppercase tracking-wide">
                      Live Attendance Log (View: `v_student_attendance_summary`)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">75% Statutory Minimum Threshold</span>
                  </div>

                  {previewData.attendance.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No attendance sessions found for this student.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previewData.attendance.map((att: any, idx: number) => {
                        const pct = Number(att.attendance_pct || 0);
                        const isDebarred = pct < 75;
                        return (
                          <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-navy-950 text-xs">{att.subject_code}</span>
                              <Badge variant={isDebarred ? 'danger' : 'success'}>
                                {pct}% {isDebarred ? 'Debarment Risk' : 'Eligible'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-slate-800 text-xs truncate">{att.subject_name}</h4>
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                              <span>Total Classes: <strong>{att.total_sessions}</strong></span>
                              <span>Attended: <strong className="text-emerald-700">{att.attended_sessions}</strong></span>
                              <span>Absent: <strong className="text-rose-600">{att.absent_sessions}</strong></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isDebarred ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Timetable */}
              {activeTab === 'timetable' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-950 text-xs uppercase tracking-wide">
                      Section Weekly Timetable (PostgreSQL `timetables` Join)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Class: {previewData.student.section_name}
                    </span>
                  </div>

                  {previewData.timetable.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No timetable slots found for this section.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {previewData.timetable.map((slot: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy-950 text-xs">{slot.day_of_week}</span>
                            <Badge variant={slot.timetable_type === 'Lab' ? 'ice' : 'neutral'}>
                              {slot.timetable_type}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-xs truncate">{slot.subject_name}</h4>
                          <p className="font-mono text-[11px] text-navy-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-navy-600" />
                            {slot.time}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">Room: {slot.room_no} • {slot.faculty_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Fees */}
              {activeTab === 'fees' && (
                <div className="space-y-3">
                  <span className="font-bold text-navy-950 text-xs uppercase tracking-wide block">
                    Student Financial Ledger (View: `v_student_fee_balance`)
                  </span>

                  {previewData.feeSummary ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-[11px] text-slate-500 font-semibold block">Total Billed</span>
                        <span className="text-base font-bold text-navy-950 font-mono">
                          ₹{Number(previewData.feeSummary.total_invoiced || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <span className="text-[11px] text-emerald-800 font-semibold block">Total Paid</span>
                        <span className="text-base font-bold text-emerald-700 font-mono">
                          ₹{Number(previewData.feeSummary.total_paid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <span className="text-[11px] text-amber-800 font-semibold block">Outstanding Dues</span>
                        <span className="text-base font-bold text-amber-900 font-mono">
                          ₹{Number(previewData.feeSummary.outstanding_balance || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No financial records found for this student.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorized Faculty Demonstration Mode • Student credentials and hash protected</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
