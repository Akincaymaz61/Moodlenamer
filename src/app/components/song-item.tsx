'use client';

import { memo } from 'react';
import { Loader2, Music, FileCheck2, AlertCircle, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
      className={cn(
        "flex items-center gap-4 p-2 rounded-lg transition-all duration-200 cursor-pointer border border-transparent",
        isBusy ? 'opacity-50' : 'hover:bg-secondary/50 hover:border-primary/20',
        file.selected && 'bg-secondary/30 border-primary/10'
      )}
      onClick={onSelect}
    >
      <Checkbox
          checked={file.selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${file.name}`}
          className="shrink-0 ml-2"
      />
      <div className="shrink-0 w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary">
          {isRenamed ? <FileCheck2 className="w-5 h-5 text-green-500" /> 
            : isBusy ? <Loader2 className="w-5 h-5 animate-spin" />
            : hasError ? <AlertCircle className="w-5 h-5 text-destructive" />
            : <Music className="w-5 h-5 text-muted-foreground" />
          }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-card-foreground text-sm">{file.name}</p>
        {isRenamed && file.newName && (
          <div className="flex items-center gap-1.5 text-xs text-green-400/80 mt-1">
            <Sparkles className="w-3 h-3" />
            <p className="truncate">Renamed successfully</p>
          </div>
        )}
        {hasError && (
            <p className="text-sm truncate text-destructive/80 mt-1">{file.error || 'An unknown error occurred.'}</p>
        )}
      </div>
    </div>
  );
});

export default SongItem;
