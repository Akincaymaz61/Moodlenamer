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
    // Checking for a specific error message from Genkit/Google AI for rate limiting
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
       return { success: false, error: 'AI service is busy. Please try again in a moment.' };
    }
    return { success: false, error: 'An unexpected error occurred while contacting the AI service.' };
  }
}
