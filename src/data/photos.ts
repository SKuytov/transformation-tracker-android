/**
 * FileSystem helpers for photo storage.
 *
 * Photos are stored in FileSystem.documentDirectory + 'photos/' with timestamped filenames.
 * This avoids storing large base64 strings in AsyncStorage.
 *
 * During export: file URI photos are returned as-is (dataUrl field contains file:// URI).
 * For full webapp compat export, the consumer should convert to base64. See exportAll().
 */

import * as FileSystem from 'expo-file-system';
import { uid } from './store';
import type { PhotoTag } from './types';

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

export async function ensurePhotoDirExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

/**
 * Save a photo from a temp URI (from camera or picker) to the app's documents directory.
 * Returns the permanent file URI and an approximate size in KB.
 */
export async function savePhotoToDocuments(
  tempUri: string,
  tag: PhotoTag
): Promise<{ uri: string; sizeKb: number; id: string }> {
  await ensurePhotoDirExists();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = uid();
  const ext = tempUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `photo_${timestamp}_${tag}_${id}.${ext}`;
  const destUri = PHOTO_DIR + filename;

  await FileSystem.copyAsync({ from: tempUri, to: destUri });

  const info = await FileSystem.getInfoAsync(destUri, { size: true });
  const sizeKb = info.exists && 'size' in info ? Math.round((info as any).size / 1024) : 0;

  return { uri: destUri, sizeKb, id };
}

/**
 * Delete a photo file from the documents directory.
 */
export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (e) {
    console.warn('Failed to delete photo file', uri, e);
  }
}

/**
 * Convert a file URI to base64 string for export compatibility with webapp.
 */
export async function fileUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return uri; // fallback: return URI as-is
  }
}

/**
 * Save a base64 dataUrl (from webapp export) to the photos directory.
 * Returns the file URI.
 */
export async function base64ToFileUri(
  dataUrl: string,
  id: string
): Promise<string> {
  await ensurePhotoDirExists();
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const destUri = PHOTO_DIR + `imported_${id}.jpg`;
  await FileSystem.writeAsStringAsync(destUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return destUri;
}
