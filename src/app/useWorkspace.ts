import { useSyncExternalStore } from 'react';
import { workspace } from './workspace';
export function useWorkspace() { return useSyncExternalStore(workspace.subscribe, workspace.getSnapshot); }
