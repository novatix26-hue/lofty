'use client';

import { useState, useTransition, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  Briefcase,
  Building2,
  Smartphone,
  CreditCard,
  Upload,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { submitAdmissionForm, type AdmissionInput } from '@/app/actions/enrollment';
import { uploadPaymentReceipt } from '@/app/actions/receipt';
import type { Course, Profile } from '@/types';

interface AdmissionFormViewProps {
  courses: Course[];
  initialCourseId?: string;
  userProfile?: Profile | null;
}

export function AdmissionFormView({
  courses,
  initialCourseId,
  userProfile,
}: AdmissionFormViewProps) {
  const router = useRouter();
  const formId = useId();

  // Selected Course
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId && courses.some((c) => c.id === initialCourseId)
      ? initialCourseId
      : courses[0]?.id || ''
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Personal Info Form State
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [guardianName, setGuardianName] = useState('');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [whatsappNumber, setWhatsappNumber] = useState(userProfile?.phone || '');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [educationLevel, setEducationLevel] = useState('Intermediate / A-Levels');

  // Payment Details Form State
  const [paymentMethod, setPaymentMethod] = useState('Meezan Bank');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(Number(selectedCourse?.price || 1500));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentNotes, setStudentNotes] = useState('');

  // Receipt File Upload State
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  // Status & Transition State
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedAdmissionId, setSubmittedAdmissionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Copy helper
  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(label);
    setTimeout(() => setCopiedBankInfo(null), 2500);
  }

  // Handle course switch
  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    const crs = courses.find((c) => c.id === courseId);
    if (crs) {
      setAmountPaid(Number(crs.price));
    }
  }

  // Handle Receipt Upload
  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Receipt image file size must be less than 5MB.');
      return;
    }

    setUploadingReceipt(true);
    setFormError(null);
    setReceiptFileName(file.name);

    const fd = new FormData();
    fd.append('file', file);

    const res = await uploadPaymentReceipt(fd);
    setUploadingReceipt(false);

    if (res.success && res.url) {
      setReceiptUrl(res.url);
    } else {
      setFormError(res.error || 'Failed to upload receipt image. Please try again.');
      setReceiptFileName(null);
    }
  }

  // Handle Form Submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedCourse) {
      setFormError('Please select a course to continue.');
      return;
    }

    if (!fullName.trim()) {
      setFormError('Please enter the student full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!whatsappNumber.trim()) {
      setFormError('Please enter a valid WhatsApp / contact number.');
      return;
    }

    if (!city.trim()) {
      setFormError('Please enter the student city.');
      return;
    }

    if (!senderAccountName.trim()) {
      setFormError('Please provide the account holder name from which fee was sent.');
      return;
    }

    if (!senderAccountNumber.trim()) {
      setFormError('Please provide the sender account or mobile number.');
      return;
    }

    if (!transactionId.trim()) {
      setFormError('Please enter the bank Transaction ID / Reference Number (TRX ID).');
      return;
    }

    if (!receiptUrl.trim()) {
      setFormError('Please upload a screenshot or photo of your payment receipt.');
      return;
    }

    const payload: AdmissionInput = {
      courseId: selectedCourse.id,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      guardianName: guardianName.trim() || undefined,
      whatsappNumber: whatsappNumber.trim(),
      city: city.trim(),
      country: country.trim() || 'Pakistan',
      gender,
      dateOfBirth: dateOfBirth.trim() || undefined,
      educationLevel,
      paymentMethod,
      senderAccountName: senderAccountName.trim(),
      senderAccountNumber: senderAccountNumber.trim(),
      transactionId: transactionId.trim(),
      amountPaid: Number(amountPaid) || Number(selectedCourse.price),
      paymentDate,
      receiptUrl: receiptUrl.trim(),
      studentNotes: studentNotes.trim() || undefined,
    };

    startTransition(async () => {
      const res = await submitAdmissionForm(payload);
      if (res.success) {
        setIsSuccess(true);
        setSubmittedAdmissionId(res.enrollmentId || `ADM-${Date.now().toString().slice(-6)}`);
      } else {
        setFormError(res.error || 'Failed to submit admission application.');
      }
    });
  }

  // SUCCESS CONFIRMATION VIEW
  if (isSuccess) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border-3 border-emerald-300 bg-white p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md">
            <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Admission Form Received
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              درخواستِ داخلہ کامیابی سے جمع ہو گئی ہے! 🚀
            </h1>
            <p className="text-sm font-semibold text-slate-600 max-w-lg mx-auto">
              آپ کا آن لائن داخلہ فارم اور فیس کی رسید کامیابی سے ایڈمن ڈیپارٹمنٹ کو ارسال کر دی گئی ہے۔
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left space-y-3.5 text-xs text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Application Ref ID:</span>
              <span className="font-mono font-bold text-slate-900">{submittedAdmissionId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Student Name:</span>
              <span className="font-bold text-slate-900">{fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Applied Course:</span>
              <span className="font-bold text-sky-700">{selectedCourse?.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Transaction ID:</span>
              <span className="font-mono font-bold text-slate-900">{transactionId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Bank / Wallet:</span>
              <span className="font-bold text-slate-800">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Status:</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Pending Admin Approval (زیرِ تصدیق)
              </span>
            </div>
          </div>

          {/* Next Steps Guidance */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs font-semibold text-sky-900 text-left space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-sky-950">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>اگلا مرحلہ کیا ہے؟</span>
            </p>
            <p className="text-slate-700 leading-relaxed">
              ایڈمن ٹیم آپ کی فیس ٹرانزیکشن کی تصدیق کر کے اکاؤنٹ کو منظور (Approve) کرے گی۔ منظوری کے بعد آپ کے ڈیش بورڈ پر ڈے 1 کا لیسن فوری ان لاک ہو جائے گا۔
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="btn-3d-sky w-full sm:w-auto px-8 py-3 text-xs font-display font-black"
            >
              Go to Student Dashboard &rarr;
            </Link>
            <Link
              href="/courses"
              className="rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-xs font-display font-bold text-slate-700 w-full sm:w-auto transition-colors"
            >
              Explore More Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMISSION FORM
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border-3 border-amber-300 bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-extrabold tracking-wide uppercase">
            <GraduationCap className="h-4 w-4 text-amber-200" />
            <span>Official Student Admission Portal</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            آن لائن داخلہ اور فیس ویریفیکیشن فارم
          </h1>
          <p className="text-xs sm:text-sm font-medium text-white/90 leading-relaxed">
            طالب علم کی مکمل تفصیلات درج کریں، دیے گئے ادارے کے بینک اکاؤنٹس پر فیس ادا کر کے رسید اپلوڈ کریں۔ ایڈمن کی توثیق کے بعد لیسنز فوری شروع ہو جائیں گے۔
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}

        {/* SECTION 1: COURSE SELECTION */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-bold">
              1
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900">
                مطلوبہ کورس کا انتخاب (Course Selection)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                جس کورس میں داخلہ لینا چاہتے ہیں اسے منتخب کیجیے۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              const isKids = course.category === 'kids';

              return (
                <div
                  key={course.id}
                  onClick={() => handleCourseChange(course.id)}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/60 shadow-md ring-2 ring-sky-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {course.thumbnail_url && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isKids
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isKids ? <Sparkles className="h-2.5 w-2.5" /> : <Briefcase className="h-2.5 w-2.5" />}
                          <span>{isKids ? 'Kids (5–12)' : 'Adults LMS'}</span>
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-black text-slate-900 leading-snug">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">کورس فیس:</span>
                    <span className="font-display text-base font-black text-sky-700">
                      PKR {Number(course.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: STUDENT PERSONAL & ACADEMIC INFORMATION */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-bold">
              2
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900">
                طالب علم کی ذاتی و تعلیمی معلومات (Student Personal Profile)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                تمام معلومات درست اور مکمل درج کیجیے۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                طالب علم کا مکمل نام (Student Full Name) *
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Ali Khan"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Guardian Name */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                والد یا سرپرست کا نام (Father / Guardian Name)
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                ای میل ایڈریس (Email Address) *
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* WhatsApp / Phone */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                واٹس ایپ یا رابطہ نمبر (WhatsApp / Phone) *
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 font-mono"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                شہر (City) *
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                ملک (Country)
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pakistan"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                صنف (Gender)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border-2 border-slate-200 py-2.5 px-3.5 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 bg-white"
              >
                <option value="Male">مرد (Male)</option>
                <option value="Female">خاتون (Female)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth / Age */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                تاریخ پیدائش یا عمر (Date of Birth / Age)
              </label>
              <div className="relative mt-1.5">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="e.g. 2012-05-15 or 12 Years"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Education Level */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold text-slate-700">
                تعلیمی قابلیت یا موجودہ کلاس (Education Level / Current Grade)
              </label>
              <div className="relative mt-1.5">
                <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="e.g. Grade 4, Matric, Intermediate, Graduation, Job Professional"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: INSTITUTE OFFICIAL BANK ACCOUNTS */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 font-bold">
              3
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900">
                ادارے کے آفیشل بینک اکاؤنٹس (Institute Bank Accounts)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                فیس ادا کرنے کے لیے نیچے دیے گئے کسی بھی اکاؤنٹ میں رقم منتقل کیجیے۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meezan Bank */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display text-xs font-black text-emerald-950">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                  <span>Meezan Bank</span>
                </div>
                <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                  Bank Transfer
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="text-[11px] font-semibold text-slate-500">
                  Title: <strong className="text-slate-900">Lofty Education Services</strong>
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  Account: <strong className="font-mono text-slate-900">01020304050607</strong>
                </p>
                <div className="rounded-xl bg-white p-2 border border-emerald-100 font-mono text-[10px] text-slate-800 flex items-center justify-between">
                  <span className="truncate">PK65MEZN0001234567890123</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('PK65MEZN0001234567890123', 'meezan')}
                    title="Copy IBAN"
                    className="ml-2 text-emerald-700 hover:text-emerald-900"
                  >
                    {copiedBankInfo === 'meezan' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* EasyPaisa */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display text-xs font-black text-emerald-950">
                  <Smartphone className="h-4 w-4 text-emerald-700" />
                  <span>EasyPaisa</span>
                </div>
                <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                  Mobile Wallet
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="text-[11px] font-semibold text-slate-500">
                  Title: <strong className="text-slate-900">Lofty LMS Accounts</strong>
                </p>
                <div className="rounded-xl bg-white p-2 border border-emerald-100 font-mono text-xs text-slate-900 flex items-center justify-between font-bold">
                  <span>0345-7654321</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('03457654321', 'easypaisa')}
                    title="Copy Number"
                    className="ml-2 text-emerald-700 hover:text-emerald-900"
                  >
                    {copiedBankInfo === 'easypaisa' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* JazzCash */}
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4 space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display text-xs font-black text-amber-950">
                  <Smartphone className="h-4 w-4 text-amber-700" />
                  <span>JazzCash</span>
                </div>
                <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  Mobile Wallet
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="text-[11px] font-semibold text-slate-500">
                  Title: <strong className="text-slate-900">Lofty LMS Accounts</strong>
                </p>
                <div className="rounded-xl bg-white p-2 border border-amber-100 font-mono text-xs text-slate-900 flex items-center justify-between font-bold">
                  <span>0300-1234567</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('03001234567', 'jazzcash')}
                    title="Copy Number"
                    className="ml-2 text-amber-700 hover:text-amber-900"
                  >
                    {copiedBankInfo === 'jazzcash' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PAYMENT VERIFICATION & SENDER DETAILS */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold">
              4
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900">
                فیس ٹرانزیکشن و رسید کی تفصیلات (Payment & Transaction Entry)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                کس بینک سے اور کس اکاؤنٹ سے رقم ادا کی گئی، اس کی تفصیل درج کریں۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Payment Method / Bank Paid To */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                کس بینک یا والٹ میں فیس ادا کی؟ (Bank / Wallet Paid To) *
              </label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border-2 border-slate-200 py-2.5 px-3.5 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 bg-white"
              >
                <option value="Meezan Bank">Meezan Bank (میزان بینک)</option>
                <option value="EasyPaisa">EasyPaisa (ایزی پیسہ)</option>
                <option value="JazzCash">JazzCash (جاز کیش)</option>
                <option value="HBL">Habib Bank Limited (HBL)</option>
                <option value="Bank Alfalah">Bank Alfalah</option>
                <option value="Sadapay">Sadapay</option>
                <option value="Nayapay">Nayapay</option>
                <option value="Other Bank Transfer">Other Bank Transfer (دیگر بینک)</option>
              </select>
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                ادا کردہ فیس (Fee Amount Paid in PKR) *
              </label>
              <div className="relative mt-1.5">
                <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 font-mono"
                />
              </div>
            </div>

            {/* Sender Account Name */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                رقم بھیجنے والے کا نام / اکاؤنٹ ٹائٹل (Sender Account Title) *
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={senderAccountName}
                  onChange={(e) => setSenderAccountName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood / Self"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Sender Account / Phone Number */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                بھیجنے والے کا اکاؤنٹ یا موبائل نمبر (Sender Account / Mobile Number) *
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={senderAccountNumber}
                  onChange={(e) => setSenderAccountNumber(e.target.value)}
                  placeholder="e.g. 0300-1234567 or IBAN"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 font-mono"
                />
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                ٹرانزیکشن آئی ڈی / ریفرنس نمبر (Transaction ID / Ref No) *
              </label>
              <div className="relative mt-1.5">
                <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TRX9876543210 or 321589745"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-black text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 font-mono"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                ادائیگی کی تاریخ (Payment Date)
              </label>
              <div className="relative mt-1.5">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Receipt Upload File */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold text-slate-700">
                فیس کی رسید کا اسکرین شاٹ یا فوٹو (Payment Receipt Screenshot) *
              </label>
              <div className="mt-1.5">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 hover:border-sky-500 hover:bg-sky-50/40 transition-colors">
                  {uploadingReceipt ? (
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-slate-400" />
                  )}
                  <span className="mt-2 text-xs font-bold text-slate-800">
                    {uploadingReceipt
                      ? 'رسید اپلوڈ ہو رہی ہے، براہِ کرم انتظار کیجیے...'
                      : receiptUrl
                      ? 'رسید منتخب ہو چکی ہے (تبدیل کرنے کے لیے کلک کریں)'
                      : 'فیس کی رسید یا سلپ منتخب کریں'}
                  </span>
                  <span className="mt-1 text-[11px] font-semibold text-slate-400">
                    PNG, JPG, JPEG یا WEBP (زیادہ سے زیادہ 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingReceipt}
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Receipt Preview */}
              {receiptUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                    <Image
                      src={receiptUrl}
                      alt="Uploaded fee slip"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-950 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>رسید کامیابی سے منسلک ہو گئی!</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {receiptFileName || 'payment_receipt.jpg'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Student Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold text-slate-700">
                اضافی نوٹ یا پیغام (Optional Student Message / Notes)
              </label>
              <textarea
                rows={2}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="کوئی خاص ہدایت یا پیغام جو آپ ایڈمن کو بتانا چاہیں..."
                className="mt-1.5 w-full rounded-2xl border-2 border-slate-200 p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || uploadingReceipt || !receiptUrl}
            className="btn-3d-amber w-full py-4 text-base font-display font-black tracking-wide text-amber-950 flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span>درخواستِ داخلہ اور فیس فارم جمع کروائیں (Submit Admission Form)</span>
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
            🔒 آپ کی تمام معلومات اور رسیدیں محفوظ طریقے سے ایڈمن کنسول میں منتقل کی جاتی ہیں۔
          </p>
        </div>
      </form>
    </div>
  );
}
