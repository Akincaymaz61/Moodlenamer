'use client';

import { memo } from 'react';
import { Loader2, Music, FileCheck2, AlertCircle, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type SongFile = {
  id: string;
  name: string;
  selected: boolean;
  status: 'idle' | 'renaming' | 'renamed' | 'error';
  newName?: string;
  error?: string;
};

type SongItemProps = {
  file: SongFile;
  onSelect: () => void;
};

const SongItem = memo(function SongItem({ file, onSelect }: SongItemProps) {
  const isBusy = file.status === 'renaming';
  const isRenamed = file.status === 'renamed';
  const hasError = file.status === 'error';

  return (
    <div 
      className={`flex items-center gap-4 p-2 rounded-lg transition-colors cursor-pointer ${isBusy ? 'opacity-50' : 'hover:bg-secondary/50'}`}
      onClick={onSelect}
    >
      <Checkbox
          checked={file.selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${file.name}`}
          className="shrink-0"
      />
      <div className="shrink-0 w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
          {isRenamed ? <FileCheck2 className="w-5 h-5 text-green-500" /> 
            : isBusy ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
            : hasError ? <AlertCircle className="w-5 h-5 text-destructive" />
            : <Music className="w-5 h-5 text-muted-foreground" />
          }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-card-foreground">{file.name}</p>
        {isRenamed && file.newName && (
          <div className="flex items-center gap-1 text-sm text-green-400">
            <Sparkles className="w-3 h-3" />
            <p className="truncate">Renamed to: {file.newName}</p>
          </div>
        )}
        {hasError && (
            <p className="text-sm truncate text-destructive">{file.error || 'An unknown error occurred.'}</p>
        )}
      </div>
    </div>
  );
});

export default SongItem;
