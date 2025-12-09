'use server';
/**
 * @fileOverview Analyzes an existing song title and artist, and suggests a new title and artist for it.
 *
 * - renameSong - A function that handles suggesting a new song title and artist.
 * - RenameSongInput - The input type for the renameSong function.
 * - RenameSongOutput - The return type for the renameSong function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RenameSongInputSchema = z.object({
  title: z.string().describe('The current title of the song.'),
  artist: z.string().describe('The current artist of the song.'),
});
export type RenameSongInput = z.infer<typeof RenameSongInputSchema>;

const RenameSongOutputSchema = z.object({
  title: z.string().describe('The suggested new song title.'),
  artist: z.string().describe('The suggested new artist name.'),
});
export type RenameSongOutput = z.infer<typeof RenameSongOutputSchema>;

export async function renameSong(input: RenameSongInput): Promise<RenameSongOutput> {
  return renameSongFlow(input);
}

const prompt = ai.definePrompt({
  name: 'renameSongPrompt',
  input: {schema: RenameSongInputSchema},
  output: {schema: RenameSongOutputSchema},
  prompt: `You are a creative music expert. You will be given a song title and artist name.
  
  Your task is to come up with a completely new, creative, and plausible-sounding song title and artist name. Do not simply rephrase the existing ones.

  Original Song:
  Title: "{{title}}"
  Artist: "{{artist}}"

  Generate a new title and artist.`,
});

const renameSongFlow = ai.defineFlow(
  {
    name: 'renameSongFlow',
    inputSchema: RenameSongInputSchema,
    outputSchema: RenameSongOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
