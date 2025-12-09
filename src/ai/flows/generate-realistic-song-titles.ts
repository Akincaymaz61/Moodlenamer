'use server';

/**
 * @fileOverview Generates realistic-sounding, but fake, song titles and artist names.
 *
 * - generateRealisticSongTitles - A function that generates realistic-sounding song titles and artist names.
 * - GenerateRealisticSongTitlesInput - The input type for the generateRealisticSongTitles function.
 * - GenerateRealisticSongTitlesOutput - The return type for the generateRealisticSongTitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRealisticSongTitlesInputSchema = z.object({
  count: z.number().default(10).describe('The number of song titles to generate.'),
});
export type GenerateRealisticSongTitlesInput = z.infer<typeof GenerateRealisticSongTitlesInputSchema>;

const GenerateRealisticSongTitlesOutputSchema = z.object({
  songs: z
    .array(
      z.object({
        title: z.string().describe('The generated song title.'),
        artist: z.string().describe('The generated artist name.'),
      })
    )
    .describe('An array of generated song titles and artist names.'),
});
export type GenerateRealisticSongTitlesOutput = z.infer<typeof GenerateRealisticSongTitlesOutputSchema>;

export async function generateRealisticSongTitles(
  input: GenerateRealisticSongTitlesInput
): Promise<GenerateRealisticSongTitlesOutput> {
  return generateRealisticSongTitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRealisticSongTitlesPrompt',
  input: {schema: GenerateRealisticSongTitlesInputSchema},
  prompt: `You are a music expert, skilled at creating realistic-sounding song titles and artist names.

  Generate {{count}} unique song titles and artist names. Ensure that the titles and names sound believable and could plausibly exist in the modern music landscape.

  Format the output as a JSON object with a "songs" key, which contains an array of objects, each with a "title" and "artist" field.
  Example: {"songs": [{"title": "Echoes in Rain", "artist": "Neon Drift"}]}
  `,
});

const generateRealisticSongTitlesFlow = ai.defineFlow(
  {
    name: 'generateRealisticSongTitlesFlow',
    inputSchema: GenerateRealisticSongTitlesInputSchema,
    outputSchema: GenerateRealisticSongTitlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (typeof output !== 'string') {
      // It might already be an object if the model is smart enough.
      return output as GenerateRealisticSongTitlesOutput;
    }
    // Clean the string to ensure it is valid JSON
    const jsonString = output.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  }
);
