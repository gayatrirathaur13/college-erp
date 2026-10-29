import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  AlertCircle, 
  Clock, 
  Search, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { api } from '../../services/api';
import { mockBooks } from '../../data/mockLibrary';

interface BorrowedBook {
  issue_id: string;
  title: string;
  author: string;
  isbn: string;
  accession_no: string;
  issue_date: string;
  due_date: string;
  status: 'Issued' | 'Overdue';
  fine_amount: number;
}

interface ReturnedBook {
  return_id: string;
  title: string;
  isbn: string;
  returned_date: string;
  condition: string;
  fine_paid: number;
}

export const StudentLibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'catalog'>('current');
  const [currentLoans, setCurrentLoans] = useState<BorrowedBook[]>([]);
  const [returnHistory, setReturnHistory] = useState<ReturnedBook[]>([]);
  const [catalogBooks, setCatalogBooks] = useState<any[]>(mockBooks);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    Promise.all([
      api.getStudentLibrary().catch(() => null),
      api.getLibraryBooks().catch(() => null)
    ]).then(([libRes, catRes]) => {
      if (isMounted) {
        if (libRes?.success && libRes.data) {
          setCurrentLoans(libRes.data.currentLoans || []);
          setReturnHistory(libRes.data.returns || []);
        }
        if (catRes?.success && catRes.data && catRes.data.length > 0) {
          setCatalogBooks(catRes.data);
        }
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const loanColumns: Column<BorrowedBook>[] = [
    {
      header: "Book Title",
      accessor: "title",
      render: (b) => (
        <div>
          <span className="font-bold text-navy-950 block">{b.title}</span>
          <span className="text-[11px] text-slate-500">{b.author}</span>
        </div>
      )
    },
    {
      header: "Accession Barcode",
      accessor: "accession_no",
      render: (b) => <span className="font-mono text-xs text-navy-800">{b.accession_no}</span>
    },
    {
      header: "Borrowed Date",
      accessor: "issue_date",
      render: (b) => <span className="font-mono text-slate-500 text-xs">{b.issue_date ? String(b.issue_date).slice(0, 10) : 'N/A'}</span>
    },
    {
      header: "Return Due Deadline",
      accessor: "due_date",
      render: (b) => (
        <span className={`font-mono font-bold text-xs ${b.status === 'Overdue' ? 'text-rose-600' : 'text-slate-800'}`}>
          {b.due_date ? String(b.due_date).slice(0, 10) : 'N/A'}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (b) => <Badge variant={b.status === 'Issued' ? 'info' : 'danger'}>{b.status}</Badge>
    },
    {
      header: "Accrued Fine",
      accessor: "fine_amount",
      render: (b) => (
        b.fine_amount > 0 ? (
          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            ₹{b.fine_amount.toFixed(2)}
          </span>
        ) : (
          <span className="font-mono text-slate-400">₹0.00</span>
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
            <BookOpen className="w-6 h-6 text-navy-800" />
            Library Circulation & Book Loans
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active borrowed books, due dates, past return history, overdue penalties, and library catalog.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'current' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Currently Borrowed ({currentLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Borrowing History
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'catalog' ? 'bg-navy-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Search Book Catalog
          </button>
        </div>
      </div>

      {activeTab === 'current' && (
        <div className="space-y-4">
          {currentLoans.some(b => b.status === 'Overdue') && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 leading-relaxed">
                <strong>Attention — Overdue Loan Penalty:</strong> You have an overdue book loan.
                An overdue fine of ₹2.00 per day is accruing. Please return the book to the Central Circulation Desk immediately.
              </div>
            </div>
          )}

          {currentLoans.length > 0 ? (
            <DataTable
              columns={loanColumns}
              data={currentLoans}
              title="Active Borrowed Books"
              subtitle="Books currently in your possession from Central Library"
            />
          ) : (
            <EmptyState
              title="No Active Book Loans"
              description="You do not currently have any books checked out from the library."
            />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        returnHistory.length > 0 ? (
          <DataTable
            columns={[
              { header: "Book Title", accessor: "title", render: (r) => <span className="font-bold text-navy-950">{r.title}</span> },
              { header: "ISBN", accessor: "isbn", render: (r) => <span className="font-mono text-slate-500">{r.isbn}</span> },
              { header: "Returned On", accessor: "returned_date", render: (r) => <span className="font-mono">{r.returned_date ? String(r.returned_date).slice(0, 10) : ''}</span> },
              { header: "Physical Condition", accessor: "condition", render: (r) => <Badge variant="neutral">{r.condition}</Badge> },
              {
                header: "Fine Cleared",
                accessor: "fine_paid",
                render: (r) => <span className="font-mono">₹{r.fine_paid.toFixed(2)}</span>
              }
            ]}
            data={returnHistory}
            title="Past Circulation Return Archive"
            subtitle="All returned books previously checked out by your student card"
          />
        ) : (
          <EmptyState
            title="No Prior Circulation History"
            description="You have no returned book transactions on record."
          />
        )
      )}

      {activeTab === 'catalog' && (
        <DataTable
          columns={[
            {
              header: "Title & Authors",
              render: (b) => (
                <div>
                  <span className="font-bold text-navy-950 block">{b.title}</span>
                  <span className="text-[11px] text-slate-500">{b.author_names}</span>
                </div>
              )
            },
            { header: "Category", accessor: "category_name", render: (b) => <Badge variant="ice">{b.category_name}</Badge> },
            {
              header: "Location",
              render: (b) => <span className="font-mono text-xs text-slate-600">Shelf {b.shelf_no} • Rack {b.rack_no}</span>
            },
            {
              header: "Available In Stock",
              render: (b) => (
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${b.available_copies > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {b.available_copies} / {b.total_copies} Copies
                </span>
              )
            }
          ]}
          data={catalogBooks}
          title="Central Library Catalog Search"
          subtitle="Locate physical shelf coordinates across university stacks"
          searchPlaceholder="Search titles, authors, or categories..."
        />
      )}
    </div>
  );
};

export default StudentLibraryPage;
