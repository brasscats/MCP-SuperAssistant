import { createStorage, StorageEnum } from '../base/index.js';
import type { SupabaseProject, SupabaseSecrets } from '@repo/shared/src/types/supabase.js';

/**
 * Storage area for the list of registered Supabase projects.
 */
const projectStorage = createStorage<SupabaseProject[]>('supabase-projects', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

/**
 * Storage area for active project alias.
 */
const activeProjectStorage = createStorage<string | null>('active-supabase-project', null, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const supabaseProjectRegistry = {
  async list() {
    return projectStorage.get();
  },
  async add(project: SupabaseProject) {
    await projectStorage.set(prev => [...prev, project]);
  },
  async update(alias: string, update: Partial<SupabaseProject>) {
    await projectStorage.set(prev => prev.map(p => (p.alias === alias ? { ...p, ...update } : p)));
  },
  async remove(alias: string) {
    await projectStorage.set(prev => prev.filter(p => p.alias !== alias));
  },
  async setActive(alias: string | null) {
    await activeProjectStorage.set(alias);
  },
  async getActive() {
    return activeProjectStorage.get();
  },
};

/**
 * Secrets storage per vaultId. The consumer is responsible for providing
 * an encryption layer before persisting secrets.
 */
const secretStorage = createStorage<Record<string, SupabaseSecrets>>(
  'supabase-vault',
  {},
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: false,
  },
);

export const supabaseVault = {
  async get(vaultId: string) {
    const vault = await secretStorage.get();
    return vault[vaultId];
  },
  async set(vaultId: string, secrets: SupabaseSecrets) {
    await secretStorage.set(prev => ({ ...prev, [vaultId]: secrets }));
  },
  async remove(vaultId: string) {
    await secretStorage.set(prev => {
      const next = { ...prev };
      delete next[vaultId];
      return next;
    });
  },
};
