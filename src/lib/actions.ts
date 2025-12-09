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
    
    // This case handles if the AI returns a valid but empty response
    return { success: false, error: 'AI failed to suggest a new name. Please try again.' };

  } catch (error: any) {
    console.error('Error in getNewSongName:', error);

    // Propagate the actual error message from the AI service or Zod validation
    const errorMessage = error.message || 'An unknown error occurred.';

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input provided.' };
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
       return { success: false, error: 'AI service is busy. Please try again in a moment.' };
    }

    // Return the specific error message to the client
    return { success: false, error: `An unexpected error occurred while contacting the AI service: ${errorMessage}` };
  }
}
