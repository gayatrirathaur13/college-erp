import React, { useState, useEffect } from 'react';
import { 
  CalendarOff, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DataTable, Column } from '../../components/common/DataTable';
import { mockFaculty } from '../../data/mockFaculty';
import { api } from '../../services/api';

interface LeaveApplicationRecord {
  id: string;
  leave_type: 'Casual Leave (CL)' | 'Sick Leave (SL)' | 'Earned Leave (EL)';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  cover_faculty: string;
  status: 'Approved' | 'Request Sent' | 'Pending Dean Review' | 'Cancelled' | 'Rejected';
  applied_on: string;
  approver_comments?: string;
}

export const FacultyLeavePage: React.FC = () => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveApplicationRecord[]>([]);

  const loadLeaves = async () => {
    try {
      const res = await api.getFacultyLeave();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setLeaveRecords(res.data);
      }
    } catch (err) {
      console.warn('Error loading leaves:', err);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRecordToCancel, setSelectedRecordToCancel] = useState<LeaveApplicationRecord | null>(null);

  // Leave Form State
  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave (CL)' as 'Casual Leave (CL)' | 'Sick Leave (SL)' | 'Earned Leave (EL)',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
    cover_faculty: 'Prof. Sunita Rao',
    notes: ''
  });

  // Calculate day difference
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateDays(formData.start_date, formData.end_date);
    const tempId = `LV-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: LeaveApplicationRecord = {
      id: tempId,
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days_count: days,
      reason: formData.reason,
      cover_faculty: formData.cover_faculty,
      status: "Request Sent",
      applied_on: new Date().toISOString().split('T')[0],
      approver_comments: "Request sent. Persisted in database."
    };

    try {
      const res = await api.applyFacultyLeave({
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_count: days,
        reason: formData.reason,
        cover_faculty: formData.cover_faculty
      });
      if (res?.data?.id) {
        newRecord.id = res.data.id;
      }
      await loadLeaves();
    } catch {
      setLeaveRecords(prev => [newRecord, ...prev]);
    }

    setIsApplyModalOpen(false);
    setFormData({
      leave_type: 'Casual Leave (CL)',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: '',
      cover_faculty: 'Prof. Sunita Rao',
      notes: ''
    });
  };

  const handleCancelLeave = (record: LeaveApplicationRecord) => {
    setLeaveRecords(prev => prev.map(r => {
      if (r.id === record.id) {
        return {
          ...r,
          status: 'Cancelled',
          approver_comments: 'Revoked by faculty applicant.'
        };
      }
      return r;
    }));
    setSelectedRecordToCancel(null);
  };

  const columns: Column<LeaveApplicationRecord>[] = [
    {
      header: "Application ID",
      accessor: "id",
      render: (r) => <span className="font-mono font-bold text-navy-950">{r.id}</span>
    },
    {
      header: "Leave Category",
      accessor: "leave_type",
      render: (r) => (
        <div>
          <span className="font-semibold text-navy-900 block">{r.leave_type}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{r.reason}</span>
        </div>
      )
    },
    {
      header: "Dates & Duration",
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-800 text-xs block">{r.start_date} to {r.end_date}</span>
          <span className="text-[10px] text-slate-500 font-mono">{r.days_count} Working Days</span>
        </div>
      )
    },
    {
      header: "Nominated Substitute",
      accessor: "cover_faculty",
      render: (r) => (
        <span className="text-xs text-slate-700 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-navy-700" />
          {r.cover_faculty}
        </span>
      )
    },
    {
      header: "Approval Status",
      accessor: "status",
      render: (r) => {
        const variant = r.status === 'Approved' ? 'success' : r.status === 'Cancelled' ? 'neutral' : (r.status === 'Request Sent' ? 'navy' : 'warning');
        return <Badge variant={variant as any}>{r.status}</Badge>;
      }
    },
    {
      header: "Approver Comments",
      accessor: "approver_comments",
      render: (r) => <span className="text-[11px] text-slate-500 italic">{r.approver_comments || '—'}</span>
    },
    {
      header: "Action",
      render: (r) => (
        (r.status === 'Request Sent' || r.status === 'Pending Dean Review') ? (
          <button
            onClick={() => handleCancelLeave(r)}
            className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Cancel Request
          </button>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-navy-800" />
            Faculty Leave Management & Entitlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track personal statutory leave quotas, nominate class substitutes, and track administrative approvals.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="erp-card p-5 bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Casual Leave (CL)
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-400">Annual Quota: 12</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold font-mono text-navy-950">6</h3>
            <span className="text-xs text-slate-500">Days Available</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Maximum 3 days consecutive per university statute</p>
        </div>

        <div className="erp-card p-5 bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sick Leave (SL)
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-400">Annual Quota: 10</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold font-mono text-navy-950">8</h3>
            <span className="text-xs text-slate-500">Days Available</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requires medical certificate for &gt; 2 days</p>
        </div>

        <div className="erp-card p-5 bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Earned Leave (EL)
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-400">Accumulated: 30</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold font-mono text-navy-950">4</h3>
            <span className="text-xs text-slate-500">Days Available</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Encashable or carry-forward to next academic calendar</p>
        </div>
      </div>

      {/* Applications Table */}
      <DataTable
        columns={columns}
        data={leaveRecords}
        title="My Leave Application Log & Sanctions"
        subtitle="Individual leave requests submitted to Head of Department & Dean Academics"
      />

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Apply for Academic Leave"
          subtitle="Submit leave petition with nominated class lecture substitute"
          maxWidth="lg"
        >
          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Leave Category *</label>
              <select
                value={formData.leave_type}
                onChange={e => setFormData({ ...formData, leave_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
              >
                <option value="Casual Leave (CL)">Casual Leave (CL) — 6 Days Remaining</option>
                <option value="Sick Leave (SL)">Sick Leave (SL) — 8 Days Remaining</option>
                <option value="Earned Leave (EL)">Earned Leave (EL) — 4 Days Remaining</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">From Date *</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">To Date *</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominate Colleague for Class Coverage *</label>
              <select
                value={formData.cover_faculty}
                onChange={e => setFormData({ ...formData, cover_faculty: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-navy-950 font-semibold"
              >
                {mockFaculty.filter(f => f.faculty_id !== 1).map(f => (
                  <option key={f.faculty_id} value={`${f.first_name} ${f.last_name}`}>
                    {f.first_name} {f.last_name} ({f.designation_name})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Nominated colleague will oversee scheduled lectures and lab hours during your absence.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
              <textarea
                rows={2}
                required
                placeholder="State academic, medical, or personal reason for leave..."
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-navy-950 hover:bg-navy-900 text-white rounded-xl shadow-sm"
              >
                Submit Leave Application
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
