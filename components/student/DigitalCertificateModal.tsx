'use client';

import React, { useRef } from 'react';
import { Award, Printer, X, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import type { Certificate } from '@/types';

interface DigitalCertificateModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
}

export function DigitalCertificateModal({
  certificate,
  isOpen,
  onClose,
}: DigitalCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const issueDateFormatted = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Print-specific style overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #lofty-printable-certificate,
          #lofty-printable-certificate * {
            visibility: visible;
          }
          #lofty-printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 2rem;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            z-index: 999999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl my-8 rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Controls Header */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Award className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-bold tracking-tight">
              Official Digital Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              aria-label="Close Certificate modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-4 sm:p-8 bg-slate-100/50 flex justify-center">
          <div
            id="lofty-printable-certificate"
            ref={printRef}
            className="w-full max-w-3xl bg-white rounded-xl shadow-lg border-8 border-amber-500/20 p-8 sm:p-12 relative overflow-hidden"
          >
            {/* Ornamental Inner Border */}
            <div className="absolute inset-3 border-2 border-amber-600/30 pointer-events-none rounded-lg" />
            <div className="absolute inset-5 border border-dashed border-amber-500/30 pointer-events-none rounded-sm" />

            {/* Background Watermark Emblem */}
            <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none text-slate-900">
              <Award className="w-96 h-96" />
            </div>

            {/* Certificate Header */}
            <div className="text-center relative z-10">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 border-2 border-amber-400 text-amber-600 mb-3 shadow-inner">
                <Award className="h-8 w-8" />
              </div>

              <div className="text-xs font-black tracking-widest text-amber-600 uppercase">
                Lofty Online Academy
              </div>
              <h1 className="mt-1 text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900">
                Certificate of Completion
              </h1>
              <p className="mt-1 text-xs text-slate-500 tracking-wide uppercase">
                This certifies that
              </p>
            </div>

            {/* Student Name */}
            <div className="text-center my-6 relative z-10">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-900 border-b-2 border-amber-400/80 inline-block px-8 pb-1">
                {certificate.student_name}
              </div>
            </div>

            {/* Fulfillment Statement */}
            <div className="text-center max-w-lg mx-auto relative z-10">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                has successfully fulfilled all course requirements, video lectures, and
                assessments with verified academic proficiency in:
              </p>
              <h2 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">
                {certificate.course_title}
              </h2>
            </div>

            {/* Footer Signatures and Verification */}
            <div className="mt-10 pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center relative z-10">
              {/* Date */}
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {issueDateFormatted}
                </p>
                <div className="mt-1 border-t border-slate-300 w-28 mx-auto" />
                <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-wider">
                  Date Issued
                </p>
              </div>

              {/* Official Seal */}
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full border-2 border-amber-500 bg-amber-50/50 flex flex-col items-center justify-center p-1 text-amber-700 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">
                    Verified
                  </span>
                </div>
                <span className="mt-1 text-[9px] font-mono text-slate-400">
                  {certificate.certificate_id}
                </span>
              </div>

              {/* Authorized Signatory */}
              <div>
                <div className="font-serif italic text-base text-slate-800">
                  Lofty Academic Board
                </div>
                <div className="mt-1 border-t border-slate-300 w-28 mx-auto" />
                <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-wider">
                  Academic Director
                </p>
              </div>
            </div>

            {/* Verification Footer Link */}
            <div className="mt-6 text-center text-[10px] text-slate-400 relative z-10">
              Verifiable Online LMS Credential • ID: <span className="font-mono text-slate-600 font-bold">{certificate.certificate_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
