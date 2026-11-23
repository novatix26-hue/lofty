'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  BookOpen,
  Sparkles,
  Briefcase,
  Search,
  Upload,
  Loader2,
  Trash2,
  Edit,
  Globe,
  Lock,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';
import { createCourse, updateCourse, togglePublishCourse, deleteCourse, type CourseInput } from '@/app/actions/courses';
import { uploadCourseAsset } from '@/app/actions/upload';
import type { Course, CourseCategory } from '@/types';

interface CourseManagerProps {
  initialCourses: Course[];
}

export function CourseManager({ initialCourses }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState<'all' | CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [formData, setFormData] = useState<CourseInput>({
    title: '',
    description: '',
    category: 'kids',
    price: 0,
    thumbnail_url: '',
    is_published: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'kids',
      price: 5000,
      thumbnail_url: '',
      is_published: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(course: Course) {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      category: course.category,
      price: Number(course.price),
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_published,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  // Handle Thumbnail File Upload to Supabase Storage
  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    const fd = new FormData();
    fd.append('file', file);

    const res = await uploadCourseAsset(fd, 'thumbnails');
    setUploadingImage(false);

    if (res.success && res.url) {
      setFormData((prev) => ({ ...prev, thumbnail_url: res.url }));
    } else {
      setFormError(res.error || 'Failed to upload thumbnail');
    }
  }

  // Form Submit
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Course title is required');
      return;
    }

    startTransition(async () => {
      if (editingCourse) {
        const res = await updateCourse(editingCourse.id, formData);
        if (res.success && res.course) {
          setCourses((prev) =>
            prev.map((c) => (c.id === editingCourse.id ? (res.course as Course) : c))
          );
          setIsModalOpen(false);
        } else {
          setFormError(res.error || 'Failed to update course');
        }
      } else {
        const res = await createCourse(formData);
        if (res.success && res.course) {
          setCourses((prev) => [res.course as Course, ...prev]);
          setIsModalOpen(false);
        } else {
          setFormError(res.error || 'Failed to create course');
        }
      }
    });
  }

  // Toggle publish
  function handleTogglePublish(courseId: string, currentStatus: boolean) {
    startTransition(async () => {
      const res = await togglePublishCourse(courseId, !currentStatus);
      if (res.success) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, is_published: !currentStatus } : c))
        );
      }
    });
  }

  // Delete course
  function handleDeleteCourse(courseId: string, courseTitle: string) {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCourse(courseId);
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      }
    });
  }

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, price, and curate courses for Kids (5-12) and Adult learners.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('kids')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === 'kids'
                ? 'bg-purple-600 text-white'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kids (5-12)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('adults')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === 'adults'
                ? 'bg-slate-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Adults</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-slate-100">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                      course.category === 'kids'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {course.category === 'kids' ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Kids</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-3 w-3" />
                        <span>Adults</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Published Status Badge */}
                <div className="absolute right-3 top-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course.id, course.is_published)}
                    disabled={isPending}
                    title={course.is_published ? 'Click to unpublish' : 'Click to publish'}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm transition-transform active:scale-95 ${
                      course.is_published
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {course.is_published ? (
                      <>
                        <Globe className="h-3 w-3" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Course Info */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                  {course.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold text-slate-500">Course Fee:</span>
                  <span className="text-sm font-bold text-slate-900">
                    PKR {Number(course.price).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-3.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(course)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Edit course details"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Primary CTA: Lesson & Quiz Builder */}
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                >
                  <span>Curriculum & Quizzes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No courses found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery
              ? 'Try modifying your search filter.'
              : 'Start by creating your first Kids or Adults course.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </button>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Phonics Fun Level 1 or React Native Mastery"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Audience / Category *
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'kids' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      formData.category === 'kids'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Kids (Ages 5-12)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'adults' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      formData.category === 'adults'
                        ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Adults</span>
                  </button>
                </div>
              </div>

              {/* Price / Fee (in PKR) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Course Fee (in PKR) *
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-14 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline what students will learn..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Thumbnail Image Upload (Supabase Storage) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Course Thumbnail
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-slate-500" />
                    )}
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="Or paste image URL"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Preview */}
                {formData.thumbnail_url && (
                  <div className="relative mt-2.5 h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={formData.thumbnail_url}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-xs font-semibold text-slate-700">
                  Publish immediately (accessible to students)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || uploadingImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
