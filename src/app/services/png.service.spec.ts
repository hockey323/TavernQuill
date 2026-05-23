import { describe, it, expect, beforeEach } from 'vitest';
import { PngService } from './png.service';
import { TestBed } from '@angular/core/testing';
import { CharaCardV3 } from '../models/chara-card.model';

describe('PngService', () => {
  let service: PngService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PngService]
    });
    service = TestBed.inject(PngService);
  });

  describe('readCharaFromJson', () => {
    it('should successfully parse and validate a valid V3 JSON card', async () => {
      const v3Card = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          name: 'V3 AI Assistant',
          description: 'A helpful AI.',
          personality: 'Friendly',
          scenario: 'Talking with user',
          first_mes: 'Hello there!',
          mes_example: '<user>: Hi\n<char>: Hello!',
          creator_notes: 'None',
          system_prompt: 'Act as assistant.',
          post_history_instructions: '',
          character_version: '1.0',
          creator: 'Tester',
          tags: ['assistant', 'helpful'],
          alternate_greetings: ['Hi!', 'Hey!'],
          extensions: {}
        }
      };

      const file = new File([JSON.stringify(v3Card)], 'assistant.json', { type: 'application/json' });
      const result = await service.readCharaFromJson(file);

      expect(result.card.spec).toBe('chara_card_v3');
      expect(result.card.data.name).toBe('V3 AI Assistant');
      expect(result.card.data.tags).toContain('assistant');
      expect(result.isV2Upgrade).toBe(false);
    });

    it('should successfully parse and upgrade a V2 JSON card to V3', async () => {
      const v2Card = {
        name: 'V2 Character',
        description: 'V2 Personality details.',
        personality: 'Bold',
        scenario: 'Testing setup',
        first_mes: 'V2 greeting here.',
        mes_example: 'V2 example dialogue',
        creator: 'V2 Creator',
        tags: ['v2', 'test']
      };

      const file = new File([JSON.stringify(v2Card)], 'v2-chara.json', { type: 'application/json' });
      const result = await service.readCharaFromJson(file);

      expect(result.card.spec).toBe('chara_card_v3');
      expect(result.card.data.name).toBe('V2 Character');
      expect(result.card.data.description).toBe('V2 Personality details.');
      expect(result.card.data.tags).toContain('v2');
      expect(result.isV2Upgrade).toBe(true);
    });

    it('should throw an error on malformed/invalid JSON format', async () => {
      const badJsonString = '{ name: "incomplete json"';
      const file = new File([badJsonString], 'corrupt.json', { type: 'application/json' });

      await expect(service.readCharaFromJson(file)).rejects.toThrow('Character card data is not valid JSON.');
    });

    it('should throw validation error on invalid V3 schema format', async () => {
      const invalidV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          name: 123, // Invalid type (number instead of string)
          description: 'No name assistant',
          personality: 'Friendly',
          scenario: 'Talking',
          first_mes: 'Hello!',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          character_version: '1.0',
          creator: 'Tester',
          tags: [],
          alternate_greetings: [],
          extensions: {}
        }
      };

      const file = new File([JSON.stringify(invalidV3)], 'invalid.json', { type: 'application/json' });

      await expect(service.readCharaFromJson(file)).rejects.toThrow('Card validation failed:');
    });
  });
});
