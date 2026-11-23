'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Uploads a student payment receipt image into the private 'receipts' bucket.
 * Generates a secured signed URL for admin review and student inspection.
 */
export async function uploadPaymentReceipt(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to upload a receipt' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No receipt file provided' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Receipt must be an image file (PNG, JPG, WEBP)' };
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Receipt file size must be under 5MB' };
    }

    const admin = createAdminClient();
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to private 'receipts' bucket
    const { error: uploadError } = await admin.storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Generate signed URL with 1-year validity for admin review
    const { data: signedData, error: signError } = await admin.storage
      .from('receipts')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signError || !signedData?.signedUrl) {
      // Fallback to public URL in case bucket is set to public
      const {
        data: { publicUrl },
      } = admin.storage.from('receipts').getPublicUrl(fileName);
      return { success: true, url: publicUrl };
    }

    return { success: true, url: signedData.signedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Receipt upload failed' };
  }
}
