'use server';

import { generateRealisticSongTitles } from '@/ai/flows/generate-realistic-song-titles';
import { renameSong } from '@/ai/flows/rename-song';
import { z } from 'zod';

const RenameSongInput = z.object({
  title: z.string(),
  artist: z.string(),
});

export async function renameExistingSong(input: z.infer<typeof RenameSongInput>) {
  try {
    const validatedInput = RenameSongInput.parse(input);
    const result = await renameSong(validatedInput);
    if (result?.title && result?.artist) {
      return { success: true, song: result };
    }
    return { success: false, error: 'Failed to get a valid suggestion from the AI.' };
  } catch (error) {
    console.error('Error renaming song:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input provided for renaming song.' };
    }
    return { success: false, error: 'An unexpected error occurred while renaming the song.' };
  }
}

export async function generateSingleSong() {
  try {
    const result = await generateRealisticSongTitles({ count: 1 });
    if (result?.songs && result.songs.length > 0) {
      return { success: true, song: result.songs[0] };
    }
    return { success: false, error: 'Failed to get a valid response from the AI.' };
  } catch (error) {
    console.error('Error generating single song:', error);
    return { success: false, error: 'An unexpected error occurred while generating a song.' };
  }
}
