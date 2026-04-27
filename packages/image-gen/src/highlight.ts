export interface TokenSpan {
  content: string;
  color: string;
  fontStyle?: string;
}

export type TokenLine = TokenSpan[];

const COLORS = {
  keyword: "#569cd6",
  string: "#ce9178",
  comment: "#6a9955",
  type: "#4ec9b0",
  member: "#dcdcaa",
  default: "#d4d4d4",
};

const KEYWORDS = new Set([
  "using", "namespace", "class", "public", "private", "protected", "static", "void",
  "string", "int", "var", "new", "return", "if", "else", "for", "foreach", "while",
  "async", "await", "task", "list", "array", "Console", "WriteLine", "Read", "using",
]);

export async function highlightCSharp(code: string): Promise<TokenLine[]> {
  const lines = code.split("\n");
  return lines.map((line) => {
    const tokens: TokenSpan[] = [];
    // Простейший токенизатор по словам и строкам
    const parts = line.split(/(\/\/.*|".*?"|'[^']*'|[\s\(\)\{\}\[\]\.;,])/g).filter(p => p !== "");
    
    let isComment = false;
    for (const part of parts) {
      if (part.startsWith("//")) {
        tokens.push({ content: part, color: COLORS.comment });
        isComment = true;
        continue;
      }
      if (isComment) {
        tokens.push({ content: part, color: COLORS.comment });
        continue;
      }
      if (part.startsWith('"') || part.startsWith("'")) {
        tokens.push({ content: part, color: COLORS.string });
        continue;
      }
      if (KEYWORDS.has(part.trim())) {
        tokens.push({ content: part, color: COLORS.keyword });
        continue;
      }
      if (/^[A-Z]/.test(part.trim()) && part.length > 2) {
        tokens.push({ content: part, color: COLORS.type });
        continue;
      }
      tokens.push({ content: part, color: COLORS.default });
    }
    return tokens;
  });
}
