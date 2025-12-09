'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Play, Loader2, PenSquare, Music } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Song = {
  title: string;
  artist: string;
};

type SongItemProps = {
  song: Song;
  isPlaying: boolean;
  onPlay: (title: string) => void;
  onRename: (song: Song) => void;
  isRenaming?: boolean;
  isGenerating?: boolean;
};

const albumArt = PlaceHolderImages.find(img => img.id === 'album-art');

const SongItem = memo(function SongItem({ song, isPlaying, onPlay, onRename, isRenaming, isGenerating }: SongItemProps) {
  const isBusy = isRenaming || isGenerating;

  return (
    <div className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isBusy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/50'}`}>
      <div className="relative w-12 h-12 shrink-0">
        {isGenerating ? (
            <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center">
                <Music className="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
        ) : albumArt ? (
          <Image
            src={albumArt.imageUrl}
            alt={albumArt.description}
            data-ai-hint={albumArt.imageHint}
            width={48}
            height={48}
            className="rounded-md object-cover aspect-square"
          />
        ) : (
          <Skeleton className="w-12 h-12 rounded-md" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate text-card-foreground ${isGenerating ? 'italic text-muted-foreground' : ''}`}>{song.title}</p>
        <p className={`text-sm truncate ${isGenerating ? 'italic text-muted-foreground' : 'text-muted-foreground'}`}>{song.artist}</p>
      </div>
      <div className="flex items-center gap-1">
        {isRenaming || isGenerating ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRename(song)}
              aria-label={`Rename ${song.title}`}
              className="text-muted-foreground hover:text-primary"
              disabled={isBusy}
            >
              <PenSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPlay(song.title)}
              aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
              className="text-primary hover:text-primary"
              disabled={isBusy}
            >
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 h-2 bg-primary animate-wave-2"/>
                  <span className="w-1 h-4 bg-primary animate-wave-1"/>
                  <span className="w-1 h-3 bg-primary animate-wave-3"/>
                </div>
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

export default SongItem;
