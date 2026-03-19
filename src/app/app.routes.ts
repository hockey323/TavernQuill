import { Routes } from '@angular/router';
import { ChapterSoulComponent } from './components/chapters/chapter-soul';
import { ChapterMindComponent } from './components/chapters/chapter-mind';
import { ChapterVoiceComponent } from './components/chapters/chapter-voice';
import { ChapterGhostComponent } from './components/chapters/chapter-ghost';
import { GuideComponent } from './components/guide/guide';

export const routes: Routes = [
  // Core Keyword-Rich Editor Routes
  { path: 'character-soul-editor', component: ChapterSoulComponent },
  { path: 'scenario-mind-context', component: ChapterMindComponent },
  { path: 'greetings-voice-dialogue', component: ChapterVoiceComponent },
  { path: 'lorebook-ghost-world-info', component: ChapterGhostComponent },
  
  // Topic Ecosystem Routes
  { path: 'guide', component: GuideComponent },
  { path: 'sillytavern-v3-spec', component: GuideComponent }, // Shared for now, can be split later
  { path: 'privacy-security', component: GuideComponent },    // Shared for now
  
  // Redirects for legacy and root
  { path: 'soul', redirectTo: 'character-soul-editor', pathMatch: 'full' },
  { path: 'mind', redirectTo: 'scenario-mind-context', pathMatch: 'full' },
  { path: 'voice', redirectTo: 'greetings-voice-dialogue', pathMatch: 'full' },
  { path: 'ghost', redirectTo: 'lorebook-ghost-world-info', pathMatch: 'full' },
  { path: '', redirectTo: 'character-soul-editor', pathMatch: 'full' },
  { path: '**', redirectTo: 'character-soul-editor' }
];
