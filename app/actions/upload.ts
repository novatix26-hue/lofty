'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Uploads an asset (image, audio) to the public 'course-assets' bucket.
 * Restricted to admins.
 */
export async function uploadCourseAsset(
  formData: FormData,
  folder: 'thumbnails' | 'audio' | 'options' = 'thumbnails'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Admin permission required' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const admin = createAdminClient();
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('course-assets')
      .upload(fileName, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from('course-assets').getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Asset upload failed' };
  }
}
