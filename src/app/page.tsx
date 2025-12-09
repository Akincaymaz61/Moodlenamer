import MusicPlayer from '@/app/components/music-player';
import { Music2 } from 'lucide-react';

export default async function Home() {
  
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-2xl mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Music2 className="w-8 h-8 text-primary"/>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight">AI MP3 Renamer</h1>
              <p className="text-muted-foreground">Let AI rename your MP3 files automatically.</p>
            </div>
          </header>
          <MusicPlayer />
        </div>
      </main>
    </div>
  );
}
