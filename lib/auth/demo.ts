import { cookies } from 'next/headers';
import type { Profile, EnrollmentStatus } from '@/types';
import { SESSION_COOKIE_NAME, generateSessionToken } from '@/lib/auth/session';

export const DEMO_USER_COOKIE = 'lofty_demo_user';
export const DEMO_ENROLLMENTS_COOKIE = 'lofty_demo_enrollments';

export interface DemoEnrollmentItem {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  receipt_url: string;
  transaction_id: string;
  guardian_name?: string | null;
  whatsapp_number?: string | null;
  city?: string | null;
  country?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  education_level?: string | null;
  payment_method?: string | null;
  sender_account_name?: string | null;
  sender_account_number?: string | null;
  amount_paid?: number | null;
  payment_date?: string | null;
  student_notes?: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  courses?: {
    id: string;
    title: string;
    category: 'kids' | 'adults';
    price: number;
    thumbnail_url: string | null;
  } | null;
}

const DEFAULT_DEMO_ENROLLMENTS: DemoEnrollmentItem[] = [
  {
    id: 'demo-enr-1',
    user_id: 'demo-student-user-id',
    course_id: 'demo-kids-1',
    status: 'active',
    receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    transaction_id: 'TXN-KIDS-78652',
    guardian_name: 'Muhammad Tariq',
    whatsapp_number: '+92 301 7654321',
    city: 'Lahore',
    country: 'Pakistan',
    gender: 'Male',
    date_of_birth: '2016-04-12',
    education_level: 'Grade 3 (Primary)',
    payment_method: 'EasyPaisa',
    sender_account_name: 'Tariq Mehmood',
    sender_account_number: '0301-7654321',
    amount_paid: 1500,
    payment_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    student_notes: 'Excited to start English phonics adventure!',
    admin_notes: 'Fast-approved for demo testing',
    reviewed_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profiles: {
      id: 'demo-student-user-id',
      full_name: 'Ali Tariq (Junior Star)',
      email: 'student@example.com',
      avatar_url: null,
    },
    courses: {
      id: 'demo-kids-1',
      title: 'Fun English Phonics & Cartoon Adventures (Ages 5–12)',
      category: 'kids',
      price: 1500,
      thumbnail_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'demo-enr-2',
    user_id: 'demo-student-user-id',
    course_id: 'demo-adults-1',
    status: 'pending',
    receipt_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
    transaction_id: 'TXN-BOOTCAMP-99120',
    guardian_name: 'Abdul Rehman',
    whatsapp_number: '+92 321 9876543',
    city: 'Karachi',
    country: 'Pakistan',
    gender: 'Male',
    date_of_birth: '2001-09-18',
    education_level: 'BS Computer Science (In Progress)',
    payment_method: 'Meezan Bank',
    sender_account_name: 'Hamza Abdul Rehman',
    sender_account_number: 'PK65MEZN0009876543210',
    amount_paid: 3500,
    payment_date: new Date().toISOString().split('T')[0],
    student_notes: 'Paid via Meezan Mobile Banking App.',
    admin_notes: null,
    reviewed_at: null,
    approved_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    profiles: {
      id: 'demo-student-user-id',
      full_name: 'Hamza Rehman',
      email: 'hamza@example.com',
      avatar_url: null,
    },
    courses: {
      id: 'demo-adults-1',
      title: 'Modern Full-Stack Web Development Bootcamp',
      category: 'adults',
      price: 3500,
      thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    },
  },
];

export async function getDemoUser(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Profile;
  } catch {
    return null;
  }
}

export async function setDemoUser(profile: Profile): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = profile.active_session_token || generateSessionToken();

  cookieStore.set(DEMO_USER_COOKIE, encodeURIComponent(JSON.stringify(profile)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearDemoUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_USER_COOKIE);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createDemoStudent(input: {
  fullName: string;
  email: string;
  phone?: string;
}): Promise<Profile> {
  const sessionToken = generateSessionToken();
  const studentProfile: Profile = {
    id: `student-${Date.now().toString().slice(-6)}`,
    email: input.email.trim().toLowerCase(),
    full_name: input.fullName.trim() || 'Student',
    phone: input.phone?.trim() || null,
    guardian_name: null,
    city: null,
    role: 'student',
    avatar_url: null,
    active_session_token: sessionToken,
    active_session_id: sessionToken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDemoUser(studentProfile);
  return studentProfile;
}

export async function createDemoAdmin(): Promise<Profile> {
  const sessionToken = generateSessionToken();
  const adminProfile: Profile = {
    id: 'demo-admin-lofty',
    email: 'admin@lofty.edu',
    full_name: 'Lofty Administrator',
    phone: '+92 300 1234567',
    guardian_name: null,
    city: null,
    role: 'admin',
    avatar_url: null,
    active_session_token: sessionToken,
    active_session_id: sessionToken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDemoUser(adminProfile);
  return adminProfile;
}

export async function getDemoEnrollments(): Promise<DemoEnrollmentItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_ENROLLMENTS_COOKIE)?.value;
  if (!raw) {
    return DEFAULT_DEMO_ENROLLMENTS;
  }
  try {
    return JSON.parse(decodeURIComponent(raw)) as DemoEnrollmentItem[];
  } catch {
    return DEFAULT_DEMO_ENROLLMENTS;
  }
}

export async function saveDemoEnrollments(items: DemoEnrollmentItem[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_ENROLLMENTS_COOKIE, encodeURIComponent(JSON.stringify(items)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
