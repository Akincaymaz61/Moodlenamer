'use client';

import { useState, useMemo } from 'react';
import { Folder, Music, Upload, Bot, Loader2, Sparkles, Check, X } from 'lucide-react';
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
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
      
      setIsLoadingFiles(true);
      const fileList: SongFile[] = [];
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav') || entry.name.endsWith('.flac') || entry.name.endsWith('.ogg'))) {
          fileList.push({
            id: entry.name,
            name: entry.name,
            handle: entry,
            selected: true, // Select all by default
            status: 'idle',
          });
        }
      }
      setFiles(fileList);
      setIsLoadingFiles(false);
      if(fileList.length > 0) {
        toast({ title: "Folder Selected", description: `${fileList.length} audio files found and selected.` });
      } else {
        toast({ variant: 'destructive', title: "No Audio Files Found", description: 'The selected folder does not contain any supported audio files.' });
      }
    } catch (err) {
      // User may have cancelled the picker
      console.error(err);
      setIsLoadingFiles(false);
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

    setIsRenaming(true);
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
      let successCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const fileToRename = selectedFiles[i];
        const suggestion = newNames[i];
        const extension = fileToRename.name.split('.').pop();
        const newFileName = `${suggestion.artist} - ${suggestion.title}.${extension}`;

        try {
          await (fileToRename.handle as any).move(newFileName);
          successCount++;
          
          setFiles(prev => prev.map(f => 
            f.id === fileToRename.id 
            ? { ...f, status: 'renamed', name: newFileName, newName: newFileName, handle: { ...f.handle, name: newFileName } }
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
      toast({ title: 'Renaming Complete!', description: `${successCount} of ${selectedFiles.length} files processed.` });

    } catch (error: any) {
      console.error("Error during rename process:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setFiles(prev => prev.map(f => f.status === 'renaming' ? { ...f, status: 'error', error: 'AI request failed' } : f));
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl shadow-primary/10 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardDescription>Select a local folder to start renaming your audio files.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <Button onClick={handleSelectFolder} className="w-full sm:w-auto" disabled={isRenaming || isLoadingFiles}>
                {isLoadingFiles ? <Loader2 className="mr-2 animate-spin" /> : <Folder className="mr-2" />}
                {dirHandle ? `Folder: ${dirHandle.name}` : 'Select Folder'}
            </Button>
            {files.length > 0 && (
                <div className="text-sm text-muted-foreground w-full text-center sm:text-left">
                    Found {files.length} audio files.
                </div>
            )}
        </div>
        
        {files.length > 0 && (
          <>
            <div className='mb-4 space-y-3 p-4 rounded-lg bg-background/50 border'>
              <label htmlFor="prompt-textarea" className="font-semibold text-sm">Renaming Instructions</label>
              <Textarea 
                id="prompt-textarea"
                placeholder="e.g., 'Rename these as 90s alternative rock songs'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background/80 focus:bg-background"
                rows={3}
              />
              <Button onClick={handleRename} className="w-full" disabled={isRenaming || selectedFilesCount === 0}>
                {isRenaming ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                Rename {selectedFilesCount} Selected Files
              </Button>
            </div>
            
            <div className="flex justify-between items-center px-1 py-2 border-b">
                <h3 className="font-semibold text-sm">Files to Rename</h3>
                <Button variant="link" size="sm" onClick={toggleSelectAll}>
                    {files.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                </Button>
            </div>
          </>
        )}

        <ScrollArea className="h-[40vh] pt-2">
          {isLoadingFiles ? (
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground">
              <Loader2 className="w-12 h-12 mb-4 text-primary/50 animate-spin" />
              <p className="font-semibold">Loading files from folder...</p>
              <p className='text-sm'>Please wait.</p>
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
            <div className="flex flex-col items-center justify-center h-[35vh] text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Music className="w-12 h-12 mb-4 text-primary/30" />
              <p className="font-semibold text-lg">No folder selected</p>
              <p className="text-sm max-w-xs mx-auto">Click the &quot;Select Folder&quot; button to choose a directory with your audio files to get started.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
