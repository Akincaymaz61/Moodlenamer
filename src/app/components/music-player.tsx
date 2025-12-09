'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Loader2, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import SongItem from './song-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renameExistingSong, suggestSongFromAudio } from '@/lib/actions';

type Song = {
  id: string;
  title: string;
  artist: string;
  isRenaming?: boolean;
  isUploading?: boolean;
};

export default function MusicPlayer({ initialSongs }: { initialSongs: { title: string, artist: string }[] }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialSongsWithId = useMemo(() => initialSongs.map((song, index) => ({...song, id: `${song.title}-${index}`})), [initialSongs]);
  
  const [songs, setSongs] = useState<Song[]>(initialSongsWithId);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingSongTitle, setPlayingSongTitle] = useState<string | null>(null);

  const handlePlay = (title: string) => {
    setPlayingSongTitle(currentTitle => (currentTitle === title ? null : title));
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an audio file (e.g., MP3, WAV).",
      });
      return;
    }

    const tempId = `uploading-${Date.now()}`;
    const newSongPlaceholder: Song = {
        id: tempId,
        title: `Analyzing ${file.name}...`,
        artist: 'AI is thinking...',
        isUploading: true,
    };

    setSongs(prev => [newSongPlaceholder, ...prev]);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const audioDataUri = reader.result as string;
      const result = await suggestSongFromAudio({ audioDataUri });

      if (result.success && result.song) {
        setSongs(prev => prev.map(s =>
          s.id === tempId
            ? { ...s, title: result.song.title, artist: result.song.artist, isUploading: false }
            : s
        ));
        toast({
          title: "Song Identified!",
          description: `Your track has been named "${result.song.title}".`,
        });
      } else {
        setSongs(prev => prev.filter(s => s.id !== tempId));
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.error || "Could not suggest a title for the song.",
        });
      }
    };
    reader.onerror = () => {
        setSongs(prev => prev.filter(s => s.id !== tempId));
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
    };
    
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };


  const handleRename = async (songToRename: Song) => {
    setSongs(prev => prev.map(s => s.id === songToRename.id ? { ...s, isRenaming: true } : s));
    
    const result = await renameExistingSong({ title: songToRename.title, artist: songToRename.artist });
    
    if (result.success && result.song) {
      setSongs(prev => prev.map(s => 
        s.id === songToRename.id 
          ? { ...s, title: result.song.title, artist: result.song.artist, isRenaming: false } 
          : s
      ));
      toast({
        title: "Song Renamed!",
        description: `"${songToRename.title}" is now "${result.song.title}".`,
      });
    } else {
      setSongs(prev => prev.map(s => s.id === songToRename.id ? { ...s, isRenaming: false } : s));
      toast({
        variant: "destructive",
        title: "Rename Failed",
        description: result.error || "Could not rename the song.",
      });
    }
  };

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return songs;
    }
    return songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl shadow-primary/10 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Name Your MP3s</CardTitle>
        <CardDescription>Upload your audio files and let AI give them a name.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search your list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50"
                    aria-label="Search songs"
                />
            </div>
             <Button onClick={handleUploadClick} variant="outline" className="shrink-0">
                <Upload className="mr-2 h-4 w-4" />
                Upload MP3
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="audio/*"
            />
        </div>
        
        <ScrollArea className="h-[45vh] border-t border-border pt-2">
          {filteredSongs.length > 0 ? (
            <div className="p-1 space-y-1">
              {filteredSongs.map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  isPlaying={playingSongTitle === song.title}
                  onPlay={handlePlay}
                  onRename={handleRename}
                  isRenaming={song.isRenaming}
                  isUploading={song.isUploading}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Upload className="w-12 h-12 mb-4 text-primary/30" />
              <p className="font-semibold">Your playlist is empty.</p>
              <p className="text-sm">Click "Upload MP3" to add a song and get a new name for it.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
