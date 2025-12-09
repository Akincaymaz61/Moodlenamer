import MusicPlayer from '@/app/components/music-player';
import { Bot } from 'lucide-react';

export default async function Home() {
  
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <header className="flex flex-col items-center text-center gap-2 mb-8">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
              <Bot className="w-8 h-8 text-primary"/>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">AI Bulk File Renamer</h1>
              <p className="text-muted-foreground mt-1">Select a folder and let AI suggest new names for your files.</p>
            </div>
          </header>
          <MusicPlayer />
        </div>
      </main>
    </div>
  );
}
