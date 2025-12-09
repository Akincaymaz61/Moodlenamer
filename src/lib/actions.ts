'use server';

import { generateRealisticSongTitles } from '@/ai/flows/generate-realistic-song-titles';
import { renameSong as renameSongFlow } from '@/ai/flows/rename-song';
import { z } from 'zod';

const RenameSongInputSchema = z.object({
  title: z.string(),
  artist: z.string(),
});

export async function getNewSongName(input: z.infer<typeof RenameSongInputSchema>) {
  try {
    const validatedInput = RenameSongInputSchema.parse(input);
    const result = await renameSongFlow(validatedInput);
    
    if (result?.title && result?.artist) {
      return { success: true, song: result };
    }
    
    return { success: false, error: 'AI failed to suggest a new name. Please try again.' };

  } catch (error: any) {
    console.error('Error in getNewSongName:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input provided.' };
    }
    
    // Propagate the actual error message from the AI service
    const errorMessage = error.message || 'An unknown error occurred.';
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
       return { success: false, error: 'AI service is busy. Please try again in a moment.' };
    }

    return { success: false, error: `An unexpected error occurred while contacting the AI service: ${errorMessage}` };
  }
}

const GenerateSongsInputSchema = z.object({
    count: z.number(),
    prompt: z.string().optional(),
});

export async function generateNewSongNames(input: z.infer<typeof GenerateSongsInputSchema>) {
    try {
        const validatedInput = GenerateSongsInputSchema.parse(input);
        const result = await generateRealisticSongTitles({
            count: validatedInput.count,
            prompt: validatedInput.prompt,
        });

        if (result?.songs && result.songs.length > 0) {
            return { success: true, songs: result.songs };
        }

        return { success: false, error: 'AI failed to generate new song names.' };
    } catch (error: any) {
        console.error('Error in generateNewSongNames:', error);
        
        const errorMessage = error.message || 'An unknown error occurred.';
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            return { success: false, error: 'AI service is busy. Please try again in a moment.' };
        }

        return { success: false, error: `An unexpected error occurred: ${errorMessage}` };
    }
}
