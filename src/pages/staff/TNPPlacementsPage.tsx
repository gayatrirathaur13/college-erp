import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Award, Plus, Search, Filter, RefreshCw,
  CheckCircle2, XCircle, Clock, Calendar, Check, ExternalLink, ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';

interface TNPPlacementsPageProps {
  initialTab?: 'drives' | 'applications' | 'placements';
}

export const TNPPlacementsPage: React.FC<TNPPlacementsPageProps> = ({ initialTab = 'drives' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'drives' | 'applications' | 'placements'>(initialTab);

  // Data states
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Actions
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [shortlistForm, setShortlistForm] = useState({
    status: 'Shortlisted',
    package: '6.5 LPA',
    job_role: '',
    offer_date: new Date().toISOString().split('T')[0]
  });

  const [newDrive, setNewDrive] = useState({
    company_id: '',
    job_role: '',
    job_type: 'Full-Time',
    package: '7.50 LPA',
    minimum_cgpa: '7.0',
    allowed_branch: 'All',
    backlog_allowed: 'No',
    drive_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Scheduled'
  });

  const [actionNotice, setActionNotice] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, aRes, pRes, cRes] = await Promise.all([
        api.getTNPDrives(),
        api.getTNPApplications(),
        api.getTNPPlacements(),
        api.getTNPCompanies()
      ]);
      if (dRes.success) setDrives(dRes.data);
      if (aRes.success) setApplications(aRes.data);
      if (pRes.success) setPlacements(pRes.data);
      if (cRes.success) {
        setCompanies(cRes.data);
        if (cRes.data.length > 0 && !newDrive.company_id) {
          setNewDrive(prev => ({ ...prev, company_id: String(cRes.data[0].company_id) }));
        }
      }
    } catch (err: any) {
      console.error('Error loading placement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/applications')) {
      setActiveTab('applications');
    } else if (location.pathname.includes('/placements')) {
      setActiveTab('placements');
    } else if (location.pathname.includes('/drives')) {
      setActiveTab('drives');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, initialTab]);

  const handleTabChange = (tab: 'drives' | 'applications' | 'placements') => {
    setActiveTab(tab);
    if (tab === 'drives') navigate('/staff/drives');
    else if (tab === 'applications') navigate('/staff/applications');
    else if (tab === 'placements') navigate('/staff/placements');
  };

  // Handle Add Drive
  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.addDrive({
        company_id: newDrive.company_id,
        job_role: newDrive.job_role,
        job_type: newDrive.job_type,
        package: newDrive.package,
        package_lpa: parseFloat(newDrive.package) || 7.5,
        minimum_cgpa: parseFloat(newDrive.minimum_cgpa) || 7.0,
        allowed_branch: newDrive.allowed_branch,
        backlog_allowed: newDrive.backlog_allowed,
        drive_date: newDrive.drive_date,
        description: newDrive.description,
        status: newDrive.status
      });
      if (res.success) {
        setIsDriveModalOpen(false);
        notify('Job drive posted successfully.');
        const [dRes, dashRes] = await Promise.all([
          api.getTNPDrives(),
          api.getTNPDashboard().catch(() => null)
        ]);
        if (dRes.success) setDrives(dRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post drive');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Status Update for Drive
  const handleUpdateDriveStatus = async (driveId: number, status: string) => {
    try {
      const res = await api.updateDriveStatus(driveId, status);
      if (res.success) {
        notify(`Drive status changed to ${status}.`);
        setDrives(prev => prev.map(d => d.drive_id === driveId ? { ...d, status } : d));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Open Shortlist Modal
  const openShortlistModal = (app: any) => {
    setSelectedApp(app);
    setShortlistForm({
      status: 'Shortlisted',
      package: app.offered_package || app.package || '6.5 LPA',
      job_role: app.job_role || 'Software Engineer',
      offer_date: new Date().toISOString().split('T')[0]
    });
    setIsShortlistModalOpen(true);
  };

  // Submit Shortlist / Status Change
  const handleShortlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const res = await api.shortlistApplication(selectedApp.application_id, {
        ...shortlistForm,
        roll_no: selectedApp.roll_no,
        company_name: selectedApp.company_name
      });
      if (res.success) {
        setIsShortlistModalOpen(false);
        notify(`Application marked as ${shortlistForm.status}.`);
        const [aRes, pRes] = await Promise.all([
          api.getTNPApplications(),
          api.getTNPPlacements()
        ]);
        if (aRes.success) setApplications(aRes.data);
        if (pRes.success) setPlacements(pRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setProcessing(false);
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesDrive = !selectedDriveId || String(app.drive_id) === String(selectedDriveId);
    const matchesStatus = !appStatusFilter || app.app_status === appStatusFilter;
    const matchesSearch = !searchQuery ||
      app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDrive && matchesStatus && matchesSearch;
  });

  // Filtered Placements
  const filteredPlacements = placements.filter(p => {
    return !searchQuery ||
      p.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Job Drives & Placement Operations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage corporate recruitment sessions, applications, and student placement records</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Drive</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('drives')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'drives'
              ? 'border-[#2ECC71] text-[#2ECC71]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job Drives ({drives.length})</span>
        </button>
        <button
          onClick={() => handleTabChange('applications')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'applications'
              ? 'border-[#2ECC71] text-[#2ECC71]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Applications & Shortlisting ({applications.length})</span>
        </button>
        <button
          onClick={() => handleTabChange('placements')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'placements'
              ? 'border-[#2ECC71] text-[#2ECC71]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Placed Students ({placements.length})</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: JOB DRIVES */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drives.map(drive => (
              <div
                key={drive.drive_id}
                className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{drive.company_name}</h3>
                      <p className="text-xs text-slate-500">{drive.job_role}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      drive.status === 'Open for Registration' ? 'bg-emerald-100 text-emerald-800' :
                      drive.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      drive.status === 'Completed' ? 'bg-slate-200 text-slate-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {drive.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Package CTC:</span>
                      <span className="font-extrabold text-emerald-700">{drive.package || 'Best in Industry'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Drive Date:</span>
                      <span className="font-medium text-slate-700 font-mono">
                        {drive.drive_date ? new Date(drive.drive_date).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Deadline:</span>
                      <span className="font-medium text-slate-700 font-mono">
                        {drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleDateString() : 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Applications:</span>
                      <span className="font-bold text-slate-800">{drive.total_applications || 0} applied</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <select
                    value={drive.status}
                    onChange={e => handleUpdateDriveStatus(drive.drive_id, e.target.value)}
                    className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Open for Registration">Open for Registration</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedDriveId(String(drive.drive_id));
                      setActiveTab('applications');
                    }}
                    className="text-xs font-bold text-[#2ECC71] hover:underline flex items-center gap-1"
                  >
                    View Applicants
                  </button>
                </div>
              </div>
            ))}
            {drives.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No job drives created yet. Click "Post New Drive" above to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: APPLICATIONS & SHORTLIST */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name, roll number, or company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>

            <div className="w-48">
              <select
                value={selectedDriveId}
                onChange={e => setSelectedDriveId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                <option value="">All Job Drives</option>
                {drives.map(d => (
                  <option key={d.drive_id} value={d.drive_id}>
                    {d.company_name} - {d.job_role}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-40">
              <select
                value={appStatusFilter}
                onChange={e => setAppStatusFilter(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                <option value="">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Technical Round">Technical Round</option>
                <option value="HR Round">HR Round</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {(selectedDriveId || appStatusFilter || searchQuery) && (
              <button
                onClick={() => { setSelectedDriveId(''); setAppStatusFilter(''); setSearchQuery(''); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Branch / Dept</th>
                    <th className="px-4 py-3.5">Drive / Role</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map(app => (
                    <tr key={app.application_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{app.student_name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{app.roll_no}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-700">{app.branch || app.department_name}</p>
                        <p className="text-[10px] text-slate-400">Sem {app.current_semester || 7}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{app.company_name}</p>
                        <p className="text-[11px] text-slate-500">{app.job_role}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {app.application_date ? new Date(app.application_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          app.app_status === 'Selected' || app.app_status === 'Offer Accepted' ? 'bg-emerald-100 text-emerald-800' :
                          app.app_status === 'Shortlisted' ? 'bg-blue-100 text-blue-800' :
                          app.app_status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {app.app_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openShortlistModal(app)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1a8742] text-xs font-bold transition-all border border-emerald-200"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        No applications found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: PLACEMENTS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'placements' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search placed students, companies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
            <div className="text-xs font-bold text-slate-500">
              Total Offers: <span className="text-emerald-700 font-extrabold">{placements.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Branch</th>
                    <th className="px-4 py-3.5">Company</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Package CTC</th>
                    <th className="px-4 py-3.5">Offer Date</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlacements.map(p => (
                    <tr key={p.placement_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{p.student_name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{p.roll_no}</p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {p.branch || 'Computer Science'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {p.company_name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {p.job_role}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-emerald-700">
                        {p.package || '6.00 LPA'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {p.offer_date ? new Date(p.offer_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          {p.status || 'Accepted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPlacements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        No placement records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist / Status Modal */}
      <Modal
        isOpen={isShortlistModalOpen}
        onClose={() => setIsShortlistModalOpen(false)}
        title="Update Application Status"
        subtitle={selectedApp ? `${selectedApp.student_name} (${selectedApp.roll_no}) — ${selectedApp.company_name}` : ''}
      >
        <form onSubmit={handleShortlistSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Application Status *</label>
            <select
              value={shortlistForm.status}
              onChange={e => setShortlistForm({ ...shortlistForm, status: e.target.value })}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              <option value="Applied">Applied (Reset)</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Technical Round">Technical Round</option>
              <option value="HR Round">HR Round</option>
              <option value="Selected">Selected (Job Offered)</option>
              <option value="Offer Accepted">Offer Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {(shortlistForm.status === 'Selected' || shortlistForm.status === 'Offer Accepted') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offered Role</label>
                  <input
                    type="text"
                    value={shortlistForm.job_role}
                    onChange={e => setShortlistForm({ ...shortlistForm, job_role: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual CTC Package</label>
                  <input
                    type="text"
                    value={shortlistForm.package}
                    onChange={e => setShortlistForm({ ...shortlistForm, package: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Date</label>
                <input
                  type="date"
                  value={shortlistForm.offer_date}
                  onChange={e => setShortlistForm({ ...shortlistForm, offer_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsShortlistModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Post Drive Modal */}
      <Modal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        title="Post New Job Drive"
        subtitle="Schedule a recruitment drive for campus students"
        maxWidth="lg"
      >
        <form onSubmit={handleAddDrive} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company *</label>
            <select
              value={newDrive.company_id}
              onChange={e => setNewDrive({ ...newDrive, company_id: e.target.value })}
              required
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name} ({c.location || 'India'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Role *</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={newDrive.job_role}
                onChange={e => setNewDrive({ ...newDrive, job_role: e.target.value })}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Package CTC</label>
              <input
                type="text"
                placeholder="e.g. 8.5 LPA"
                value={newDrive.package}
                onChange={e => setNewDrive({ ...newDrive, package: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Drive Date *</label>
              <input
                type="date"
                value={newDrive.drive_date}
                onChange={e => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum CGPA Criteria * <span className="text-emerald-600 font-semibold">(e.g. 7.00)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="7.00"
                value={newDrive.minimum_cgpa}
                onChange={e => setNewDrive({ ...newDrive, minimum_cgpa: e.target.value })}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Eligible Disciplines / Branch *</label>
              <select
                value={newDrive.allowed_branch}
                onChange={e => setNewDrive({ ...newDrive, allowed_branch: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                <option value="All">All Engineering Branches (Open)</option>
                <option value="CS">Computer Science (CS)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ENTC">Electronics & Telecommunication (ENTC)</option>
                <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Active Backlogs Allowed?</label>
              <select
                value={newDrive.backlog_allowed}
                onChange={e => setNewDrive({ ...newDrive, backlog_allowed: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                <option value="No">No (Clean Academic Record Required)</option>
                <option value="Yes">Yes (Allowed with ATKT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Job Role Overview & Instructions</label>
            <textarea
              rows={2}
              placeholder="Detailed recruitment drive guidelines, selection rounds, and candidate prerequisites..."
              value={newDrive.description}
              onChange={e => setNewDrive({ ...newDrive, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {processing ? 'Posting...' : 'Post Drive'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TNPPlacementsPage;
