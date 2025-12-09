'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Play } from 'lucide-react';
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
};

const albumArt = PlaceHolderImages.find(img => img.id === 'album-art');

const SongItem = memo(function SongItem({ song, isPlaying, onPlay }: SongItemProps) {
  return (
    <div className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-secondary/50">
      {albumArt ? (
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
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-card-foreground">{song.title}</p>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPlay(song.title)}
        aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
        className="text-primary hover:text-primary"
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
    </div>
  );
});

export default SongItem;
