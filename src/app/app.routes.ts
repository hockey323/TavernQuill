import { Routes } from '@angular/router';
import { ChapterSoulComponent } from './components/chapters/chapter-soul';
import { ChapterMindComponent } from './components/chapters/chapter-mind';
import { ChapterVoiceComponent } from './components/chapters/chapter-voice';
import { ChapterGhostComponent } from './components/chapters/chapter-ghost';

export const routes: Routes = [
  { path: 'soul', component: ChapterSoulComponent },
  { path: 'mind', component: ChapterMindComponent },
  { path: 'voice', component: ChapterVoiceComponent },
  { path: 'ghost', component: ChapterGhostComponent },
  { path: '', redirectTo: 'soul', pathMatch: 'full' },
  { path: '**', redirectTo: 'soul' }
];
