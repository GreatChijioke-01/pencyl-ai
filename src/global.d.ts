export {};

declare global {
  // Used to pass project root from the app shell into AIChat without prop plumbing.
  // Sidebar can set: (globalThis as any).__PENCYL_PROJECT_ROOT_PATH = rootPath
  // when it loads/restores the folder.
  // eslint-disable-next-line no-var
  var __PENCYL_PROJECT_ROOT_PATH: string | null | undefined;
}

