import { isValidEmoji } from './emoji';
import { describe, expect, it } from "vitest";


describe('isValidEmoji', () => {
  it('should return true for valid emojis', () => {
    expect(isValidEmoji('😊')).toBe(true);
    expect(isValidEmoji('👍')).toBe(true);
    expect(isValidEmoji('❤️')).toBe(true);
  });

  it('should return false for invalid emojis', () => {
    expect(isValidEmoji('abc')).toBe(false);
    expect(isValidEmoji('123')).toBe(false);
    expect(isValidEmoji('!@#')).toBe(false);
  });

  it('should return true for a complex emoji like ✂️', () => {
    expect(isValidEmoji('✂️')).toBe(true);
  });
});