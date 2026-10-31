import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  FileText, 
  Loader2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface StudentJobOpportunity {
  drive_id: number;
  company_name: string;
  job_role: string;
  package: string;
  job_type: string;
  min_cgpa: number;
  is_eligible?: boolean;
  ineligible_reason?: string;
  drive_date: string;
  deadline: string;
  status: string;
}

interface StudentJobApplication {
  app_id: string;
  drive_id?: number;
  application_id?: number;
  company_name: string;
  job_role: string;
  package: string;
  applied_date: string;
  status: string;
  interview_date?: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

export const StudentPlacementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'my_applications' | 'announcements'>('open_jobs');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<StudentJobOpportunity[]>([]);
  const [myApplications, setMyApplications] = useState<StudentJobApplication[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [selectedJob, setSelectedJob] = useState<StudentJobOpportunity | null>(null);
  const [selectedOfferApp, setSelectedOfferApp] = useState<StudentJobApplication | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentPlacement();
      if (res.success && res.data) {
        setOpportunities(res.data.opportunities || []);
        setMyApplications(res.data.applications || []);
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.warn('Error fetching placement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyDrive = (job: StudentJobOpportunity) => {
    setSelectedJob(job);
    setApplyError(null);
    setIsApplyModalOpen(true);
  };

  const handleConfirmApplication = async () => {
    if (!selectedJob) return;
    try {
      setSubmitting(true);
      setApplyError(null);
      const res = await api.applyStudentJobDrive(selectedJob.drive_id);
      if (res.success) {
        setIsApplyModalOpen(false);
        await fetchData();
        setActiveTab('my_applications');
      } else {
        setApplyError(res.message || 'Application was not processed.');
      }
    } catch (err: any) {
      setApplyError(err.message || 'Database validation failed: Ineligible for this recruitment drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const jobColumns: Column<StudentJobOpportunity>[] = [
    {
      header: "Recruiting Company",
      accessor: "company_name",
      render: (j) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 font-bold flex items-center justify-center text-xs">
            {j.company_name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-navy-950 block">{j.company_name}</span>
            <span className="text-[11px] text-slate-500">{j.job_type}</span>
          </div>
        </div>
      )
    },
    { header: "Designation", accessor: "job_role", render: (j) => <span className="font-semibold text-slate-800">{j.job_role}</span> },
    {
      header: "CTC Package",
      accessor: "package",
      sortable: true,
      render: (j) => (
        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {j.package}
        </span>
      )
    },
    {
      header: "Eligibility Criteria",
      accessor: "min_cgpa",
      render: (j) => <span className="font-mono text-xs">Min CGPA: <strong>{Number(j.min_cgpa || 6.5).toFixed(1)}</strong></span>
    },
    { header: "Drive Date", accessor: "drive_date", render: (j) => <span className="font-mono text-slate-600">{j.drive_date}</span> },
    {
      header: "Action",
      render: (j) => {
        const alreadyApplied = myApplications.some(a => a.drive_id === j.drive_id || a.company_name.toLowerCase() === j.company_name.toLowerCase());
        if (alreadyApplied) {
          return (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" /> Registered
            </span>
          );
        }
        if (j.is_eligible === false) {
          return (
            <span 
              className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 w-fit cursor-help"
              title={j.ineligible_reason || `CGPA criteria not met (Requires Min CGPA: ${j.min_cgpa})`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Ineligible
            </span>
          );
        }
        return (
          <button
            onClick={() => handleApplyDrive(j)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            Apply & Confirm
          </button>
        );
      }
    }
  ];

  const appColumns: Column<StudentJobApplication>[] = [
    {
      header: "Application ID",
      accessor: "app_id",
      render: (a) => <span className="font-mono font-bold text-navy-950">{a.app_id}</span>
    },
    { header: "Company", accessor: "company_name", render: (a) => <span className="font-bold text-navy-950">{a.company_name}</span> },
    { header: "Designation", accessor: "job_role" },
    { header: "Package", accessor: "package", render: (a) => <span className="font-mono font-bold text-emerald-800">{a.package}</span> },
    { header: "Filed Date", accessor: "applied_date", render: (a) => <span className="font-mono text-slate-500">{a.applied_date}</span> },
    {
      header: "Recruitment Pipeline Status",
      accessor: "status",
      render: (a) => {
        const status = a.status || 'Applied';
        const isSuccess = status === 'Selected' || status === 'Offer Accepted' || status === 'Shortlisted';
        return (
          <div className="space-y-1">
            <Badge variant={isSuccess ? 'success' : status === 'Rejected' ? 'danger' : 'info'}>{status}</Badge>
            {a.interview_date && (
              <p className="text-[10px] text-slate-500 font-mono">
                Slot: {a.interview_date}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: "Offer Letter",
      render: (a) => (
        (a.status === 'Selected' || a.status === 'Offer Accepted') ? (
          <button
            onClick={() => { setSelectedOfferApp(a); setIsOfferModalOpen(true); }}
            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> View Offer
          </button>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-8 h-8 text-navy-800 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading placement records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-navy-800" />
            Training & Placement (T&P) Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse campus recruitment drives, verify CGPA eligibility, apply to employers, track interview stages, and manage offers.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('open_jobs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'open_jobs' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Eligible Drives ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('my_applications')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'my_applications' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            My Applications ({myApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'announcements' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            T&P Notices ({announcements.length})
          </button>
        </div>
      </div>

      {activeTab === 'open_jobs' && (
        opportunities.length === 0 ? (
          <EmptyState
            title="No Active Campus Recruitment Drives"
            description="There are currently no open recruitment drives scheduled for your department. Check back soon or visit the T&P Notices tab."
          />
        ) : (
          <DataTable
            columns={jobColumns}
            data={opportunities}
            title="Active Corporate Campus Recruitment Drives"
            subtitle="Companies currently accepting student registrations for 2026-2027 placement season"
            searchPlaceholder="Search by company or role..."
          />
        )
      )}

      {activeTab === 'my_applications' && (
        myApplications.length === 0 ? (
          <EmptyState
            title="No Placement Applications Filed"
            description="You have not registered for any campus recruitment drives yet. Browse open drives under the Eligible Drives tab to apply."
            actionLabel="Browse Open Drives"
            onAction={() => setActiveTab('open_jobs')}
          />
        ) : (
          <DataTable
            columns={appColumns}
            data={myApplications}
            title="My Job Applications & Interview Progress Tracker"
            subtitle="Track active recruitment rounds from submission to final offer acceptance"
          />
        )
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="erp-card p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-950">Training & Placement Cell Circulars</h3>
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No official circulars released this term.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-[#FAFCFD]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-navy-950">{a.title}</span>
                      <span className="font-mono text-slate-500">{a.date}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Confirm Application: ${selectedJob.company_name}`}
          subtitle={`Role: ${selectedJob.job_role} • Package: ${selectedJob.package}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApplication}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Submit Profile
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {applyError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{applyError}</span>
              </div>
            )}
            <p className="text-slate-600">
              By confirming, your verified student profile (Name: <strong>{user?.name}</strong>, Roll: <strong>{user?.codeOrRoll}</strong>, Department: <strong>{user?.department}</strong>) will be forwarded to the corporate recruitment team.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-slate-700">
              <div>Drive Date: {selectedJob.drive_date}</div>
              <div>Registration Deadline: {selectedJob.deadline}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Offer Letter Modal */}
      {isOfferModalOpen && selectedOfferApp && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          title="Official Placement Offer Letter"
          subtitle={`${selectedOfferApp.company_name} • ${selectedOfferApp.job_role}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setIsOfferModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl"
            >
              Close Document
            </button>
          }
        >
          <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-navy-950 text-sm uppercase">{selectedOfferApp.company_name}</span>
              <Badge variant="success">OFFER VERIFIED</Badge>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Dear <strong>{user?.name || 'Candidate'}</strong>, we are pleased to confirm your appointment as <strong>{selectedOfferApp.job_role}</strong> with an annual compensation package of <strong>{selectedOfferApp.package}</strong>.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Offer Status: {selectedOfferApp.status} • Reference: {selectedOfferApp.app_id}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
