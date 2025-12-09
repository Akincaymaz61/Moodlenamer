'use server';

import { refreshPlaylistWithNewSongs } from '@/ai/flows/refresh-playlist-with-new-songs';
import { z } from 'zod';

const RefreshSongsInput = z.object({
  count: z.number().min(1).max(50),
});

export async function refreshSongs(input: z.infer<typeof RefreshSongsInput>) {
  try {
    const validatedInput = RefreshSongsInput.parse(input);
    const result = await refreshPlaylistWithNewSongs(validatedInput);
    if (result?.songs) {
      return { success: true, songs: result.songs };
    }
    return { success: false, error: 'Failed to get a valid response from the AI.' };
  } catch (error) {
    console.error('Error refreshing songs:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input provided for refreshing songs.' };
    }
    return { success: false, error: 'An unexpected error occurred while refreshing songs.' };
  }
}
