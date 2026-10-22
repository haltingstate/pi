/** Split a leading UTF-8 byte order mark from decoded text. */
export function splitBom(content: string): { bom: string; text: string } {
	return content.startsWith("\uFEFF") ? { bom: "\uFEFF", text: content.slice(1) } : { bom: "", text: content };
}

/** Remove a leading UTF-8 byte order mark from decoded text. */
export function stripBom(content: string): string {
	return splitBom(content).text;
}

/**
 * Remove whole-line HTML comments (`<!-- ... -->`) from a context file.
 *
 * Claude Code skips whole-line HTML comments in `CLAUDE.md`, so maintainers use
 * them for notes that must not reach the model. Pi reads context files verbatim,
 * so without this step the same file sends those notes to the model as prompt
 * text.
 *
 * A comment is removed only when it starts a line and ends on a line of its own,
 * so a comment that shares a line with rule text is kept and no rule is lost.
 * A `<!--` that never closes is left in place, because the file is malformed and
 * guessing where the comment ends would delete rule text.
 */
export function stripHtmlComments(content: string): string {
	if (!content.includes("<!--")) {
		return content;
	}
	const lines = content.split("\n");
	const kept: string[] = [];
	let inComment = false;
	let removed = false;
	for (const line of lines) {
		if (inComment) {
			removed = true;
			if (line.includes("-->")) {
				inComment = false;
			}
			continue;
		}
		if (line.trimStart().startsWith("<!--")) {
			removed = true;
			// A comment that opens and closes on this line is fully removed.
			if (!line.includes("-->")) {
				inComment = true;
			}
			continue;
		}
		kept.push(line);
	}
	if (!removed) {
		return content;
	}
	// A comment that never closes swallowed the rest of the file, so keep the original.
	if (inComment) {
		return content;
	}
	// Collapse the run of blank lines that removing a comment block leaves behind.
	return kept.join("\n").replace(/\n{3,}/g, "\n\n");
}
