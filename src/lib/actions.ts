'use server';

import { refreshPlaylistWithNewSongs } from '@/ai/flows/refresh-playlist-with-new-songs';
import { renameSong } from '@/ai/flows/rename-song';
import { suggestSongTitleFromAudio } from '@/ai/flows/suggest-song-title-from-audio';
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


const SuggestSongFromAudioInput = z.object({
  audioDataUri: z.string(),
});

export async function suggestSongFromAudio(input: z.infer<typeof SuggestSongFromAudioInput>) {
  try {
    const validatedInput = SuggestSongFromAudioInput.parse(input);
    const result = await suggestSongTitleFromAudio(validatedInput);
     if (result?.title && result?.artist) {
      return { success: true, song: result };
    }
    return { success: false, error: 'Failed to get a valid suggestion from the AI.' };
  } catch (error) {
    console.error('Error suggesting song from audio:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input for audio suggestion.' };
    }
    return { success: false, error: 'An unexpected error occurred while suggesting the song name.' };
  }
}
