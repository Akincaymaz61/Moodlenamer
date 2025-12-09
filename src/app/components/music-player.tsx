'use client';

import { useState, useMemo, useRef } from 'react';
import { Music, Upload, Loader2, ClipboardCopy, Check, FileCheck2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import SongItem from './song-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNewSongName } from '@/lib/actions';

type Song = {
  id: string;
  title: string;
  artist: string;
  originalFileName: string;
  status: 'renaming' | 'renamed' | 'error' | 'idle';
  newFullName?: string;
};

// Type definition for the File System Access API
declare global {
  interface Window {
    showOpenFilePicker: (options?: any) => Promise<[FileSystemFileHandle]>;
  }
}

export default function MusicPlayer() {
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);

  const handleUploadClick = async () => {
    if (!window.showOpenFilePicker) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.",
      });
      return;
    }

    let fileHandle: FileSystemFileHandle;
    try {
      [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Audio Files',
          accept: { 'audio/mpeg': ['.mp3'] }
        }],
        multiple: false,
      });
    } catch (err) {
      // User cancelled the picker
      return;
    }
    
    const file = await fileHandle.getFile();
    const tempId = `renaming-${Date.now()}`;
    const originalFileName = file.name;

    const placeholderSong: Song = {
      id: tempId,
      title: 'Generating new name...',
      artist: originalFileName,
      originalFileName: originalFileName,
      status: 'renaming',
    };

    setSongs(prev => [placeholderSong, ...prev]);

    const result = await getNewSongName({ title: originalFileName, artist: 'Unknown' });

    if (result.success && result.song) {
      const newFileName = `${result.song.artist} - ${result.song.title}.mp3`;
      try {
        await fileHandle.move(newFileName);
        
        setSongs(prev => prev.map(s =>
          s.id === tempId
            ? { ...s, title: result.song.title, artist: result.song.artist, status: 'renamed', newFullName: newFileName }
            : s
        ));

        toast({
          title: "File Renamed!",
          description: `${originalFileName} was renamed to ${newFileName}`,
        });

      } catch (renameError) {
          console.error("Error renaming file:", renameError);
          setSongs(prev => prev.filter(s => s.id !== tempId));
          toast({
            variant: "destructive",
            title: "Rename Failed",
            description: "Could not rename the file. Please check permissions.",
          });
      }
    } else {
      setSongs(prev => prev.filter(s => s.id !== tempId));
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: result.error || "Could not suggest a new name.",
      });
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl shadow-primary/10 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>AI MP3 Renamer</CardTitle>
        <CardDescription>Select an MP3 file to have AI automatically rename it for you.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
            <Button onClick={handleUploadClick} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Select MP3 and Rename
            </Button>
        </div>
        
        <ScrollArea className="h-[45vh] border-t border-border pt-2">
          {songs.length > 0 ? (
            <div className="p-1 space-y-1">
              {songs.map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Music className="w-12 h-12 mb-4 text-primary/30" />
              <p className="font-semibold">No files renamed yet.</p>
              <p className="text-sm">Click the button above to select an MP3 file.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
