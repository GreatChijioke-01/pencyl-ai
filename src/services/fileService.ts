import { invoke } from "@tauri-apps/api/core";

export async function readFileContent(path: string): Promise<string> {
  return (await invoke("read_file", { path })) as string;
}

export async function writeFileContent(path: string, content: string): Promise<void> {
  await invoke("write_file", { path, content });
}

export async function runShellCommand(command: string): Promise<string> {
  return (await invoke("run_shell_command", { command })) as string;
}

export async function readDirContent(path: string): Promise<string[]> {
  return (await invoke("read_dir", { path })) as string[];
}

export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileNode[] | null;
}

export async function readDirTree(path: string): Promise<FileNode> {
  return (await invoke("read_dir_tree", { path })) as FileNode;
}
