# University ERP — Supabase Cloud Database Integration & Triggers Guide

This guide details the Supabase PostgreSQL database architecture, cross-module synchronization triggers, procedures, and multi-student data setup.

---

## 1. Quick Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │            Supabase Cloud Database           │
                      │               (PostgreSQL 15+)               │
                      └───────┬──────────────────────────────▲───────┘
                              │ Realtime Subscriptions       │ REST / RPC
                              │ & Triggers                   │ Queries
                              ▼                              │
┌────────────────────────────────────────────────────────────┴──────────────────────┐
│                            React 18 + Vite Web Portal                             │
│                           (http://localhost:3000)                                 │
├───────────────────────────────┬───────────────────────────┬───────────────────────┤
│        Student Portal         │      Faculty Workspace    │      Staff Portals    │
│  - Unique SGPA / CGPA         │  - Mark Attendance        │  - TNP Company & Job  │
│  - Real-time Attendance %     │    (Triggers Summary)     │    Drive Shortlist    │
│  - Fee Balance & Receipts     │  - Grade Submissions      │  - Finance Fee Desk   │
│  - Library Circulation        │    (Triggers SGPA & CGPA) │  - Library Inventory  │
│  - Placement Drives & Offers  │  - Leave & Payroll        │    (Triggers Fines)   │
└───────────────────────────────┴───────────────────────────┴───────────────────────┘
```

---

## 2. PostgreSQL Triggers & Stored Procedures Implemented

All 5 triggers are defined in [`supabase/schema.sql`](../supabase/schema.sql):

### 1. `trg_attendance_record_sync` (`fn_update_attendance_summary()`)
* **Trigger Event**: `AFTER INSERT OR UPDATE OR DELETE ON attendance_records`
* **Cross-Module Effect**:
  1. Computes total lectures, attended lectures, and absent lectures for that student and subject.
  2. Upserts into `attendance_summaries`.
  3. Automatically updates `students.attendance_pct` across all subjects.
  4. Reflects instantly on the Student Dashboard attendance donut chart and alerts widget.

### 2. `trg_marks_calc_results` (`fn_recalculate_student_result()`)
* **Trigger Event**: `BEFORE INSERT OR UPDATE ON marks`
* **Cross-Module Effect**:
  1. Translates numerical score into grade letters (`O`, `A+`, `A`, `B+`, `B`, `C`, `F`) and grade points (`10` to `0`).
  2. Calculates weighted semester SGPA: `SUM(credits * grade_point) / SUM(credits)`.
  3. Upserts into `results` table with Pass/Fail status.
  4. Updates the student's cumulative `students.cgpa` and `students.sgpa`.

### 3. `trg_fee_payment_sync` (`fn_fee_payment_update()`)
* **Trigger Event**: `AFTER INSERT OR UPDATE ON fee_payments`
* **Cross-Module Effect**:
  1. Sums all successful payments for the student's term invoice.
  2. Computes `due_amount = total_amount - paid_amount`.
  3. Updates status to `'Paid'` (if due = 0) or `'Partially Paid'`.
  4. Updates `students.fees_due` balance, which immediately reflects on the Student and Finance dashboards.

### 4. `trg_book_circulation_sync` (`fn_book_circulation()`)
* **Trigger Event**: `BEFORE INSERT OR UPDATE ON book_issues`
* **Cross-Module Effect**:
  1. When status changes to `'Issued'`: Decrements `books.available_copies` by 1.
  2. When status changes to `'Returned'`: Increments `books.available_copies` by 1.
  3. If returned past `due_date`: Automatically computes late fine (`₹5 per day late`) and inserts an unpaid penalty record into `finance_fines`.

### 5. `trg_placement_selection_sync` (`fn_placement_selection()`)
* **Trigger Event**: `AFTER UPDATE OF status ON placement_applications`
* **Cross-Module Effect**:
  1. When an application is marked `'Selected'` or `'Placed'`, automatically inserts a verified offer record into `placements`.
  2. Updates `students.placement_status = 'Placed'`, immediately updating the student's profile and the TNP Cell's placed student statistics.

---

## 3. Verified Multi-Student Demo Accounts (Distinct Data)

Every student account has unique, individual academic records, attendance percentages, fee balances, library circulation, and placement statuses:

| Roll No | Student Name | Branch | SGPA / CGPA | Attendance % | Fee Status | Library Loans | Placement Status |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **`31001`** | **Kavya Mohan Kulkarni** | Computer Science | `8.45` / `8.20` | **92.5%** | **₹0 Due (Full Paid)** | 1 Active (*CLRS 3rd Ed.*) | **Shortlisted (Accenture)** |
| **`31002`** | **Siddharth Eknath Nale** | Computer Science | `6.82` / `7.15` | **73.0% (Warning Alert)** | **₹33,000 Due (Partial)** | 1 Overdue (*DBMS 6th Ed.*, ₹15 Fine) | **Applied (TCS)** |
| **`31003`** | **Om Pankaj Tiwari** | Computer Science | `7.60` / `7.55` | **88.0%** | **₹0 Due (Full Paid)** | 0 Loans (Clean) | **Applied (Cognizant)** |
| **`31004`** | **Rohan Anand Iyer** | Computer Science | `9.40` / `9.18` | **96.0% (Topper)** | **₹0 Due (Full Paid)** | 1 Active (*Computer Networks*) | **Placed (Amazon AWS - 18.5 LPA)** |
| **`32001`** | **Viraj Pankaj Kale** | Electronics & Telecom | `7.10` / `7.05` | **81.0%** | **₹20,000 Due (Partial)** | 0 Loans | **Shortlisted (Texas Instruments)** |
| **`35001`** | **Nidhi Vishwas Dhumal** | AI & Data Science | `8.85` / `8.70` | **89.5%** | **₹0 Due (Full Paid)** | 1 Active (*AI: Modern Approach*) | **Applied (Nvidia)** |

---

## 4. How to Connect Your Supabase Cloud Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose a name (e.g. `college-erp`), set a secure database password, and select your region.
3. Open the **SQL Editor** tab from the left sidebar.
4. Click **New query**, paste the entire contents of [`supabase/schema.sql`](../supabase/schema.sql), and click **Run**.
5. Once execution succeeds, go to **Project Settings** -> **API**.
6. Copy the **Project URL** and the **anon/public API Key**.
7. Open `.env` in the root folder and paste them:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
8. Start the website:
   ```powershell
   npm run dev
   ```
9. Open `http://localhost:3000` in your browser. All data, triggers, procedures, and accounts will operate seamlessly!
