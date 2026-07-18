export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileNode[] | null;
}
