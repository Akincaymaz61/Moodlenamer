'use client';

import { useState, useMemo } from 'react';
import { Folder, Music, Upload, Bot, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateNewSongNames } from '@/lib/actions';

import SongItem from './song-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type SongFile = {
  id: string;
  name: string;
  handle: FileSystemFileHandle;
  selected: boolean;
  status: 'idle' | 'renaming' | 'renamed' | 'error';
  newName?: string;
  error?: string;
};

// Type definitions for the File System Access API
declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
  }
}

export default function MusicPlayer() {
  const { toast } = useToast();
  const [files, setFiles] = useState<SongFile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const selectedFilesCount = useMemo(() => files.filter(f => f.selected).length, [files]);

  const handleSelectFolder = async () => {
    if (!window.showDirectoryPicker) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.",
      });
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);

      // Verify permission
      if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        if (await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'Cannot read/write to the selected folder.'});
          return;
        }
      }
      
      setIsLoading(true);
      const fileList: SongFile[] = [];
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav') || entry.name.endsWith('.flac') || entry.name.endsWith('.ogg'))) {
          fileList.push({
            id: entry.name,
            name: entry.name,
            handle: entry,
            selected: false,
            status: 'idle',
          });
        }
      }
      setFiles(fileList);
      setIsLoading(false);
      toast({ title: "Folder selected", description: `${fileList.length} audio files found.` });
    } catch (err) {
      // User may have cancelled the picker
      console.error(err);
      setIsLoading(false);
    }
  };

  const toggleFileSelection = (id: string) => {
    setFiles(files => files.map(file => file.id === id ? { ...file, selected: !file.selected } : file));
  };
  
  const toggleSelectAll = () => {
    const allSelected = files.every(f => f.selected);
    setFiles(files.map(f => ({ ...f, selected: !allSelected })));
  }

  const handleRename = async () => {
    const selectedFiles = files.filter(f => f.selected);
    if (selectedFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No files selected' });
      return;
    }
    if (!dirHandle) return;

    setIsLoading(true);
    setFiles(prev => prev.map(f => f.selected ? { ...f, status: 'renaming' } : f));
    
    try {
      const result = await generateNewSongNames({
        count: selectedFiles.length,
        prompt: prompt,
      });

      if (!result.success || !result.songs || result.songs.length !== selectedFiles.length) {
        throw new Error(result.error || 'AI did not return enough names.');
      }
      
      const newNames = result.songs;

      for (let i = 0; i < selectedFiles.length; i++) {
        const fileToRename = selectedFiles[i];
        const suggestion = newNames[i];
        const extension = fileToRename.name.split('.').pop();
        const newFileName = `${suggestion.artist} - ${suggestion.title}.${extension}`;

        try {
          // The move method is now part of the standard, but it's for moving within the same directory.
          // To rename, you can "move" it to a new name in the same directory.
          await (fileToRename.handle as any).move(newFileName);
          
          setFiles(prev => prev.map(f => 
            f.id === fileToRename.id 
            ? { ...f, status: 'renamed', newName: newFileName } 
            : f
          ));

        } catch (renameError: any) {
          console.error(`Failed to rename ${fileToRename.name}:`, renameError);
          setFiles(prev => prev.map(f => 
            f.id === fileToRename.id 
            ? { ...f, status: 'error', error: renameError.message } 
            : f
          ));
        }
      }
      toast({ title: 'Renaming Complete!', description: `${selectedFiles.length} files processed.` });

    } catch (error: any) {
      console.error("Error during rename process:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setFiles(prev => prev.map(f => f.status === 'renaming' ? { ...f, status: 'error', error: error.message } : f));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl shadow-primary/10 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2"><Bot className="w-6 h-6 text-primary"/> AI File Renamer</CardTitle>
        <CardDescription>Select a folder and let AI rename your audio files based on your instructions.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
            <Button onClick={handleSelectFolder} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Folder className="mr-2" />}
                {dirHandle ? `Folder: ${dirHandle.name}` : 'Select Folder'}
            </Button>
        </div>
        
        {files.length > 0 && (
          <>
            <div className='mb-4 space-y-2'>
              <Textarea 
                placeholder="e.g., 'Rename these as 90s alternative rock songs'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background/50"
              />
              <Button onClick={handleRename} className="w-full" disabled={isLoading || selectedFilesCount === 0}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                Rename {selectedFilesCount} Selected Files
              </Button>
            </div>
            
            <div className="flex justify-between items-center px-1 py-2 border-b">
                <h3 className="font-semibold text-sm">Found {files.length} audio files</h3>
                <Button variant="link" size="sm" onClick={toggleSelectAll}>
                    {files.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                </Button>
            </div>
          </>
        )}

        <ScrollArea className="h-[40vh] pt-2">
          {isLoading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Loader2 className="w-12 h-12 mb-4 text-primary/30 animate-spin" />
              <p className="font-semibold">Loading files from folder...</p>
            </div>
          ) : files.length > 0 ? (
            <div className="p-1 space-y-1">
              {files.map((file) => (
                <SongItem
                  key={file.id}
                  file={file}
                  onSelect={() => toggleFileSelection(file.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Music className="w-12 h-12 mb-4 text-primary/30" />
              <p className="font-semibold">No folder selected.</p>
              <p className="text-sm">Click the button above to get started.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
