interface FormatOptions {
  indentSize?: number;
}

export function formatSql(sql: string, options: FormatOptions = {}): string {
  const indentSize = options.indentSize ?? 2;
  const indent = ' '.repeat(indentSize);
  const doubleIndent = ' '.repeat(indentSize * 2);
  // Keywords that should start at the beginning of a line
  const mainKeywords = [
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
  ];

  // JOIN keywords need special handling to avoid conflicts
  const joinKeywords = [
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "FULL JOIN"
  ];

  // Keywords that should be indented (now handled separately in different logic)

  // Remove all existing whitespace and normalize
  const normalized = sql.replace(/\s+/g, " ").trim();

  let formatted = normalized;

  // Handle SELECT field formatting FIRST (before keywords get newlines)
  // Single vs multi-field logic
  const selectRegex = new RegExp(`\\bSELECT\\b(.*?)(?=\\s+FROM\\b|$)`, "gi");
  formatted = formatted.replace(selectRegex, (match, fields) => {
    // Count commas to determine if we have multiple fields
    // We need to be careful about commas inside parentheses (like function calls)
    let commaCount = 0;
    let parenDepth = 0;
    for (let i = 0; i < fields.length; i++) {
      const char = fields[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === ',' && parenDepth === 0) commaCount++;
    }

    if (commaCount > 0) {
      // Multiple fields - put SELECT alone on line, indent fields
      let fieldsPart = fields.trim();
      // Add newlines and indentation after commas (but not inside parentheses)
      let result = '';
      let currentParenDepth = 0;
      for (let i = 0; i < fieldsPart.length; i++) {
        const char = fieldsPart[i];
        if (char === '(') currentParenDepth++;
        else if (char === ')') currentParenDepth--;
        else if (char === ',' && currentParenDepth === 0) {
          result += `,\n${indent}`;
          // Skip any whitespace after the comma
          while (i + 1 < fieldsPart.length && /\s/.test(fieldsPart[i + 1])) {
            i++;
          }
          continue;
        }
        result += char;
      }
      return `SELECT\n${indent}${result}`;
    } else {
      // Single field - keep on same line but ensure proper spacing
      return `SELECT${fields}`;
    }
  });

  // Add newlines before main keywords
  mainKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, `\n${keyword}`);
  });

  // Handle JOIN keywords separately (longest first to avoid conflicts)
  const sortedJoinKeywords = [...joinKeywords].sort((a, b) => b.length - a.length);
  sortedJoinKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, `\n${keyword}`);
  });

  // Handle standalone JOIN (not preceded by LEFT, RIGHT, INNER, OUTER, or FULL)
  const standaloneJoinRegex = new RegExp(`(?<!\\b(?:LEFT|RIGHT|INNER|OUTER|FULL)\\s)\\bJOIN\\b`, "gi");
  formatted = formatted.replace(standaloneJoinRegex, `\nJOIN`);

  // Handle multi-clause formatting for WHERE/HAVING with AND/OR
  // First, handle multi-clause conditions (put keyword on separate line when multiple clauses)
  const multiClauseKeywords = ["WHERE", "HAVING"];
  multiClauseKeywords.forEach((keyword) => {
    const keywordRegex = new RegExp(`\\b${keyword}\\b([^\\n]+)`, "gi");
    formatted = formatted.replace(keywordRegex, (match, conditions) => {
      // Count AND/OR occurrences to determine if we have multiple clauses
      const andOrCount = (conditions.match(/\b(AND|OR)\b/gi) || []).length;

      if (andOrCount > 0) {
        // Multiple clauses - put keyword alone on line, indent conditions
        let conditionsPart = conditions.trim();
        // Add newlines and indentation before AND/OR
        conditionsPart = conditionsPart.replace(/\b(AND|OR)\b/gi, `\n${indent}$1`);
        return `${keyword}\n${indent}${conditionsPart}`;
      } else {
        // Single clause - keep on same line
        return match;
      }
    });
  });

  // Handle ON clauses for JOINs - always indented on new line
  const onRegex = new RegExp(`\\b(ON)\\b`, "gi");
  formatted = formatted.replace(onRegex, `\n${indent}$1`);

  // Handle other indent keywords that aren't part of WHERE/HAVING multi-clause logic
  const simpleIndentKeywords = ["WHEN", "THEN", "ELSE"];
  simpleIndentKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, `\n${indent}${keyword}`);
  });

  // Clean up multiple newlines and trim
  formatted = formatted.replace(/\n\s*\n/g, "\n").trim();

  // Handle commas in other contexts (not SELECT, since we handled that above)
  // This handles INSERT/UPDATE SET clauses, etc.
  formatted = formatted.replace(/,\s*(?=\w)(?!.*SELECT)/g, `,\n${indent}`);

  // Handle parentheses indentation
  formatted = formatted.replace(/\(\s*/g, `(\n${doubleIndent}`);
  formatted = formatted.replace(/\s*\)/g, `\n${indent})`);

  // Remove trailing whitespace from each line
  formatted = formatted.replace(/[ \t]+$/gm, "");

  return formatted;
}
