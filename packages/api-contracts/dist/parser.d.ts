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
export declare function normalizeText(text: string): string;
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
export declare function parseCompatibilityText(inputText: string, knownBrandNames?: string[]): ParseResult;
//# sourceMappingURL=parser.d.ts.map