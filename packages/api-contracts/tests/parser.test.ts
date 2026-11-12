import { describe, it, expect } from 'vitest';
import { parseCompatibilityText, normalizeText } from '../src/parser';

describe('Compatibility Parser Engine', () => {
  const sampleBrands = ['Redmi', 'Samsung', 'Poco', 'Apple', 'Xiaomi'];

  it('normalizes text properly by trimming and collapsing multiple spaces', () => {
    expect(normalizeText('  Redmi   Note   10  ')).toBe('redmi note 10');
  });

  it('handles multiple valid lines with various whitespace', () => {
    const input = `
      Redmi Note 10 = Redmi Note 10S = Redmi Note 11
      Samsung A52 = Samsung A52s
      Redmi 9 = Poco M2
    `;

    const result = parseCompatibilityText(input, sampleBrands);

    expect(result.hasErrors).toBe(false);
    expect(result.validGroupsCount).toBe(3);
    expect(result.lines).toHaveLength(3);

    expect(result.lines[0].tokens).toHaveLength(3);
    expect(result.lines[0].tokens[0].raw).toBe('Redmi Note 10');
    expect(result.lines[0].tokens[0].brandHint).toBe('Redmi');
    expect(result.lines[0].tokens[0].modelNameHint).toBe('Note 10');

    expect(result.lines[1].tokens).toHaveLength(2);
    expect(result.lines[2].tokens).toHaveLength(2);
    expect(result.lines[2].tokens[0].brandHint).toBe('Redmi');
    expect(result.lines[2].tokens[1].brandHint).toBe('Poco');
  });

  it('ignores blank lines', () => {
    const input = '\n\n   \nRedmi Note 10 = Redmi Note 10S\n\n\n';
    const result = parseCompatibilityText(input, sampleBrands);
    expect(result.lines).toHaveLength(1);
    expect(result.validGroupsCount).toBe(1);
  });

  it('rejects empty model tokens (double equals or trailing equals)', () => {
    const input = 'Redmi Note 10 == Redmi Note 10S';
    const result = parseCompatibilityText(input, sampleBrands);
    expect(result.hasErrors).toBe(true);
    expect(result.lines[0].isValid).toBe(false);
    expect(result.lines[0].error).toContain('empty model token');

    const inputTrailing = 'Redmi Note 10 = ';
    const resultTrailing = parseCompatibilityText(inputTrailing, sampleBrands);
    expect(resultTrailing.hasErrors).toBe(true);
    expect(resultTrailing.lines[0].isValid).toBe(false);
  });

  it('rejects duplicate model on the same line (case-insensitive)', () => {
    const input = 'Redmi Note 10 = redmi note 10';
    const result = parseCompatibilityText(input, sampleBrands);
    expect(result.hasErrors).toBe(true);
    expect(result.lines[0].isValid).toBe(false);
    expect(result.lines[0].error).toContain('duplicate model');
  });

  it('rejects singleton groups (fewer than two models)', () => {
    const input = 'Redmi Note 10';
    const result = parseCompatibilityText(input, sampleBrands);
    expect(result.hasErrors).toBe(true);
    expect(result.lines[0].isValid).toBe(false);
    expect(result.lines[0].error).toContain('at least 2 distinct models');
  });

  it('correctly parses cross-brand compatibility lines', () => {
    const input = 'Redmi 9 = Poco M2 = Samsung M02';
    const result = parseCompatibilityText(input, sampleBrands);
    expect(result.hasErrors).toBe(false);
    expect(result.lines[0].tokens[0].brandHint).toBe('Redmi');
    expect(result.lines[0].tokens[1].brandHint).toBe('Poco');
  });
});

