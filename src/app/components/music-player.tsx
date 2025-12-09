'use client';

import { useState, useMemo, useTransition } from 'react';
import { RefreshCw, Search, Loader2 } from 'lucide-react';

import SongItem from './song-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { refreshSongs } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

type Song = {
  title: string;
  artist: string;
};

export default function MusicPlayer({ initialSongs }: { initialSongs: Song[] }) {
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingSongTitle, setPlayingSongTitle] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePlay = (title: string) => {
    setPlayingSongTitle(currentTitle => (currentTitle === title ? null : title));
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshSongs({ count: 20 });
      if (result.success && result.songs) {
        setSongs(result.songs);
        setPlayingSongTitle(null);
        setSearchTerm('');
        toast({
          title: "Playlist Refreshed",
          description: "Enjoy your new set of grooves!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Refresh Failed",
          description: result.error || "Could not fetch new songs.",
        });
      }
    });
  };

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return songs;
    }
    return songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl shadow-primary/10 bg-card overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>Now Playing</CardTitle>
          <CardDescription>A list of AI-generated bangers</CardDescription>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
            aria-label="Refresh playlist"
            className="text-muted-foreground hover:text-primary transition-colors"
        >
            {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <RefreshCw className="h-5 w-5" />
            )}
        </Button>
      </CardHeader>

      <div className="px-6 pb-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
                aria-label="Search songs"
            />
        </div>
      </div>

      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="h-[50vh]">
          {filteredSongs.length > 0 ? (
            <div className="p-2 sm:p-4 space-y-1">
              {filteredSongs.map((song, index) => (
                <SongItem
                  key={`${song.title}-${index}`}
                  song={song}
                  isPlaying={playingSongTitle === song.title}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center p-8 text-muted-foreground">
              <p className="font-semibold">No songs found.</p>
              <p className="text-sm">Try a different search or refresh the playlist.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
