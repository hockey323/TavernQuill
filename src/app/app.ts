import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChapterStepperComponent } from './components/stepper/chapter-stepper';
import { LiveMirrorComponent } from './components/mirror/live-mirror';
import { ToolbarComponent } from './components/toolbar/toolbar';
import { EditorService } from './services/editor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ChapterStepperComponent,
    LiveMirrorComponent,
    ToolbarComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly editor = inject(EditorService);
}
