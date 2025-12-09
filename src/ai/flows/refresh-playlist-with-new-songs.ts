'use server';
/**
 * @fileOverview Generates a new set of realistic-sounding song titles and artist names.
 *
 * - refreshPlaylistWithNewSongs - A function that generates a new set of song titles and artist names.
 * - RefreshPlaylistWithNewSongsInput - The input type for the refreshPlaylistWithNewSongs function.
 * - RefreshPlaylistWithNewSongsOutput - The return type for the refreshPlaylistWithNewSongs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefreshPlaylistWithNewSongsInputSchema = z.object({
  count: z.number().describe('The number of song titles and artist names to generate.'),
});
export type RefreshPlaylistWithNewSongsInput = z.infer<typeof RefreshPlaylistWithNewSongsInputSchema>;

const RefreshPlaylistWithNewSongsOutputSchema = z.object({
  songs: z.array(
    z.object({
      title: z.string().describe('The generated song title.'),
      artist: z.string().describe('The generated artist name.'),
    })
  ).describe('An array of generated song titles and artist names.'),
});
export type RefreshPlaylistWithNewSongsOutput = z.infer<typeof RefreshPlaylistWithNewSongsOutputSchema>;

export async function refreshPlaylistWithNewSongs(input: RefreshPlaylistWithNewSongsInput): Promise<RefreshPlaylistWithNewSongsOutput> {
  return refreshPlaylistWithNewSongsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refreshPlaylistWithNewSongsPrompt',
  input: {schema: RefreshPlaylistWithNewSongsInputSchema},
  output: {schema: RefreshPlaylistWithNewSongsOutputSchema},
  prompt: `You are a creative AI that generates realistic-sounding song titles and artist names.

  Generate {{count}} song titles and artist names. Make sure they sound realistic.

  Output should be a JSON array of objects with "title" and "artist" keys.
  Example:
  [
    {
      "title": "Midnight Serenade",
      "artist": "Aurora Echoes"
    },
    {
      "title": "Lost in the Nebula",
      "artist": "Cosmic Drifters"
    }
  ]
  `,
});

const refreshPlaylistWithNewSongsFlow = ai.defineFlow(
  {
    name: 'refreshPlaylistWithNewSongsFlow',
    inputSchema: RefreshPlaylistWithNewSongsInputSchema,
    outputSchema: RefreshPlaylistWithNewSongsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
