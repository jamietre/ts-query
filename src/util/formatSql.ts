interface FormatOptions {
  indentSize?: number;
}

export function formatSql(sql: string, options: FormatOptions = {}): string {
  const indentSize = options.indentSize ?? 2;

  // Remove all existing whitespace and normalize
  const normalized = sql.replace(/\s+/g, " ").trim();

  // Handle empty input
  if (!normalized) {
    return "";
  }

  // New approach: tokenize and format with proper parentheses tracking
  const tokens = tokenizeSql(normalized);
  let formatted = formatTokensWithIndentation(tokens, indentSize);

  return formatted;
}

// Helper function to tokenize SQL
// This is COMPLETELY AI GENERATED!
// It's a lot better than unformatted, but still needs improvement
function tokenizeSql(sql: string): Array<{ type: "keyword" | "text" | "paren" | "comma"; value: string }> {
  const tokens: Array<{ type: "keyword" | "text" | "paren" | "comma"; value: string }> = [];
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "UNION",
    "UNION ALL",
    "INTERSECT",
    "EXCEPT",
    "WITH",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "FULL JOIN",
    "JOIN",
    "AND",
    "OR",
    "ON",
  ];

  // Sort keywords by length (longest first) to match properly
  const sortedKeywords = keywords.sort((a, b) => b.length - a.length);

  let i = 0;
  while (i < sql.length) {
    // Skip whitespace
    if (/\s/.test(sql[i])) {
      i++;
      continue;
    }

    // Check for parentheses
    if (sql[i] === "(" || sql[i] === ")") {
      tokens.push({ type: "paren", value: sql[i] });
      i++;
      continue;
    }

    // Check for commas
    if (sql[i] === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }

    // Check for keywords
    let foundKeyword = false;
    for (const keyword of sortedKeywords) {
      if (
        sql.substring(i, i + keyword.length).toUpperCase() === keyword.toUpperCase() &&
        (i + keyword.length >= sql.length || /\s/.test(sql[i + keyword.length]))
      ) {
        tokens.push({ type: "keyword", value: keyword.toUpperCase() });
        i += keyword.length;
        foundKeyword = true;
        break;
      }
    }

    if (!foundKeyword) {
      // Collect text until next keyword, paren, or comma
      let text = "";
      while (i < sql.length && sql[i] !== "(" && sql[i] !== ")" && sql[i] !== ",") {
        let foundNext = false;
        for (const keyword of sortedKeywords) {
          if (
            sql.substring(i, i + keyword.length).toUpperCase() === keyword.toUpperCase() &&
            (i + keyword.length >= sql.length || /\s/.test(sql[i + keyword.length]))
          ) {
            foundNext = true;
            break;
          }
        }
        if (foundNext) break;
        text += sql[i];
        i++;
      }
      if (text.trim()) {
        tokens.push({ type: "text", value: text.trim() });
      }
    }
  }

  return tokens;
}

// Helper function to get content inside parentheses
function getParenthesesContent(
  tokens: Array<{ type: string; value: string }>,
  startIndex: number,
): Array<{ type: string; value: string }> {
  const content: Array<{ type: string; value: string }> = [];
  let parenCount = 0;
  let i = startIndex + 1; // Skip the opening paren

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === "paren") {
      if (token.value === "(") {
        parenCount++;
      } else if (token.value === ")") {
        if (parenCount === 0) {
          break; // Found the matching closing paren
        }
        parenCount--;
      }
    }
    content.push(token);
    i++;
  }

  return content;
}

// Helper function to format tokens with proper indentation
function formatTokensWithIndentation(tokens: Array<{ type: string; value: string }>, indentSize: number): string {
  const indent = " ".repeat(indentSize);
  let result = "";
  let parenDepth = 0;
  let needsNewline = false;
  let simpleParenStack: boolean[] = []; // Track which parentheses are simple

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const currentIndent = " ".repeat(parenDepth * indentSize);

    if (token.type === "paren") {
      if (token.value === "(") {
        // Check if this should use multiline formatting
        // Look ahead to see if there are keywords (subqueries) or multiple items
        const parenContent = getParenthesesContent(tokens, i);
        const hasKeywords = parenContent.some(
          (t) =>
            t.type === "keyword" && ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY"].includes(t.value),
        );

        // Count commas to determine if we have multiple items
        const commaCount = parenContent.filter((t) => t.type === "comma").length;

        // Use multiline format if:
        // 1. Contains subquery keywords, OR
        // 2. Has multiple items (comma count > 0) in INSERT/VALUES context
        const isInsertContext = result.includes("INSERT INTO") || result.includes("VALUES");
        const shouldUseMultiline = hasKeywords || (commaCount > 0 && isInsertContext);

        if (shouldUseMultiline) {
          // Subquery or complex content - use new lines
          result += " (\n";
          parenDepth++;
          simpleParenStack.push(false);
          needsNewline = false;
        } else {
          // Simple content (like IN values) - keep on same line
          result += " (";
          simpleParenStack.push(true);
          needsNewline = false;
        }
      } else {
        // ')'
        const isSimple = simpleParenStack.pop() || false;
        if (isSimple) {
          // Simple paren - just close on same line
          result += ")";
        } else {
          // Complex paren - close with proper indentation
          parenDepth = Math.max(0, parenDepth - 1);
          result = result.trimEnd() + "\n" + " ".repeat(parenDepth * indentSize) + ")";
        }
        needsNewline = true;
      }
    } else if (token.type === "keyword") {
      const keywordsThatStartNewLine = [
        "SELECT",
        "FROM",
        "WHERE",
        "GROUP BY",
        "HAVING",
        "ORDER BY",
        "LIMIT",
        "UNION",
        "UNION ALL",
        "INTERSECT",
        "EXCEPT",
      ];
      const keywordsThatIndent = ["WHEN", "THEN", "ELSE", "ON", "AND", "OR"];
      const joinKeywords = ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "FULL JOIN", "JOIN"];

      if (keywordsThatStartNewLine.includes(token.value) || joinKeywords.includes(token.value)) {
        if (result && !result.endsWith("\n")) {
          result += "\n";
        }
        result += currentIndent + token.value;
        needsNewline = true;
      } else if (keywordsThatIndent.includes(token.value)) {
        if (result && !result.endsWith("\n")) {
          result += "\n";
        }
        result += currentIndent + indent + token.value;
        needsNewline = true;
      } else {
        // Other keywords like CASE, END
        if (needsNewline && result && !result.endsWith("\n")) {
          result += "\n";
        }
        if (result.endsWith("\n")) {
          result += currentIndent;
        } else if (result && !result.endsWith(" ")) {
          // Add space before keywords when not at start of line
          result += " ";
        }
        result += token.value;
        needsNewline = true;
      }
    } else if (token.type === "comma") {
      result += ",";

      // Check if we're in a field list context that should format with newlines
      const prevTokens = tokens.slice(Math.max(0, i - 10), i);

      // SELECT field list
      const inSelectFields =
        prevTokens.some((t) => t.type === "keyword" && t.value === "SELECT") &&
        !prevTokens
          .slice()
          .reverse()
          .find((t) => t.type === "keyword" && ["FROM", "WHERE"].includes(t.value));

      // INSERT/VALUES field list (when we're inside parentheses in multiline mode)
      const inMultilineParens =
        parenDepth > 0 && simpleParenStack.length > 0 && !simpleParenStack[simpleParenStack.length - 1];

      if (inSelectFields || inMultilineParens) {
        result += "\n" + currentIndent + indent;
        needsNewline = false;
      } else {
        needsNewline = true;
      }
    } else {
      // text
      if (needsNewline && !result.endsWith(" ") && !result.endsWith("\n")) {
        result += " ";
      }
      if (result.endsWith("\n")) {
        // Check if we're in multiline parentheses for proper indentation
        const inMultilineParens =
          parenDepth > 0 && simpleParenStack.length > 0 && !simpleParenStack[simpleParenStack.length - 1];
        if (inMultilineParens) {
          result += currentIndent + indent; // Always indent content in multiline parens
        } else {
          result += currentIndent + (needsNewline ? indent : "");
        }
      }
      result += token.value;
      needsNewline = false;
    }
  }

  // Clean up and return
  let cleaned = result.replace(/\n\s*\n/g, "\n").trim();

  // Remove any space before semicolon and add semicolon if not already present
  cleaned = cleaned.replace(/\s+;$/, ";");
  if (!cleaned.endsWith(";")) {
    cleaned += ";";
  }

  return cleaned;
}
