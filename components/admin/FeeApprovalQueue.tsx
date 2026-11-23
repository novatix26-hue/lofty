'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  Briefcase,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { approveEnrollment, rejectEnrollment } from '@/app/actions/enrollment';
import type { EnrollmentStatus } from '@/types';

export interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  receipt_url: string;
  transaction_id: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  courses: {
    id: string;
    title: string;
    category: 'kids' | 'adults';
    price: number;
    thumbnail_url: string | null;
  } | null;
}

interface FeeApprovalQueueProps {
  initialEnrollments: EnrollmentRecord[];
}

export function FeeApprovalQueue({ initialEnrollments }: FeeApprovalQueueProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>(initialEnrollments);
  const [selectedStatus, setSelectedStatus] = useState<'all' | EnrollmentStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Receipt Lightbox State
  const [selectedReceipt, setSelectedReceipt] = useState<EnrollmentRecord | null>(null);

  // Reject Reason Modal State
  const [rejectModalItem, setRejectModalItem] = useState<EnrollmentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status counts
  const counts = {
    all: enrollments.length,
    pending: enrollments.filter((e) => e.status === 'pending').length,
    active: enrollments.filter((e) => e.status === 'active').length,
    rejected: enrollments.filter((e) => e.status === 'rejected').length,
  };

  // Copy TxID
  function handleCopyTxId(txId: string) {
    navigator.clipboard.writeText(txId);
    setCopiedTxId(txId);
    setTimeout(() => setCopiedTxId(null), 2000);
  }

  // Handle Approve Action
  function handleApprove(enrollmentId: string) {
    setActionError(null);
    startTransition(async () => {
      const res = await approveEnrollment(enrollmentId);
      if (res.success) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId
              ? {
                  ...e,
                  status: 'active',
                  approved_at: new Date().toISOString(),
                }
              : e
          )
        );
        if (selectedReceipt?.id === enrollmentId) {
          setSelectedReceipt(null);
        }
      } else {
        setActionError(res.error || 'Failed to approve enrollment');
      }
    });
  }

  // Handle Reject Action
  function handleConfirmReject() {
    if (!rejectModalItem) return;
    setActionError(null);

    const enrollmentId = rejectModalItem.id;
    const reason = rejectReason.trim() || undefined;

    startTransition(async () => {
      const res = await rejectEnrollment(enrollmentId, reason);
      if (res.success) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId
              ? {
                  ...e,
                  status: 'rejected',
                  admin_notes: reason || null,
                  reviewed_at: new Date().toISOString(),
                }
              : e
          )
        );
        setRejectModalItem(null);
        setRejectReason('');
        if (selectedReceipt?.id === enrollmentId) {
          setSelectedReceipt(null);
        }
      } else {
        setActionError(res.error || 'Failed to reject enrollment');
      }
    });
  }

  // Filtered List
  const filteredEnrollments = enrollments.filter((enr) => {
    const matchesStatus =
      selectedStatus === 'all' ? true : enr.status === selectedStatus;

    const studentName = enr.profiles?.full_name?.toLowerCase() || '';
    const studentEmail = enr.profiles?.email?.toLowerCase() || '';
    const courseTitle = enr.courses?.title?.toLowerCase() || '';
    const txId = enr.transaction_id?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      courseTitle.includes(q) ||
      txId.includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fee Verification Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review student payment receipts and transaction IDs. Approving an enrollment immediately unlocks Day 1 lesson.
          </p>
        </div>

        {counts.pending > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 border border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>{counts.pending} Approvals Requiring Review</span>
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedStatus('pending')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending ({counts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('active')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved ({counts.active})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('rejected')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === 'rejected'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected ({counts.rejected})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, course, TxID..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Student</th>
                <th className="px-5 py-3.5 font-semibold">Course & Category</th>
                <th className="px-5 py-3.5 font-semibold">Transaction ID</th>
                <th className="px-5 py-3.5 font-semibold">Receipt</th>
                <th className="px-5 py-3.5 font-semibold">Submitted Date</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEnrollments.length > 0 ? (
                filteredEnrollments.map((enr) => {
                  const studentName = enr.profiles?.full_name || 'Student';
                  const studentEmail = enr.profiles?.email || 'N/A';
                  const isPendingStatus = enr.status === 'pending';
                  const isApproved = enr.status === 'active';
                  const isRejected = enr.status === 'rejected';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{studentName}</p>
                            <p className="text-[11px] text-slate-500">{studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course Info */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{enr.courses?.title || 'Unknown Course'}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                                enr.courses?.category === 'kids'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {enr.courses?.category === 'kids' ? (
                                <>
                                  <Sparkles className="h-2.5 w-2.5" />
                                  <span>Kids</span>
                                </>
                              ) : (
                                <>
                                  <Briefcase className="h-2.5 w-2.5" />
                                  <span>Adults</span>
                                </>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              PKR {Number(enr.courses?.price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Transaction ID with Copy */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-800">
                            {enr.transaction_id}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyTxId(enr.transaction_id)}
                            title="Copy Transaction ID"
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                          >
                            {copiedTxId === enr.transaction_id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Receipt View Button */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(enr)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          <span>View</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                        {new Date(enr.created_at).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isPendingStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Approved</span>
                          </span>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              <XCircle className="h-3 w-3" />
                              <span>Rejected</span>
                            </span>
                            {enr.admin_notes && (
                              <p className="mt-1 text-[10px] text-red-600 max-w-[160px] truncate" title={enr.admin_notes}>
                                Note: {enr.admin_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingStatus && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleApprove(enr.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setRejectModalItem(enr);
                                  setRejectReason('');
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              Day 1 Unlocked
                            </span>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => handleApprove(enr.id)}
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Reconsider & Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">No enrollment records found</p>
                    <p className="text-xs text-slate-400">
                      {searchQuery
                        ? 'Try modifying your search criteria.'
                        : `No enrollments matching status: "${selectedStatus}".`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RECEIPT LIGHTBOX / MODAL --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Payment Receipt Verification
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReceipt.profiles?.full_name} • {selectedReceipt.courses?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Image Display */}
            <div className="relative mt-4 aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center">
              {selectedReceipt.receipt_url ? (
                <Image
                  src={selectedReceipt.receipt_url}
                  alt="Payment receipt proof"
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <FileText className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-xs">No receipt image attached</p>
                </div>
              )}
            </div>

            {/* Transaction Details Card */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Transaction ID:</span>
                <div className="flex items-center gap-1">
                  <code className="font-mono font-bold text-slate-900">
                    {selectedReceipt.transaction_id}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyTxId(selectedReceipt.transaction_id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    {copiedTxId === selectedReceipt.transaction_id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Course Fee:</span>
                <span className="font-bold text-slate-900">
                  PKR {Number(selectedReceipt.courses?.price || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Submission Date:</span>
                <span className="text-slate-700" suppressHydrationWarning>
                  {new Date(selectedReceipt.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <a
                href={selectedReceipt.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <span>Open original image</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <div className="flex items-center gap-2">
                {selectedReceipt.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setRejectModalItem(selectedReceipt);
                        setRejectReason('');
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleApprove(selectedReceipt.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Approve & Unlock Day 1</span>
                    </button>
                  </>
                )}
                {selectedReceipt.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(null)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECT REASON MODAL --- */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Reject Enrollment
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Rejecting enrollment for student{' '}
                <strong className="text-slate-900">
                  {rejectModalItem.profiles?.full_name}
                </strong>{' '}
                in <em>{rejectModalItem.courses?.title}</em>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Reason / Admin Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction ID was not found in bank statement, or receipt is unreadable."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmReject}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
