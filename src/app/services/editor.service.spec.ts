import { describe, it, expect, beforeEach } from 'vitest';
import { EditorService } from './editor.service';
import { TestBed } from '@angular/core/testing';

describe('EditorService', () => {
  let service: EditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorService]
    });
    service = TestBed.inject(EditorService);
  });

  it('should initialize with a blank card', () => {
    expect(service.card().spec).toBe('chara_card_v3');
    expect(service.cardData().name).toBe('');
  });

  it('should update specific fields reactively', () => {
    service.updateField('name', 'Magnus the Red');
    expect(service.cardData().name).toBe('Magnus the Red');
    expect(service.cardData().modified).toBeGreaterThan(0);
  });

  it('should track validation completion properly', () => {
    // Initially incomplete (no name, no first message, no avatar)
    expect(service.soulComplete()).toBe(false);
    expect(service.voiceComplete()).toBe(false);

    // Provide name
    service.updateField('name', 'Magnus');
    expect(service.soulComplete()).toBe(true);

    // Provide first message
    service.updateField('first_mes', 'Knowledge is power.');
    expect(service.voiceComplete()).toBe(true);
  });

  it('should handle alternate greetings', () => {
    service.addGreeting();
    expect(service.cardData().alternate_greetings.length).toBe(1);

    service.updateGreeting(0, 'Hello traveler.');
    expect(service.cardData().alternate_greetings[0]).toBe('Hello traveler.');

    service.removeGreeting(0);
    expect(service.cardData().alternate_greetings.length).toBe(0);
  });

  it('should detect when an avatar is present', () => {
    expect(service.hasAvatar()).toBe(false);
    
    // Simulate setting an avatar (fake small PNG buffer)
    const fakeBuffer = new Uint8Array([8, 0, 0, 8]); 
    service.setAvatar(fakeBuffer);
    
    expect(service.hasAvatar()).toBe(true);
    expect(service.avatarBuffer()).toEqual(fakeBuffer);
  });
});
