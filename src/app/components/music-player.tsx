'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Loader2, Music, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import SongItem from './song-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renameExistingSong, generateSingleSong } from '@/lib/actions';

type Song = {
  id: string;
  title: string;
  artist: string;
  isRenaming?: boolean;
  isGenerating?: boolean;
};

export default function MusicPlayer({ initialSongs }: { initialSongs: { title: string, artist: string }[] }) {
  const { toast } = useToast();
  
  const initialSongsWithId = useMemo(() => initialSongs.map((song, index) => ({...song, id: `${song.title}-${index}`})), [initialSongs]);
  
  const [songs, setSongs] = useState<Song[]>(initialSongsWithId);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingSongTitle, setPlayingSongTitle] = useState<string | null>(null);

  const handlePlay = (title: string) => {
    setPlayingSongTitle(currentTitle => (currentTitle === title ? null : title));
  };
  
  const handleAddNewSong = async () => {
    const tempId = `generating-${Date.now()}`;
    const newSongPlaceholder: Song = {
        id: tempId,
        title: 'Generating new song...',
        artist: 'AI is thinking...',
        isGenerating: true,
    };

    setSongs(prev => [newSongPlaceholder, ...prev]);

    const result = await generateSingleSong();

    if (result.success && result.song) {
      setSongs(prev => prev.map(s =>
        s.id === tempId
          ? { ...result.song, id: tempId, isGenerating: false }
          : s
      ));
      toast({
        title: "New Song Added!",
        description: `"${result.song.title}" by ${result.song.artist} is now in your list.`,
      });
    } else {
      setSongs(prev => prev.filter(s => s.id !== tempId));
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: result.error || "Could not generate a new song.",
      });
    }
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
        <CardTitle>Groove Illusion</CardTitle>
        <CardDescription>Let AI generate and rename your playlist.</CardDescription>
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
             <Button onClick={handleAddNewSong} variant="outline" className="shrink-0">
                <RefreshCw className="mr-2 h-4 w-4" />
                Add New Song
            </Button>
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
                  isGenerating={song.isGenerating}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Music className="w-12 h-12 mb-4 text-primary/30" />
              <p className="font-semibold">Your playlist is empty.</p>
              <p className="text-sm">Click "Add New Song" to generate a track with AI.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
