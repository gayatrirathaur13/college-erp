import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookMarked, RotateCcw, AlertCircle, CheckCircle2, Search,
  Filter, Calendar, Clock, RefreshCw, Plus, ShieldAlert,
  AlertTriangle, DollarSign, UserCheck, Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';

type TabType = 'active' | 'overdue' | 'returned';

export const LibrarianIssuancePage: React.FC = () => {
  const location = useLocation();

  // Determine initial tab from route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes('/overdue')) return 'overdue';
    if (location.pathname.includes('/returns')) return 'returned';
    return 'active';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [issues, setIssues] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [booksList, setBooksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Issue Book Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    roll_no: '',
    isbn: '',
    due_days: '14'
  });
  const [issuing, setIssuing] = useState(false);

  // Return Book Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/overdue')) setActiveTab('overdue');
    else if (location.pathname.includes('/returns')) setActiveTab('returned');
  }, [location.pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allIssuesRes, overdueRes, booksRes] = await Promise.all([
        api.getLibraryIssues(),
        api.getOverdueBooks(),
        api.getLibraryBooks()
      ]);
      if (allIssuesRes.success) setIssues(allIssuesRes.data);
      if (overdueRes.success) setOverdueList(overdueRes.data);
      if (booksRes.success) setBooksList(booksRes.data);
    } catch (err) {
      console.error('Failed to load library issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.roll_no.trim() || !issueForm.isbn) return;
    setIssuing(true);
    try {
      const res = await api.issueBook({
        roll_no: issueForm.roll_no.trim(),
        isbn: issueForm.isbn.trim(),
        due_days: parseInt(issueForm.due_days) || 14
      });
      if (res.success) {
        setIsIssueModalOpen(false);
        setIssueForm({ roll_no: '', isbn: '', due_days: '14' });
        setActionSuccess(res.message || 'Book issued successfully!');
        setTimeout(() => setActionSuccess(''), 4500);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  const handleOpenReturnModal = (issue: any) => {
    setSelectedIssue(issue);
    setReturnCondition('Good');
    setReturnRemarks('');
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setReturning(true);
    try {
      const res = await api.returnBook(selectedIssue.issue_id, {
        condition_on_return: returnCondition,
        remarks: returnRemarks || undefined,
        roll_no: selectedIssue.roll_no
      });
      if (res.success) {
        setIsReturnModalOpen(false);
        setSelectedIssue(null);
        setActionSuccess(res.message || 'Book return recorded successfully!');
        setTimeout(() => setActionSuccess(''), 4500);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to return book');
    } finally {
      setReturning(false);
    }
  };

  // Filter lists based on search term
  const filterList = (list: any[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(item =>
      (item.student_name && item.student_name.toLowerCase().includes(q)) ||
      (item.roll_no && item.roll_no.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.accession_no && item.accession_no.toLowerCase().includes(q)) ||
      (item.isbn && item.isbn.toLowerCase().includes(q))
    );
  };

  const activeIssues = issues.filter(i => i.issue_status !== 'Returned');
  const returnedIssues = issues.filter(i => i.issue_status === 'Returned');

  const displayedList = activeTab === 'active'
    ? filterList(activeIssues)
    : activeTab === 'overdue'
    ? filterList(overdueList)
    : filterList(returnedIssues);

  // Overall counts
  const totalActive = activeIssues.length;
  const totalOverdue = overdueList.length;
  const totalReturned = returnedIssues.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
              Circulation Desk
            </span>
            <span className="text-xs text-slate-400 font-medium">Issue, Return & Overdue</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Book Circulation & Lending
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Track student loans, process book returns, inspect condition, and manage overdue fines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
            style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)', boxShadow: '0 4px 14px rgba(230,126,34,0.35)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Issue Book
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Active Loans
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700">
              {totalActive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'overdue'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Overdue Books
            {totalOverdue > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-extrabold animate-pulse">
                {totalOverdue}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'returned'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Return History
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700">
              {totalReturned}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, roll, or book..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
          />
        </div>
      </div>

      {/* Overdue alert banner on overdue tab */}
      {activeTab === 'overdue' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-900">
              Fine Policy Active: ₹5.00 per day for each day past the due date
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Returning an overdue book automatically registers a late fine record against the student's account.
            </p>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Book & Accession</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">{activeTab === 'returned' ? 'Return Date' : 'Due Date'}</th>
                {activeTab === 'overdue' && <th className="py-3 px-4">Overdue Days & Fine</th>}
                {activeTab === 'returned' && <th className="py-3 px-4">Condition</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedList.map((item: any) => {
                const isOverdue = item.issue_status === 'Overdue' || item.days_overdue > 0;
                const isReturned = item.issue_status === 'Returned' || item.return_date;
                const daysLate = item.days_overdue || item.days_late || 0;
                const fine = daysLate * 5;

                return (
                  <tr key={item.issue_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.student_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">Roll: {item.roll_no}</div>
                      {item.email && <div className="text-[10px] text-slate-400 font-mono truncate">{item.email}</div>}
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-semibold text-slate-800 line-clamp-1" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Acc: <span className="font-semibold text-slate-600">{item.accession_no || 'N/A'}</span> • ISBN: {item.isbn}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.issue_date ? new Date(item.issue_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {activeTab === 'returned' ? (
                        <span className="text-emerald-700 font-semibold">
                          {item.return_date ? new Date(item.return_date).toLocaleDateString() : 'Returned'}
                        </span>
                      ) : (
                        <div>
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                          </span>
                          {isOverdue && (
                            <span className="block text-[10px] text-rose-500 font-semibold">
                              Expired {daysLate}d ago
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {activeTab === 'overdue' && (
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-rose-600">{daysLate} Days Late</div>
                        <div className="text-[11px] font-bold text-amber-700">₹{fine}.00 Fine</div>
                      </td>
                    )}

                    {activeTab === 'returned' && (
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.condition_on_return === 'Damaged' ? 'bg-rose-100 text-rose-700' :
                          item.condition_on_return === 'Lost' ? 'bg-red-200 text-red-900' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.condition_on_return || 'Good'}
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-4">
                      {isReturned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Returned
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" /> Issued
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isReturned ? (
                        <button
                          onClick={() => handleOpenReturnModal(item)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors shadow-sm"
                        >
                          Process Return
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {displayedList.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    {activeTab === 'overdue'
                      ? 'No overdue books! All active book loans are currently within their due dates.'
                      : activeTab === 'returned'
                      ? 'No returned records matching your criteria.'
                      : 'No active loans found. Click "Issue Book" to start lending.'}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#E67E22] mb-2" />
                    Loading circulation records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Book to Student"
        subtitle="Record loan and allocate physical copy"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 2023CS001"
              value={issueForm.roll_no}
              onChange={e => setIssueForm(prev => ({ ...prev, roll_no: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Book Title *</label>
            <select
              required
              value={issueForm.isbn}
              onChange={e => setIssueForm(prev => ({ ...prev, isbn: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white"
            >
              <option value="">-- Choose Book from Catalog --</option>
              {booksList.map((b: any) => (
                <option key={b.isbn} value={b.isbn} disabled={b.available_copies <= 0}>
                  {b.title} ({b.author_name || 'N/A'}) — Avail: {b.available_copies}/{b.total_copies} {b.available_copies <= 0 ? '(Out of Stock)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loan Period (Days)</label>
            <select
              value={issueForm.due_days}
              onChange={e => setIssueForm(prev => ({ ...prev, due_days: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white"
            >
              <option value="7">7 Days (Standard short loan)</option>
              <option value="14">14 Days (Standard fortnight loan)</option>
              <option value="30">30 Days (Extended semester loan)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issuing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)' }}
            >
              {issuing ? 'Issuing...' : 'Confirm Loan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Record Book Return"
        subtitle={selectedIssue ? `Returning: ${selectedIssue.title} (${selectedIssue.student_name})` : ''}
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {selectedIssue && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Borrower:</span>
                <span className="font-bold text-slate-800">{selectedIssue.student_name} ({selectedIssue.roll_no})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Accession No:</span>
                <span className="font-mono font-bold text-slate-700">{selectedIssue.accession_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-semibold text-slate-700">{new Date(selectedIssue.due_date).toLocaleDateString()}</span>
              </div>
              {selectedIssue.days_overdue > 0 && (
                <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
                  <span>Overdue by {selectedIssue.days_overdue} days:</span>
                  <span>Late Fine: ₹{selectedIssue.days_overdue * 5}.00</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Book Condition on Return</label>
            <select
              value={returnCondition}
              onChange={e => setReturnCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white"
            >
              <option value="Good">Good (Restock to available copies)</option>
              <option value="Damaged">Damaged (Mark copy damaged, requires repair)</option>
              <option value="Lost">Lost (Mark copy lost, bill student replacement)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Staff Remarks</label>
            <textarea
              rows={2}
              value={returnRemarks}
              onChange={e => setReturnRemarks(e.target.value)}
              placeholder="e.g. Returned on time, clean copy..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={returning}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)' }}
            >
              {returning ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibrarianIssuancePage;
