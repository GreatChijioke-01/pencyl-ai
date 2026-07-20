const INTERACTIVE_BLOCKLIST = [
  "nano",
  "vim",
  "vi",
  "top",
  "htop",
  "less",
  "more",
  "watch",
  "bash",
  "sh",
  "powershell",
  "pwsh",
  "cmd",
  "powershell.exe",
  "cmd.exe",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractRunCommand(aiResponse: string): string | null {
  const marker = "[RUN_COMMAND:";
  if (!aiResponse.includes(marker)) return null;

  const after = aiResponse.split(marker)[1];
  const command = after.split("]")[0]?.trim();
  return command || null;
}

export function extractFileDiffs(
  aiResponse: string
): Array<{ path: string; content: string }> {
  const results: Array<{ path: string; content: string }> = [];

  const pathRe = /\[FILE_PATH:\s*([^\]]+?)\s*\]/g;
  const paths: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pathRe.exec(aiResponse))) {
    paths.push(match[1].trim());
  }

  if (paths.length > 0) {
    for (const filePath of paths) {
      const fileSectionRe = new RegExp(
        `\\[FILE_PATH:\\s*${escapeRegExp(filePath)}\\s*\\][\\s\\S]*?\\[FILE_CONTENT\\]([\\s\\S]*?)\\[/FILE_CONTENT\\]`,
        "i"
      );
      const sectionMatch = aiResponse.match(fileSectionRe);
      if (sectionMatch?.[1] != null) {
        results.push({
          path: filePath,
          content: sectionMatch[1].replace(/^\n/, "").replace(/\n$/, ""),
        });
      }
    }
    return results;
  }

  const jsonMatch = aiResponse.match(/\{[\s\S]*"files"[\s\S]*\}/m);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        files?: Array<{ path?: string; content?: string }>;
      };
      if (parsed?.files && Array.isArray(parsed.files)) {
        for (const file of parsed.files) {
          if (file?.path && typeof file.content === "string") {
            results.push({ path: file.path, content: file.content });
          }
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  return results;
}

export function stripStructuredBlocks(text: string): string {
  return text
    .replace(/\[FILE_PATH:[^\]]+\][\s\S]*?\[\/FILE_CONTENT\]/gi, "")
    .replace(/\[RUN_COMMAND:[^\]]+\]/gi, "")
    .replace(/\{[\s\S]*"files"[\s\S]*\}/m, "")
    .trim();
}

export function isBlockedInteractiveCommand(command: string): boolean {
  const normalized = command.toLowerCase();
  return INTERACTIVE_BLOCKLIST.some((blocked) => {
    const tokenBoundary = new RegExp(
      `(^|\\s|;|&&|\\|)${blocked.toLowerCase()}($|\\s|;|&&|\\|)`,
      "i"
    );
    return tokenBoundary.test(normalized);
  });
}

export function getMessageMeta(text: string) {
  return {
    files: extractFileDiffs(text).map((file) => file.path),
    command: extractRunCommand(text),
    body: stripStructuredBlocks(text),
  };
}
