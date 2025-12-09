'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Loader2, Music, FileCheck2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Song = {
  title: string;
  artist: string;
  originalFileName: string;
  status: 'renaming' | 'renamed' | 'error' | 'idle';
  newFullName?: string;
};

type SongItemProps = {
  song: Song;
};

const albumArt = PlaceHolderImages.find(img => img.id === 'album-art');

const SongItem = memo(function SongItem({ song }: SongItemProps) {
  const isBusy = song.status === 'renaming';
  const isRenamed = song.status === 'renamed';

  return (
    <div className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isBusy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/50'}`}>
      <div className="relative w-12 h-12 shrink-0">
        {isBusy ? (
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
        {isBusy ? (
          <>
            <p className="font-semibold truncate text-muted-foreground italic">{song.title}</p>
            <p className="text-sm truncate text-muted-foreground italic">{song.originalFileName}</p>
          </>
        ) : (
          <>
             <p className="font-semibold truncate text-card-foreground">{song.newFullName}</p>
             <p className="text-sm truncate text-muted-foreground">Original: {song.originalFileName}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 w-10 justify-center">
        {isBusy ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : isRenamed ? (
          <FileCheck2 className="h-5 w-5 text-green-500" />
        ) : null}
      </div>
    </div>
  );
});

export default SongItem;
