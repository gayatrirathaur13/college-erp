import React, { useEffect, useState } from 'react';
import {
  BookOpen, Plus, Search, Filter, Edit3, CheckCircle2,
  AlertCircle, RefreshCw, Layers, MapPin, Hash, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';

export const LibrarianBooksPage: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'out'>('all');
  const [actionSuccess, setActionSuccess] = useState('');

  // Add Book Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    isbn: '',
    title: '',
    author_name: '',
    publisher_name: '',
    category_name: 'Computer Science',
    edition: '1st Edition',
    publication_year: new Date().getFullYear().toString(),
    language: 'English',
    total_copies: '5',
    shelf_location: 'Main Floor A-Wing',
    rack_no: 'CS-01'
  });
  const [adding, setAdding] = useState(false);

  // Edit Book Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    edition: '',
    publication_year: '',
    language: 'English',
    shelf_location: '',
    rack_no: ''
  });
  const [editing, setEditing] = useState(false);

  // Quick Issue from book page
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueBookTarget, setIssueBookTarget] = useState<any>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [issueRollNo, setIssueRollNo] = useState('');
  const [issueDays, setIssueDays] = useState('14');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [issuing, setIssuing] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getLibraryBooks(search || undefined, selectedCategory || undefined);
      if (res.success) {
        setBooks(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.isbn || !addForm.title) return;
    setAdding(true);
    try {
      const res = await api.addBook(addForm);
      if (res.success) {
        setIsAddModalOpen(false);
        setAddForm({
          isbn: '',
          title: '',
          author_name: '',
          publisher_name: '',
          category_name: 'Computer Science',
          edition: '1st Edition',
          publication_year: new Date().getFullYear().toString(),
          language: 'English',
          total_copies: '5',
          shelf_location: 'Main Floor A-Wing',
          rack_no: 'CS-01'
        });
        setActionSuccess(res.message || 'Book added successfully!');
        setTimeout(() => setActionSuccess(''), 4500);
        fetchBooks();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add book');
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEditModal = (book: any) => {
    setEditingBook(book);
    setEditForm({
      title: book.title || '',
      edition: book.edition || '',
      publication_year: book.publication_year ? String(book.publication_year) : '',
      language: book.language || 'English',
      shelf_location: book.shelf_location || '',
      rack_no: book.rack_no || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    setEditing(true);
    try {
      const res = await api.updateBook(editingBook.isbn, {
        title: editForm.title,
        edition: editForm.edition,
        publication_year: editForm.publication_year ? parseInt(editForm.publication_year) : undefined,
        language: editForm.language,
        shelf_location: editForm.shelf_location,
        rack_no: editForm.rack_no
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setEditingBook(null);
        setActionSuccess('Book updated successfully!');
        setTimeout(() => setActionSuccess(''), 4500);
        fetchBooks();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update book');
    } finally {
      setEditing(false);
    }
  };

  const handleOpenIssueModal = (book: any) => {
    setIssueBookTarget(book);
    setIssueRollNo('');
    setIssueDays('14');
    setIssueDate(todayStr);
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBookTarget || !issueRollNo.trim()) return;
    setIssuing(true);
    try {
      const res = await api.issueBook({
        isbn: issueBookTarget.isbn,
        roll_no: issueRollNo.trim(),
        due_days: parseInt(issueDays) || 14,
        issue_date: issueDate || todayStr
      });
      if (res.success) {
        setIsIssueModalOpen(false);
        setIssueBookTarget(null);
        setActionSuccess(res.message || 'Book issued successfully!');
        setTimeout(() => setActionSuccess(''), 4500);
        fetchBooks();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(books.map(b => b.category_name).filter(Boolean)));

  // Filter books by stock status
  const filteredBooks = books.filter(b => {
    if (stockFilter === 'available') return b.available_copies > 0;
    if (stockFilter === 'out') return b.available_copies <= 0;
    return true;
  });

  const totalTitles = books.length;
  const totalCopiesCount = books.reduce((acc, b) => acc + (parseInt(b.total_copies) || 0), 0);
  const availableCopiesCount = books.reduce((acc, b) => acc + (parseInt(b.available_copies) || 0), 0);
  const outOfStockCount = books.filter(b => b.available_copies <= 0).length;

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
              Library Catalog
            </span>
            <span className="text-xs text-slate-400 font-medium">Inventory & Stock</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Book Inventory
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Manage book records, accession copies, shelf locations, and availability across categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchBooks()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
            style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)', boxShadow: '0 4px 14px rgba(230,126,34,0.35)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Book
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Titles</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{totalTitles}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Copies</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{totalCopiesCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Copies</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{availableCopiesCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Title, Author name, or ISBN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#E67E22] hover:bg-[#D35400] transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white text-slate-700 font-semibold"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${stockFilter === 'all' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('available')}
                className={`px-3 py-1.5 rounded-lg transition-all ${stockFilter === 'available' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('out')}
                className={`px-3 py-1.5 rounded-lg transition-all ${stockFilter === 'out' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E67E22]" />
              Catalog Titles ({filteredBooks.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Showing indexed books with physical stock counts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Book Details</th>
                <th className="py-3 px-4">Author & Publisher</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBooks.map((b: any) => {
                const isAvailable = b.available_copies > 0;
                return (
                  <tr key={b.isbn} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="font-extrabold text-slate-900 line-clamp-1" title={b.title}>
                        {b.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ISBN: {b.isbn} • {b.edition || '1st Ed.'} ({b.publication_year || 'N/A'})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{b.author_name || 'Unknown Author'}</div>
                      <div className="text-[11px] text-slate-400">{b.publisher_name || 'Independent'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {b.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {b.shelf_location || 'Main Floor'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 ml-4">
                        Rack: {b.rack_no || 'R-01'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {b.available_copies} / {b.total_copies} Avail
                        </span>
                      </div>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, (b.available_copies / (b.total_copies || 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenIssueModal(b)}
                          disabled={!isAvailable}
                          title={isAvailable ? 'Issue this book' : 'No copies available'}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Issue
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Book Details"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBooks.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    No books matched your search or filters. Try adjusting keywords or click "Add New Book".
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#E67E22] mb-2" />
                    Loading book records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Book to Inventory"
        subtitle="Catalog book title and generate accession copy records"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ISBN *</label>
              <input
                type="text"
                required
                placeholder="e.g. 978-0131103627"
                value={addForm.isbn}
                onChange={e => setAddForm(prev => ({ ...prev, isbn: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Book Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Clean Code: Handbook of Agile Craft"
                value={addForm.title}
                onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
              <input
                type="text"
                placeholder="e.g. Robert C. Martin"
                value={addForm.author_name}
                onChange={e => setAddForm(prev => ({ ...prev, author_name: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Publisher</label>
              <input
                type="text"
                placeholder="e.g. Pearson / Prentice Hall"
                value={addForm.publisher_name}
                onChange={e => setAddForm(prev => ({ ...prev, publisher_name: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={addForm.category_name}
                onChange={e => setAddForm(prev => ({ ...prev, category_name: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Edition</label>
              <input
                type="text"
                value={addForm.edition}
                onChange={e => setAddForm(prev => ({ ...prev, edition: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Copies</label>
              <input
                type="number"
                min="1"
                max="50"
                value={addForm.total_copies}
                onChange={e => setAddForm(prev => ({ ...prev, total_copies: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shelf Location</label>
              <input
                type="text"
                value={addForm.shelf_location}
                onChange={e => setAddForm(prev => ({ ...prev, shelf_location: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rack Number</label>
              <input
                type="text"
                value={addForm.rack_no}
                onChange={e => setAddForm(prev => ({ ...prev, rack_no: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)' }}
            >
              {adding ? 'Saving...' : 'Add Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Book Details"
        subtitle={editingBook ? `ISBN: ${editingBook.isbn}` : ''}
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Book Title *</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Edition</label>
              <input
                type="text"
                value={editForm.edition}
                onChange={e => setEditForm(prev => ({ ...prev, edition: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Publication Year</label>
              <input
                type="number"
                value={editForm.publication_year}
                onChange={e => setEditForm(prev => ({ ...prev, publication_year: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shelf Location</label>
              <input
                type="text"
                value={editForm.shelf_location}
                onChange={e => setEditForm(prev => ({ ...prev, shelf_location: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rack No</label>
              <input
                type="text"
                value={editForm.rack_no}
                onChange={e => setEditForm(prev => ({ ...prev, rack_no: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)' }}
            >
              {editing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Issue Modal from Book Row */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Selected Book"
        subtitle={issueBookTarget ? `${issueBookTarget.title} (Available: ${issueBookTarget.available_copies})` : ''}
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 2023CS001"
              value={issueRollNo}
              onChange={e => setIssueRollNo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                max={todayStr}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white font-medium"
              />
              <span className="text-[10px] text-slate-400">Can select backdated date</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Loan Duration</label>
              <select
                value={issueDays}
                onChange={e => setIssueDays(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white font-medium"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days (Standard)</option>
                <option value="30">30 Days (Semester)</option>
              </select>
            </div>
          </div>

          {/* Real-time Backdate / Due Date calculation preview */}
          {(() => {
            const iss = new Date(issueDate || todayStr);
            const due = new Date(iss);
            due.setDate(due.getDate() + (parseInt(issueDays) || 14));
            const dueStr = due.toISOString().split('T')[0];
            const msDiff = new Date(todayStr).getTime() - due.getTime();
            const lateDays = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
            const estFine = lateDays * 5;

            return (
              <div className={`p-3 rounded-xl border text-xs ${lateDays > 0 ? 'bg-amber-50/90 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="flex justify-between items-center font-semibold">
                  <span>Computed Due Date:</span>
                  <span className="font-mono">{dueStr}</span>
                </div>
                {lateDays > 0 ? (
                  <div className="mt-1.5 flex justify-between items-center text-amber-800 font-bold">
                    <span>⚠️ Backdated Loan Status:</span>
                    <span>{lateDays} days overdue • Fine: ₹{estFine}.00</span>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                    ✓ Active loan will be within validity period.
                  </div>
                )}
              </div>
            );
          })()}

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
    </div>
  );
};

export default LibrarianBooksPage;
