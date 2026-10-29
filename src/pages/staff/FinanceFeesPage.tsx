import React, { useEffect, useState } from 'react';
import {
  DollarSign, FileText, CreditCard, Search, Filter, Plus,
  RefreshCw, CheckCircle2, ChevronRight, Eye, Receipt, Calendar, ArrowRight, X
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';

interface FinanceFeesPageProps {
  initialTab?: 'fees' | 'structures' | 'payments' | 'reports';
}

export const FinanceFeesPage: React.FC<FinanceFeesPageProps> = ({ initialTab = 'fees' }) => {
  const [activeTab, setActiveTab] = useState<'fees' | 'structures' | 'payments' | 'reports'>(initialTab);

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Selected student details modal
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Record Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payStudent, setPayStudent] = useState<any>(null);
  const [payStudentFees, setPayStudentFees] = useState<any[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Add Fee Structure Modal
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({
    course_id: '1',
    semester_id: '1',
    fee_type: '',
    amount: '',
    academic_year: '2026-2027',
    due_date: ''
  });
  const [submittingStructure, setSubmittingStructure] = useState(false);

  const [notice, setNotice] = useState('');

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, structRes, payRes] = await Promise.all([
        api.getStudentsWithFees({
          search: searchQuery,
          status: statusFilter,
          dept: deptFilter
        }),
        api.getFeeStructures(),
        api.getAllPayments()
      ]);
      if (stuRes.success) setStudents(stuRes.data);
      if (structRes.success) setStructures(structRes.data);
      if (payRes.success) setPayments(payRes.data);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, deptFilter]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Open Student Details
  const viewStudentDetails = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoadingDetails(true);
    try {
      const res = await api.getStudentFeeDetails(studentId);
      if (res.success) {
        setStudentDetails(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Pay Modal for specific student
  const openPaymentForStudent = async (stu: any) => {
    setPayStudent(stu);
    try {
      const res = await api.getStudentFeeDetails(stu.student_id);
      if (res.success) {
        const fees = (res.data.fees || []).filter((f: any) => f.status !== 'Paid');
        setPayStudentFees(fees);
        if (fees.length > 0) {
          setSelectedFeeId(String(fees[0].student_fee_id));
          const bal = fees[0].amount_due - fees[0].amount_paid;
          setPayAmount(String(bal > 0 ? bal : ''));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsPayModalOpen(true);
  };

  // Submit Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeId || !payAmount) return;
    setSubmittingPay(true);
    try {
      const res = await api.recordPayment(Number(selectedFeeId), {
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        transaction_reference: payRef || `TXN-${Date.now().toString().slice(-6)}`,
        roll_no: payStudent?.roll_no
      });
      if (res.success) {
        setIsPayModalOpen(false);
        notify(res.message || 'Payment recorded successfully.');
        loadData();
        if (selectedStudentId) viewStudentDetails(selectedStudentId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Submit Fee Structure
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStructure.fee_type || !newStructure.amount) return;
    setSubmittingStructure(true);
    try {
      const res = await api.addFeeStructure(newStructure);
      if (res.success) {
        setIsStructureModalOpen(false);
        notify('Fee structure created successfully.');
        const sRes = await api.getFeeStructures();
        if (sRes.success) setStructures(sRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add fee structure');
    } finally {
      setSubmittingStructure(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Student Fees & Accounting</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage student fee invoices, dues, counter receipts, and fee structures</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsStructureModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6C3483] border border-purple-200 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fee Structure</span>
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

      {notice && (
        <div className="flex items-center gap-2 p-4 bg-purple-50 border border-purple-200 text-purple-800 rounded-2xl text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'fees'
              ? 'border-[#9B59B6] text-[#9B59B6]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Student Dues ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-[#9B59B6] text-[#9B59B6]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts ({payments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'structures'
              ? 'border-[#9B59B6] text-[#9B59B6]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Fee Structures ({structures.length})</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: STUDENT FEES & DUES */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name, roll number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadData(); }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              />
            </div>

            <div className="w-44">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              >
                <option value="">All Departments</option>
                <option value="1">Computer Science</option>
                <option value="2">Electronics & Telecomm</option>
                <option value="3">Information Technology</option>
                <option value="4">AIDS</option>
                <option value="5">ENCE</option>
              </select>
            </div>

            <div className="w-36">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <button
              onClick={loadData}
              className="px-4 py-2 bg-[#9B59B6] text-white text-xs font-bold rounded-xl"
            >
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Total Invoiced</th>
                    <th className="px-4 py-3.5">Amount Paid</th>
                    <th className="px-4 py-3.5">Remaining Balance</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => {
                    const due = parseFloat(s.total_due) || 0;
                    const paid = parseFloat(s.total_paid) || 0;
                    const bal = parseFloat(s.balance) || 0;

                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-800">{s.student_name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{s.roll_no}</p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-600">
                          {s.branch || s.department_name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700">
                          ₹{due.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-emerald-700">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-extrabold text-purple-700">
                          ₹{bal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            s.overall_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            s.overall_status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {s.overall_status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => viewStudentDetails(s.student_id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                          >
                            Breakdown
                          </button>
                          {bal > 0 && (
                            <button
                              onClick={() => openPaymentForStudent(s)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6C3483] font-bold text-[11px] border border-purple-200 transition-colors"
                            >
                              Collect Fee
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        No student fee records found.
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
      {/* TAB 2: PAYMENT RECEIPTS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">All Collected Receipts ({payments.length})</h2>
              <span className="text-xs text-slate-400 font-mono">Showing verified transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Receipt ID / Ref</th>
                    <th className="px-4 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Fee Type</th>
                    <th className="px-4 py-3.5">Payment Mode</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.payment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-purple-900">
                        {p.transaction_reference || `REC-${p.payment_id}`}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{p.student_name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{p.roll_no}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {p.fee_type || 'Tuition Fee'}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {p.payment_mode}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-extrabold text-emerald-700">
                        ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          {p.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        No payments recorded yet.
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
      {/* TAB 3: FEE STRUCTURES */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map(fs => (
              <div
                key={fs.fee_structure_id}
                className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-800">{fs.fee_type}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {fs.academic_year}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{fs.course_name || 'B.Tech Program'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Semester {fs.semester_number || 1}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Amount:</span>
                    <span className="text-base font-extrabold text-purple-800">
                      ₹{parseFloat(fs.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[10px] font-mono text-slate-400">
                  Due: {fs.due_date ? new Date(fs.due_date).toLocaleDateString() : 'Standard Term'}
                </div>
              </div>
            ))}
            {structures.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No fee structures created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <Modal
        isOpen={!!selectedStudentId}
        onClose={() => { setSelectedStudentId(null); setStudentDetails(null); }}
        title="Student Fee Breakdown"
        subtitle={studentDetails?.student ? `${studentDetails.student.student_name} (${studentDetails.student.roll_no}) — ${studentDetails.student.branch}` : ''}
        maxWidth="2xl"
      >
        {loadingDetails ? (
          <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-[#9B59B6]" /></div>
        ) : studentDetails ? (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Invoiced Fee Components</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(studentDetails.fees || []).map((f: any) => (
                  <div key={f.student_fee_id} className="p-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <p className="font-bold text-slate-800">{f.fee_type || 'Tuition Fee'}</p>
                      <p className="text-[10px] text-slate-400">Due Date: {f.due_date ? new Date(f.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-700">₹{parseFloat(f.amount_due).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Paid: ₹{parseFloat(f.amount_paid).toLocaleString('en-IN')}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recorded Payments</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(studentDetails.payments || []).map((p: any) => (
                  <div key={p.payment_id} className="p-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <p className="font-bold text-purple-900">{p.transaction_reference || `REC-${p.payment_id}`}</p>
                      <p className="text-[10px] text-slate-400">{p.payment_mode} • {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-emerald-700">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                      <span className="text-[9px] font-bold text-emerald-600 block">{p.status}</span>
                    </div>
                  </div>
                ))}
                {(!studentDetails.payments?.length) && (
                  <div className="p-4 text-center text-slate-400 text-xs">No payments recorded for this student yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Collect Fee Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Fee Payment"
        subtitle={payStudent ? `${payStudent.student_name} (${payStudent.roll_no})` : ''}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Fee Item *</label>
            <select
              value={selectedFeeId}
              onChange={e => {
                setSelectedFeeId(e.target.value);
                const fee = payStudentFees.find(f => String(f.student_fee_id) === e.target.value);
                if (fee) {
                  const bal = fee.amount_due - fee.amount_paid;
                  setPayAmount(String(bal > 0 ? bal : ''));
                }
              }}
              required
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
            >
              {payStudentFees.map(f => (
                <option key={f.student_fee_id} value={f.student_fee_id}>
                  {f.fee_type || 'Tuition Fee'} (Due: ₹{(f.amount_due - f.amount_paid).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Pay (₹) *</label>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                min="1"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={payMode}
                onChange={e => setPayMode(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              >
                <option value="Cash">Cash (Counter)</option>
                <option value="UPI">UPI / QR</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque / DD">Cheque / DD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Receipt No</label>
            <input
              type="text"
              placeholder="e.g. REC-10293 or UTR reference"
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPay || !selectedFeeId}
              className="px-4 py-2 rounded-xl bg-[#9B59B6] hover:bg-[#8e44ad] text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {submittingPay ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Fee Structure Modal */}
      <Modal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        title="Add Fee Structure"
        subtitle="Define new institutional fee component"
      >
        <form onSubmit={handleAddStructure} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fee Type / Component Name *</label>
            <input
              type="text"
              placeholder="e.g. Annual Tuition Fee, Hostel Deposit"
              value={newStructure.fee_type}
              onChange={e => setNewStructure({ ...newStructure, fee_type: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 75000"
                value={newStructure.amount}
                onChange={e => setNewStructure({ ...newStructure, amount: e.target.value })}
                required
                min="100"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                placeholder="2026-2027"
                value={newStructure.academic_year}
                onChange={e => setNewStructure({ ...newStructure, academic_year: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={newStructure.due_date}
              onChange={e => setNewStructure({ ...newStructure, due_date: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B59B6]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStructureModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStructure}
              className="px-4 py-2 rounded-xl bg-[#9B59B6] hover:bg-[#8e44ad] text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {submittingStructure ? 'Creating...' : 'Create Structure'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FinanceFeesPage;
