export interface RawParsedToken {
  raw: string;
  normalized: string;
  brandHint?: string;
  modelNameHint: string;
}

export interface RawParsedLine {
  lineNumber: number;
  rawLine: string;
  tokens: RawParsedToken[];
  isValid: boolean;
  error?: string;
}

export interface ParseResult {
  lines: RawParsedLine[];
  validGroupsCount: number;
  hasErrors: boolean;
  totalTokensCount: number;
}

/**
 * Normalizes text by trimming whitespace, collapsing multiple spaces, and converting to lowercase.
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Parses multiline compatibility text where each non-empty line represents one compatibility group
 * and models are separated by '='.
 *
 * Rules:
 * 1. Trim whitespace around line and tokens.
 * 2. Ignore empty lines.
 * 3. Reject empty model tokens (e.g., "A == B" or "A = ").
 * 4. Reject duplicate model tokens within the same line after normalization.
 * 5. Reject lines with fewer than 2 distinct models (singleton groups forbidden).
 */
export function parseCompatibilityText(
  inputText: string,
  knownBrandNames: string[] = []
): ParseResult {
  const lines = inputText.split(/\r?\n/);
  const parsedLines: RawParsedLine[] = [];
  let validGroupsCount = 0;
  let hasErrors = false;
  let totalTokensCount = 0;

  // Prepare known brands for prefix matching (sorted longest first)
  const normalizedBrands = knownBrandNames
    .map((b) => ({ raw: b, norm: normalizeText(b) }))
    .sort((a, b) => b.norm.length - a.norm.length);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // Skip blank lines
    if (!trimmedLine) {
      continue;
    }

    const lineNumber = i + 1;
    const rawParts = trimmedLine.split('=');

    // Check if line contains empty tokens
    const tokens: RawParsedToken[] = [];
    const seenNormalized = new Set<string>();
    let lineError: string | undefined;

    for (let partIndex = 0; partIndex < rawParts.length; partIndex++) {
      const part = rawParts[partIndex];
      const trimmedPart = part.trim();

      if (!trimmedPart) {
        lineError = `Line ${lineNumber} contains an empty model token (e.g. '==' or trailing '=')`;
        break;
      }

      const normalized = normalizeText(trimmedPart);

      if (seenNormalized.has(normalized)) {
        lineError = `Line ${lineNumber} contains duplicate model '${trimmedPart}' on the same line`;
        break;
      }
      seenNormalized.add(normalized);

      // Attempt brand hint extraction
      let brandHint: string | undefined;
      let modelNameHint = trimmedPart;

      for (const brand of normalizedBrands) {
        if (normalized.startsWith(brand.norm + ' ')) {
          brandHint = brand.raw;
          modelNameHint = trimmedPart.slice(brand.raw.length).trim();
          break;
        }
      }

      tokens.push({
        raw: trimmedPart,
        normalized,
        brandHint,
        modelNameHint,
      });
    }

    if (!lineError && tokens.length < 2) {
      lineError = `Line ${lineNumber} must have at least 2 distinct models separated by '=' (singleton groups not allowed)`;
    }

    if (lineError) {
      hasErrors = true;
      parsedLines.push({
        lineNumber,
        rawLine,
        tokens,
        isValid: false,
        error: lineError,
      });
    } else {
      validGroupsCount++;
      totalTokensCount += tokens.length;
      parsedLines.push({
        lineNumber,
        rawLine,
        tokens,
        isValid: true,
      });
    }
  }

  return {
    lines: parsedLines,
    validGroupsCount,
    hasErrors,
    totalTokensCount,
  };
}
