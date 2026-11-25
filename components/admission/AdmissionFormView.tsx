"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitAdmissionForm } from "@/app/actions/enrollment";

export interface CourseOption {
  id: string;
  title: string;
  tagline?: string;
  badge_text?: string;
  theme_color?: string;
  price?: number;
}

export interface UserProfileSummary {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  guardian_name?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  city?: string | null;
}

export interface AdmissionFormViewProps {
  courses: CourseOption[];
  initialCourseId?: string;
  userProfile?: UserProfileSummary | null;
}

interface BankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branchName?: string;
  colorScheme: string;
  icon: string;
}

const BANK_ACCOUNTS: BankDetails[] = [
  {
    bankName: "Meezan Bank Ltd",
    accountTitle: "Lofty Islamic Academy",
    accountNumber: "01020304050607",
    iban: "PK12MEZN0001020304050607",
    branchName: "Gulshan-e-Iqbal Branch, Karachi",
    colorScheme: "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50/70 text-emerald-950",
    icon: "🏦",
  },
  {
    bankName: "EasyPaisa",
    accountTitle: "Lofty Education",
    accountNumber: "0300-1234567",
    branchName: "Direct Mobile Wallet",
    colorScheme: "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50/70 text-green-950",
    icon: "📱",
  },
  {
    bankName: "JazzCash",
    accountTitle: "Lofty Academy",
    accountNumber: "0301-7654321",
    branchName: "Direct Mobile Wallet",
    colorScheme: "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/70 text-amber-950",
    icon: "⚡",
  },
];

export function AdmissionFormView({
  courses,
  initialCourseId,
  userProfile,
}: AdmissionFormViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || (courses.length > 0 ? courses[0].id : "")
  );

  // Form Fields - Prefilled with userProfile if available
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [guardianName, setGuardianName] = useState(userProfile?.guardian_name || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    userProfile?.whatsapp_number || userProfile?.phone_number || ""
  );
  const [email, setEmail] = useState(userProfile?.email || "");
  const [city, setCity] = useState(userProfile?.city || "");
  const [country, setCountry] = useState("Pakistan");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  // Payment Fields
  const [paymentMethod, setPaymentMethod] = useState("Meezan Bank");
  const [senderAccountName, setSenderAccountName] = useState("");
  const [senderAccountNumber, setSenderAccountNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [studentNotes, setStudentNotes] = useState("");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    enrollmentId: string;
    studentName: string;
    courseTitle: string;
  } | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMessage("براہ کرم تصویر (PNG, JPG, WebP) یا PDF فائل اپلوڈ کریں۔");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("فائل کا سائز 5MB سے کم ہونا چاہیے۔");
      return;
    }

    setReceiptFileName(file.name);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedCourseId) {
      setErrorMessage("براہ کرم کورس کا انتخاب کریں!");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("طالب علم کا مکمل نام درج کریں!");
      return;
    }
    if (!guardianName.trim()) {
      setErrorMessage("والد یا سرپرست کا نام درج کریں!");
      return;
    }
    if (!whatsappNumber.trim()) {
      setErrorMessage("واٹس ایپ نمبر درج کریں تاکہ ہم آپ سے رابطہ کر سکیں!");
      return;
    }
    if (!transactionId.trim()) {
      setErrorMessage("فیس ٹرانزیکشن آئی ڈی (Transaction ID / Ref No) درج کریں!");
      return;
    }
    if (!receiptBase64) {
      setErrorMessage("براہ کرم فیس کی رسید / سکرین شاٹ اپلوڈ کریں!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitAdmissionForm({
        courseId: selectedCourseId,
        fullName: fullName.trim(),
        guardianName: guardianName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || "Pakistan",
        gender,
        dateOfBirth: dateOfBirth || undefined,
        educationLevel: educationLevel.trim() || undefined,
        paymentMethod,
        senderAccountName: senderAccountName.trim() || undefined,
        senderAccountNumber: senderAccountNumber.trim() || undefined,
        transactionId: transactionId.trim(),
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
        paymentDate,
        receiptUrl: receiptBase64,
        studentNotes: studentNotes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "داخلہ فارم جمع کرانے میں غلطی پیش آئی۔");
      } else {
        setSubmissionSuccess({
          enrollmentId: res.enrollmentId || "APP-" + Date.now().toString().slice(-6),
          studentName: fullName,
          courseTitle: selectedCourse?.title || "منتخب کورس",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submissionSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-b from-amber-50 via-white to-emerald-50 rounded-3xl p-8 sm:p-12 text-center border-4 border-amber-300 shadow-chunky-amber animate-bounce-soft relative overflow-hidden">
          {/* Confetti / Sparkle elements */}
          <div className="absolute top-4 left-6 text-3xl animate-float-slow">🎉</div>
          <div className="absolute top-6 right-8 text-3xl animate-float-slow" style={{ animationDelay: "1s" }}>🌟</div>
          <div className="absolute bottom-6 left-8 text-3xl animate-float-slow" style={{ animationDelay: "1.5s" }}>🎒</div>
          <div className="absolute bottom-4 right-6 text-3xl animate-float-slow" style={{ animationDelay: "0.5s" }}>🚀</div>

          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-tr from-emerald-400 to-teal-300 rounded-full flex items-center justify-center shadow-lg border-4 border-white text-4xl">
            ✨
          </div>

          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-black mb-3">
            مبارک ہو! فارم کامیابی سے موصول ہو گیا ہے
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 font-display">
            خوش آمدید، {submissionSuccess.studentName}! 🎈
          </h1>

          <p className="text-base sm:text-lg text-gray-700 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
            آپ کی داخلہ درخواست برائے <strong className="text-amber-800 font-black">{submissionSuccess.courseTitle}</strong> اور فیس کی رسید ایڈمن کو تصدیق کے لیے بھیج دی گئی ہے۔
          </p>

          {/* Ticket Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-amber-300 max-w-md mx-auto mb-8 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-1">
              درخواست نمبر (Application Reference ID)
            </div>
            <div className="text-2xl font-mono font-black text-amber-900 tracking-wider">
              {submissionSuccess.enrollmentId}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ایڈمن تصدیق کے بعد واٹس ایپ پر اطلاع دی جائے گی
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black text-base shadow-chunky-amber hover:opacity-95 transition-all transform hover:-translate-y-0.5"
            >
              🏠 ہوم پیج پر جائیں
            </Link>
            <Link
              href={`/courses/${selectedCourseId}`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border-2 border-purple-300 text-purple-900 font-black text-base shadow-chunky-purple hover:bg-purple-50 transition-all transform hover:-translate-y-0.5"
            >
              🎬 مفت تعارفی ویڈیو دیکھیں
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Playful Header */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs sm:text-sm font-black mb-4 shadow-sm animate-pulse-glow">
          <span>✨</span>
          <span>آن لائن داخلہ فارم — روشن اور جدید مستقبل کی شروعات</span>
          <span>🎓</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight font-display">
          آن لائن داخلہ و فیس رجسٹریشن 🚀
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
          بچوں کی دینی و دنیاوی تعلیم و تربیت کے لیے مکمل اور آسان داخلہ فارم۔ نیچے تمام تفصیلات درج کریں اور فیس کی رسید اپلوڈ کریں۔
        </p>

        {/* Decorative Emojis */}
        <div className="hidden sm:block absolute -top-2 left-6 text-4xl animate-float-slow">🎨</div>
        <div className="hidden sm:block absolute top-0 right-6 text-4xl animate-float-slow" style={{ animationDelay: "1.2s" }}>📚</div>
      </div>

      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 font-bold flex items-center gap-3 animate-shake">
          <span className="text-2xl">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ======================================================== */}
        {/* SECTION 1: COURSE SELECTION (Soft Pastel Sky Background) */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-br from-sky-50 via-cyan-50/70 to-blue-50/60 rounded-3xl p-6 sm:p-8 border-2 border-sky-200 shadow-chunky-sky transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-400 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
              1
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-sky-950 flex items-center gap-2">
                <span>کورس کا انتخاب کریں</span>
                <span className="text-2xl">📖</span>
              </h2>
              <p className="text-xs sm:text-sm text-sky-800/80 font-medium">
                جس کورس میں داخلہ لینا چاہتے ہیں اس پر کلک کریں
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const isSelected = selectedCourseId === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all transform hover:-translate-y-1 relative ${
                    isSelected
                      ? "bg-white border-sky-400 shadow-chunky-sky ring-2 ring-sky-300/40"
                      : "bg-white/80 border-sky-100 hover:border-sky-200 hover:bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <span>✓</span>
                      <span>منتخب شدہ</span>
                    </div>
                  )}
                  <div className="text-2xl mb-2">⭐</div>
                  <h3 className="font-black text-gray-900 text-base sm:text-lg mb-1 leading-snug">
                    {course.title}
                  </h3>
                  {course.tagline && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {course.tagline}
                    </p>
                  )}
                  {course.price && (
                    <div className="inline-block px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 font-extrabold text-xs">
                      ماہانہ فیس: Rs. {course.price.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: STUDENT PROFILE (Soft Pastel Lavender Background) */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-br from-purple-50 via-pink-50/70 to-fuchsia-50/60 rounded-3xl p-6 sm:p-8 border-2 border-purple-200 shadow-chunky-purple transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
              2
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-purple-950 flex items-center gap-2">
                <span>طالب علم اور سرپرست کی معلومات</span>
                <span className="text-2xl">🎒</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-800/80 font-medium">
                بچے اور اس کے والدین / سرپرست کے درست کوائف درج کریں
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Student Full Name */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                طالب علم کا نام (Student Full Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">👤</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثلاً: محمد احمد خان"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Guardian Name */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                والد / سرپرست کا نام (Guardian Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">👨‍👩‍👧</span>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="مثلاً: فاروق احمد خان"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                واٹس ایپ نمبر (WhatsApp Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">💬</span>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="مثلاً: 03001234567"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
              <p className="text-[11px] text-purple-700 mt-1 font-medium">
                کلاسز کے لنکس اور تصدیق اسی واٹس ایپ نمبر پر ارسال کیے جائیں گے۔
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                ای میل ایڈریس (Email Address - اختیاری)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                جنس (Gender)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-2.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    gender === "male"
                      ? "bg-purple-600 text-white border-purple-600 shadow-md"
                      : "bg-white text-gray-700 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  <span>👦</span>
                  <span>لڑکا (Boy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-2.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    gender === "female"
                      ? "bg-pink-500 text-white border-pink-500 shadow-md"
                      : "bg-white text-gray-700 border-purple-200 hover:bg-pink-50"
                  }`}
                >
                  <span>👧</span>
                  <span>لڑکی (Girl)</span>
                </button>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                تاریخ پیدائش (Date of Birth)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">🎂</span>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                شہر (City)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">🏙️</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثلاً: کراچی / لاہور / اسلام آباد"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            {/* School / Class Level */}
            <div>
              <label className="block text-sm font-black text-purple-950 mb-1.5">
                موجودہ اسکول کلاس (School Grade / Education)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">🏫</span>
                <input
                  type="text"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="مثلاً: Grade 3, Class 5, یا Montessori"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: BANK DETAILS FOR PAYMENT (Soft Pastel Mint)  */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-green-50/60 rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-chunky-green transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-400 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
              3
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950 flex items-center gap-2">
                <span>اکیڈمی کے آفیشل بینک اکاؤنٹس</span>
                <span className="text-2xl">💳</span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/80 font-medium">
                فیس کی ادائیگی نیچے دیے گئے کسی بھی اکاؤنٹ میں کریں اور رسید محفوظ کریں
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {BANK_ACCOUNTS.map((bank) => (
              <div
                key={bank.bankName}
                className={`rounded-2xl p-5 border-2 ${bank.colorScheme} shadow-sm relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{bank.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
                      آفیشل اکاؤنٹ
                    </span>
                  </div>
                  <h4 className="font-black text-lg text-gray-900 mb-0.5">
                    {bank.bankName}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3 font-semibold">
                    ٹائٹل: {bank.accountTitle}
                  </p>

                  <div className="bg-white/95 rounded-xl p-3 border border-emerald-200/80 mb-2 font-mono">
                    <div className="text-[10px] text-gray-500 uppercase font-sans font-bold">
                      اکاؤنٹ نمبر
                    </div>
                    <div className="text-base font-black text-gray-900 tracking-wider">
                      {bank.accountNumber}
                    </div>
                  </div>

                  {bank.iban && (
                    <div className="bg-white/95 rounded-xl p-3 border border-emerald-200/80 mb-2 font-mono">
                      <div className="text-[10px] text-gray-500 uppercase font-sans font-bold">
                        IBAN نمبر
                      </div>
                      <div className="text-xs font-bold text-gray-800 break-all">
                        {bank.iban}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      bank.iban || bank.accountNumber,
                      bank.bankName
                    )
                  }
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-black text-xs hover:bg-emerald-100/50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>📋</span>
                  <span>
                    {copiedBank === bank.bankName
                      ? "کاپی ہو گیا! ✓"
                      : "اکاؤنٹ نمبر کاپی کریں"}
                  </span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <span>💡</span>
            <span>
              فیس ادا کرنے کے بعد رسید کا سکرین شاٹ لے لیں یا بینک ایپ سے رسید ڈاؤنلوڈ کر لیں، تاکہ اگلے سیکشن میں اپلوڈ کر سکیں۔
            </span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 4: PAYMENT PROOF & RECEIPT (Soft Pastel Amber)   */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-br from-amber-50 via-yellow-50/70 to-orange-50/60 rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-chunky-amber transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
              4
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
                <span>فیس ادائیگی کی تصدیق و رسید</span>
                <span className="text-2xl">🧾</span>
              </h2>
              <p className="text-xs sm:text-sm text-amber-800/80 font-medium">
                ٹرانزیکشن کا نمبر درج کریں اور رسید اپلوڈ کریں تاکہ فوری منظوری ہو سکے
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {/* Payment Method / Bank */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                کس بینک / ایپ کے ذریعے فیس ادا کی؟ <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-bold transition-all shadow-sm"
              >
                <option value="Meezan Bank">Meezan Bank</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="HBL / Other Bank">HBL یا کوئی دوسرا بینک</option>
                <option value="Cash / Manual">کیش / بالمشافہ جمع</option>
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                ٹرانزیکشن آئی ڈی (TID / Ref No) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg">🔢</span>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="مثلاً: 12345678901 یا TRX-987"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-mono font-bold transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Sender Account Name */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                بھیجنے والے کا اکاؤنٹ نام (Sender Name)
              </label>
              <input
                type="text"
                value={senderAccountName}
                onChange={(e) => setSenderAccountName(e.target.value)}
                placeholder="جس اکاؤنٹ سے فیس ٹرانسفر ہوئی اس کا ٹائٹل"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
              />
            </div>

            {/* Sender Account / Mobile Number */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                بھیجنے والے کا اکاؤنٹ / موبائل نمبر (Sender No)
              </label>
              <input
                type="text"
                value={senderAccountNumber}
                onChange={(e) => setSenderAccountNumber(e.target.value)}
                placeholder="مثلاً: 03001234567 یا اکاؤنٹ نمبر"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
              />
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                ادا کی گئی رقم (Amount Paid - PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-gray-400">Rs</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="مثلاً: 3000"
                  className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-bold transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-black text-amber-950 mb-1.5">
                ادائیگی کی تاریخ (Payment Date)
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Receipt File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-black text-amber-950 mb-2">
              فیس کی رسید یا اسکرین شاٹ اپلوڈ کریں <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-amber-300 rounded-3xl p-6 bg-white/90 text-center hover:border-amber-400 transition-all relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {receiptBase64 ? (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 relative rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md mb-3">
                    <Image
                      src={receiptBase64}
                      alt="Receipt Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-emerald-700 font-black text-sm flex items-center gap-1.5">
                    <span>✓</span>
                    <span>رسید منتخب ہو گئی: {receiptFileName || "receipt.jpg"}</span>
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    تبدیل کرنے کے لیے دوبارہ کلک کریں
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mb-3 shadow-inner">
                    📤
                  </div>
                  <p className="font-black text-gray-900 text-base mb-1">
                    یہاں کلک کر کے رسید کی تصویر اپلوڈ کریں
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG یا PDF (زیادہ سے زیادہ 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Special Notes / Comments */}
          <div>
            <label className="block text-sm font-black text-amber-950 mb-1.5">
              کوئی خاص پیغام یا ہدایت (Optional Notes)
            </label>
            <textarea
              rows={2}
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="اگر کلاس کے اوقات یا کسی بات کی وضاحت کرنی ہو تو یہاں لکھ سکتے ہیں..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 outline-none text-gray-800 font-medium transition-all shadow-sm"
            />
          </div>
        </section>

        {/* ======================================================== */}
        {/* SUBMIT BUTTON WITH CHUNKY 3D KID-FRIENDLY EFFECT         */}
        {/* ======================================================== */}
        <div className="pt-4 text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[320px] px-10 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-amber-950 font-black text-xl shadow-chunky-amber hover:opacity-95 transition-all transform hover:-translate-y-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto border-2 border-amber-300"
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></span>
                <span>فارم جمع ہو رہا ہے...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🚀</span>
                <span>داخلہ فارم جمع کرائیں (Submit Admission)</span>
                <span className="text-2xl">✨</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3 font-medium">
            🔒 آپ کی معلومات محفوظ ہیں اور براہ راست اکیڈمی انتظامیہ کو موصول ہوں گی۔
          </p>
        </div>
      </form>
    </div>
  );
}

export default AdmissionFormView;
