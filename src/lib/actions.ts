'use server';

import { renameSong as renameSongFlow } from '@/ai/flows/rename-song';
import { z } from 'zod';

const RenameSongInput = z.object({
  title: z.string(),
  artist: z.string(),
});

export async function getNewSongName(input: z.infer<typeof RenameSongInput>) {
  try {
    const validatedInput = RenameSongInput.parse(input);
    const result = await renameSongFlow(validatedInput);
    if (result?.title && result?.artist) {
      return { success: true, song: result };
    }
    return { success: false, error: 'Failed to get a valid suggestion from the AI.' };
  } catch (error) {
    console.error('Error getting new song name:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input provided.' };
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
