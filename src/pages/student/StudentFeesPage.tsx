import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  Calendar, 
  ArrowDownCircle, 
  FileText,
  DollarSign
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { formatINR } from '../../utils/currency';
import { api } from '../../services/api';

interface FeeBill {
  student_fee_id?: number;
  id: string;
  semester: string;
  category: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
}

interface PaymentTransaction {
  receipt_no: string;
  date: string;
  amount: number;
  fee_type: string;
  mode: string;
  status: 'Success';
}

export const StudentFeesPage: React.FC = () => {
  const [feeBills, setFeeBills] = useState<FeeBill[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  // Partial / Full Fee Payment State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<FeeBill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payFeedback, setPayFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadFees = async () => {
    try {
      setIsLoading(true);
      const res = await api.getStudentFees();
      if (res && res.success && res.data) {
        setFeeBills(res.data.bills || []);
        setTransactions(res.data.payments || []);
      }
    } catch (err) {
      console.warn('Failed to load fees from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleOpenPayModal = (bill: FeeBill) => {
    setSelectedBill(bill);
    setPayAmount(bill.due_amount);
    setPaymentMode('UPI');
    setPayFeedback(null);
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedBill) return;
    const amountToPay = Number(payAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      setPayFeedback({ type: 'error', message: 'Please enter a valid positive payment amount.' });
      return;
    }
    if (amountToPay > selectedBill.due_amount) {
      setPayFeedback({ type: 'error', message: `Payment amount cannot exceed outstanding balance of ${formatINR(selectedBill.due_amount)}.` });
      return;
    }

    try {
      setIsSubmittingPay(true);
      setPayFeedback(null);
      const res = await api.payStudentFee({
        student_fee_id: selectedBill.student_fee_id || 1,
        amount: amountToPay,
        payment_mode: paymentMode
      });

      if (res.success) {
        setPayFeedback({
          type: 'success',
          message: res.message || `Payment of ${formatINR(amountToPay)} successfully settled and verified in database!`
        });
        await loadFees();
        setTimeout(() => {
          setIsPayModalOpen(false);
        }, 1500);
      }
    } catch (err: any) {
      setPayFeedback({
        type: 'error',
        message: err.message || 'Payment processing failed. Please try again.'
      });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const billColumns: Column<FeeBill>[] = [
    {
      header: "Invoice No.",
      accessor: "id",
      render: (b) => <span className="font-mono font-bold text-navy-950">{b.id}</span>
    },
    {
      header: "Fee Head & Term",
      render: (b) => (
        <div>
          <span className="font-semibold text-navy-900 block">{b.category}</span>
          <span className="text-[11px] text-slate-500">{b.semester}</span>
        </div>
      )
    },
    {
      header: "Total Billed",
      accessor: "total_amount",
      render: (b) => <span className="font-mono text-slate-700">{formatINR(b.total_amount)}</span>
    },
    {
      header: "Amount Paid",
      accessor: "paid_amount",
      render: (b) => <span className="font-mono text-emerald-800 font-semibold">{formatINR(b.paid_amount)}</span>
    },
    {
      header: "Balance Due",
      accessor: "due_amount",
      render: (b) => (
        <span className={`font-mono font-bold ${b.due_amount > 0 ? 'text-[#FF6B4A]' : 'text-slate-500'}`}>
          {formatINR(b.due_amount)}
        </span>
      )
    },
    {
      header: "Due Date",
      accessor: "due_date",
      render: (b) => <span className="text-slate-600 font-mono text-xs">{b.due_date ? String(b.due_date).slice(0, 10) : 'N/A'}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: (b) => {
        if (b.status === 'Paid') return <Badge variant="success">Paid</Badge>;
        if (b.status === 'Partially Paid') return <Badge variant="warning">Partial</Badge>;
        return <Badge variant="danger">Unpaid</Badge>;
      }
    },
    {
      header: "Action",
      render: (b) => {
        if (b.due_amount > 0) {
          return (
            <button
              onClick={() => handleOpenPayModal(b)}
              className="px-3 py-1.5 bg-[#4D8DFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Balance
            </button>
          );
        }
        return (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
          </span>
        );
      }
    }
  ];

  const transactionColumns: Column<PaymentTransaction>[] = [
    {
      header: "Receipt Reference",
      accessor: "receipt_no",
      render: (t) => <span className="font-mono font-bold text-navy-950">{t.receipt_no}</span>
    },
    {
      header: "Payment Date",
      accessor: "date",
      render: (t) => <span className="text-slate-600 text-xs font-mono">{t.date ? String(t.date).slice(0, 10) : 'N/A'}</span>
    },
    {
      header: "Category",
      accessor: "fee_type"
    },
    {
      header: "Mode of Transfer",
      accessor: "mode",
      render: (t) => <span className="text-slate-700 text-xs">{t.mode}</span>
    },
    {
      header: "Settled Amount",
      accessor: "amount",
      render: (t) => <span className="font-mono font-bold text-emerald-800">{formatINR(t.amount)}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: () => <Badge variant="success">Cleared</Badge>
    },
    {
      header: "Receipt",
      render: (t) => (
        <button
          onClick={() => setSelectedReceipt(t)}
          className="text-xs text-[#4D8DFF] hover:underline font-bold flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          View
        </button>
      )
    }
  ];

  const totalBilled = feeBills.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalPaid = feeBills.reduce((acc, curr) => acc + curr.paid_amount, 0);
  const totalDue = feeBills.reduce((acc, curr) => acc + curr.due_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-navy-800" />
          Fees & Financial Accounts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Semester tuition invoices, payments summary, payment receipts, and balance dues displayed in Indian Rupees (₹).
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="erp-card p-5 bg-white">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Semester Billed
          </p>
          <h3 className="text-2xl font-extrabold text-navy-950 font-mono">
            {formatINR(totalBilled)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Academic Year 2026-2027</p>
        </div>

        <div className="erp-card p-5 bg-emerald-50/50 border-emerald-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
            Total Amount Credited
          </p>
          <h3 className="text-2xl font-extrabold text-emerald-800 font-mono">
            {formatINR(totalPaid)}
          </h3>
          <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared Payments Record
          </p>
        </div>

        <div className="erp-card p-5 bg-white">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Outstanding Due Balance
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatINR(totalDue)}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {totalDue > 0 ? 'Pending payment required' : 'No outstanding institutional dues'}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      {feeBills.length > 0 ? (
        <DataTable
          columns={billColumns}
          data={feeBills}
          title="Semester Invoices & Breakdown"
          subtitle="Individual fee components billed for academic term"
        />
      ) : (
        <EmptyState
          title="No Fee Invoices Found"
          description="There are currently no fee invoices generated for your student account."
        />
      )}

      {/* Payment History */}
      {transactions.length > 0 ? (
        <DataTable
          columns={transactionColumns}
          data={transactions}
          title="Payment Receipts & Transaction Log"
          subtitle="Verified payment gateway settlements and bank credits"
        />
      ) : (
        <EmptyState
          title="No Payment History"
          description="No fee payment transactions have been recorded yet."
        />
      )}

      {/* Online Partial / Full Fee Payment Modal */}
      {isPayModalOpen && selectedBill && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => !isSubmittingPay && setIsPayModalOpen(false)}
          title="Online Fee Settlement Gateway"
          subtitle={`University Financial Services • Invoice: ${selectedBill.id}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                disabled={isSubmittingPay}
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPay || payAmount <= 0 || payAmount > selectedBill.due_amount}
                onClick={handleProcessPayment}
                className="px-5 py-2 text-xs font-bold text-white bg-[#4D8DFF] hover:bg-blue-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {isSubmittingPay ? 'Authorizing & Updating DB...' : `Confirm & Pay ${formatINR(payAmount || 0)}`}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Feedback alert */}
            {payFeedback && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                payFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {payFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ArrowDownCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{payFeedback.message}</span>
              </div>
            )}

            {/* Bill Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-navy-950">{selectedBill.category}</span>
                <span className="text-[11px] text-slate-500">{selectedBill.semester}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Billed:</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(selectedBill.total_amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Paid So Far:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatINR(selectedBill.paid_amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Remaining Due:</span>
                  <span className="font-mono font-bold text-[#FF6B4A]">{formatINR(selectedBill.due_amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-1.5">
              <label className="block font-bold text-navy-950">Payment Amount (INR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold font-mono">₹</span>
                <input
                  type="number"
                  min="1"
                  max={selectedBill.due_amount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.min(selectedBill.due_amount, Math.max(0, Number(e.target.value))))}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl outline-none font-mono font-bold text-navy-950 text-sm focus:border-[#4D8DFF]"
                  placeholder="Enter amount to pay"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayAmount(selectedBill.due_amount)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#4D8DFF] rounded-lg border border-blue-200 hover:bg-blue-100"
                >
                  Pay Full Balance ({formatINR(selectedBill.due_amount)})
                </button>
                {selectedBill.due_amount > 10000 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(selectedBill.due_amount / 2))}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Pay 50% ({formatINR(Math.round(selectedBill.due_amount / 2))})
                  </button>
                )}
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-1.5">
              <label className="block font-bold text-navy-950">Payment Transfer Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', desc: 'Google Pay, PhonePe' },
                  { id: 'Net Banking', label: 'Net Banking', desc: 'All Indian Banks' },
                  { id: 'Debit Card', label: 'Card Payment', desc: 'Visa, MasterCard, RuPay' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      paymentMode === m.id
                        ? 'bg-blue-50/70 border-[#4D8DFF] text-navy-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-navy-950">{m.label}</span>
                    <span className="block text-[10px] text-slate-500 font-normal">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note on Database Triggers */}
            <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-navy-950">Database Integrated:</span> Once authorized, PostgreSQL trigger <code className="font-mono text-blue-700 font-semibold">trg_payment_after</code> will automatically recalculate your fee balance and reflect cleared status in the Bursar & Finance records immediately.
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Official Fee Payment Receipt"
          subtitle={`University Financial Services • Ref: ${selectedReceipt.receipt_no}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-400 font-mono">Digitally Verified Document</span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl"
              >
                Close Receipt
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs border border-dashed border-slate-300 p-4 rounded-xl bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-extrabold text-navy-950 text-sm">CAMPUS ERP ACCOUNTS DESK</h4>
                <p className="text-[10px] text-slate-500">Student Accounts & Bursar's Office</p>
              </div>
              <Badge variant="success">CLEARED</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Receipt No:</span>
                <span className="font-mono font-bold text-navy-950">{selectedReceipt.receipt_no}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Date & Time:</span>
                <span className="font-mono">{selectedReceipt.date ? String(selectedReceipt.date).slice(0, 10) : ''}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Payment Head:</span>
                <span className="font-semibold">{selectedReceipt.fee_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Payment Mode:</span>
                <span>{selectedReceipt.mode}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-navy-950">Amount Paid:</span>
              <span className="font-mono font-extrabold text-emerald-800">{formatINR(selectedReceipt.amount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentFeesPage;
