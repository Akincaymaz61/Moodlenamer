'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import { RefreshCw, Search, Loader2, PlusCircle } from 'lucide-react';

import SongItem from './song-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { renameExistingSong } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

type Song = {
  id: string;
  title: string;
  artist: string;
  isRenaming?: boolean;
};

export default function MusicPlayer({ initialSongs }: { initialSongs: { title: string, artist: string }[] }) {
  const { toast } = useToast();
  
  const initialSongsWithId = useMemo(() => initialSongs.map((song, index) => ({...song, id: `${song.title}-${index}`})), [initialSongs]);
  
  const [songs, setSongs] = useState<Song[]>(initialSongsWithId);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingSongTitle, setPlayingSongTitle] = useState<string | null>(null);

  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');


  const handlePlay = (title: string) => {
    setPlayingSongTitle(currentTitle => (currentTitle === title ? null : title));
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSongTitle.trim() && newSongArtist.trim()) {
      const newSong: Song = {
        id: `manual-${newSongTitle}-${Date.now()}`,
        title: newSongTitle.trim(),
        artist: newSongArtist.trim(),
      };
      setSongs(prev => [newSong, ...prev]);
      setNewSongTitle('');
      setNewSongArtist('');
      toast({
        title: "Song Added",
        description: `"${newSong.title}" by ${newSong.artist} has been added to the list.`,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both song title and artist.",
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
        <CardTitle>Rename Your Songs</CardTitle>
        <CardDescription>Add your songs and let AI suggest new names.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleAddSong} className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <Input 
            placeholder="Song Title" 
            value={newSongTitle} 
            onChange={(e) => setNewSongTitle(e.target.value)} 
            className="bg-background/50"
            aria-label="New song title"
          />
          <Input 
            placeholder="Artist" 
            value={newSongArtist} 
            onChange={(e) => setNewSongArtist(e.target.value)} 
            className="bg-background/50"
            aria-label="New song artist"
          />
          <Button type="submit" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4"/> Add Song
          </Button>
        </form>
        
        <Separator className="mb-4"/>

        <div className="relative mb-4">
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

        <ScrollArea className="h-[40vh]">
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
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[30vh] text-center p-8 text-muted-foreground">
              <p className="font-semibold">Your playlist is empty.</p>
              <p className="text-sm">Add a song above to get started.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
