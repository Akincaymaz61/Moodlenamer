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
  title: z.string().describe('The current title of the song (or the original filename).'),
  artist: z.string().describe('The current artist of the song (can be "Unknown").'),
});
export type RenameSongInput = z.infer<typeof RenameSongInputSchema>;

const RenameSongOutputSchema = z.object({
  title: z.string().describe('The suggested new creative song title.'),
  artist: z.string().describe('The suggested new creative artist name.'),
});
export type RenameSongOutput = z.infer<typeof RenameSongOutputSchema>;

export async function renameSong(input: RenameSongInput): Promise<RenameSongOutput> {
  return renameSongFlow(input);
}

const prompt = ai.definePrompt({
  name: 'renameSongPrompt',
  input: {schema: RenameSongInputSchema},
  prompt: `You are a creative genius who is an expert at naming music tracks. You will be given an original filename for an audio file.
  
  Your task is to come up with a completely new, creative, and plausible-sounding song title and artist name. The names should sound like they could be real.

  Original Filename: "{{title}}"

  Generate a new song title and a new artist name.

  Respond with a JSON object with "title" and "artist" keys.
  Example: {"title": "Cosmic Drift", "artist": "Starlight Bloom"}
  `,
});

const renameSongFlow = ai.defineFlow(
  {
    name: 'renameSongFlow',
    inputSchema: RenameSongInputSchema,
    outputSchema: RenameSongOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (typeof output !== 'string') {
      // It might already be an object if the model is smart enough.
      return output as RenameSongOutput;
    }
    // Clean the string to ensure it is valid JSON
    const jsonString = output.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  }
);
