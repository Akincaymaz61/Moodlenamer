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
  interface FileSystemDirectoryHandle {
    values: () => AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
  }
  interface FileSystemFileHandle {
    createWritable: () => Promise<FileSystemWritableFileStream>;
    getFile: () => Promise<File>;
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
            selected: true,
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
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
      }
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
        const originalHandle = fileToRename.handle;
        const originalName = fileToRename.name;
        
        try {
          const suggestion = newNames[i];
          const extension = originalName.split('.').pop();
          const newFileName = `${suggestion.artist} - ${suggestion.title}.${extension}`;

          // Create new file, write content, then remove old file
          const newFileHandle = await dirHandle.getFileHandle(newFileName, { create: true });
          const writable = await newFileHandle.createWritable();
          const originalFile = await originalHandle.getFile();
          await writable.write(originalFile);
          await writable.close();

          // After successful write, remove the original file
          await dirHandle.removeEntry(originalName);

          successCount++;
          
          setFiles(prev => prev.map(f => 
            f.id === fileToRename.id 
            ? { ...f, status: 'renamed', name: newFileName, id: newFileName, newName: newFileName, handle: newFileHandle }
            : f
          ));

        } catch (renameError: any) {
          console.error(`Failed to rename ${originalName}:`, renameError);
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
    <Card className="w-full max-w-3xl border-primary/20 bg-card shadow-xl shadow-primary/10">
       <CardHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Bot className="w-6 h-6 text-primary"/>
          </div>
          <div>
            <CardTitle className="text-xl">AI Bulk File Renamer</CardTitle>
            <CardDescription className="mt-1">Let AI creatively rename your audio files in bulk.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 rounded-lg bg-background/50 border">
            <Button onClick={handleSelectFolder} className="w-full sm:w-auto" disabled={isRenaming || isLoadingFiles}>
                {isLoadingFiles ? <Loader2 className="animate-spin" /> : <Folder />}
                {dirHandle ? `Folder: ${dirHandle.name}` : 'Select Folder'}
            </Button>
            {files.length > 0 && (
                <div className="text-sm text-muted-foreground w-full text-center sm:text-left">
                    Found {files.length} audio files. Select the ones you want to rename.
                </div>
            )}
        </div>
        
        {files.length > 0 && (
          <>
            <div className='mb-6 space-y-3 p-4 rounded-lg bg-background/50 border'>
              <label htmlFor="prompt-textarea" className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="text-primary w-4 h-4"/>
                Renaming Instructions
              </label>
              <Textarea 
                id="prompt-textarea"
                placeholder="e.g., 'Rename these as 90s alternative rock songs', or 'Suggest names for dreamy synthwave tracks'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background/80 focus:bg-background"
                rows={2}
              />
              <Button onClick={handleRename} className="w-full" disabled={isRenaming || selectedFilesCount === 0}>
                {isRenaming ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Rename {selectedFilesCount} Selected Files
              </Button>
            </div>
            
            <div className="flex justify-between items-center px-2 py-2 border-b border-t">
                <h3 className="font-semibold text-sm">Files to Rename</h3>
                <Button variant="link" size="sm" onClick={toggleSelectAll}>
                    {files.length > 0 && files.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                </Button>
            </div>

            <ScrollArea className="h-[40vh] pt-2">
              <div className="p-1 space-y-1">
                {files.map((file) => (
                  <SongItem
                    key={file.id}
                    file={file}
                    onSelect={() => toggleFileSelection(file.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {!isLoadingFiles && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[40vh] text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Music className="w-12 h-12 mb-4 text-primary/30" />
            <p className="font-semibold text-lg">No folder selected</p>
            <p className="text-sm max-w-xs mx-auto">Click the &quot;Select Folder&quot; button to choose a directory with your audio files to get started.</p>
          </div>
        )}

        {isLoadingFiles && (
          <div className="flex flex-col items-center justify-center h-[40vh] text-center p-8 text-muted-foreground">
            <Loader2 className="w-12 h-12 mb-4 text-primary/50 animate-spin" />
            <p className="font-semibold">Loading files from folder...</p>
            <p className='text-sm'>Please wait.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
