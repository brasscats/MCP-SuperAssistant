export interface SupabaseProject {
  alias: string;
  projectRef: string;
  role: 'dev' | 'pm' | 'readOnly';
  vaultId: string;
  /** Indicates this project points to a local Supabase instance */
  isLocal?: boolean;
}

export interface SupabaseSecrets {
  SUPABASE_URL: string;
  ANON_KEY: string;
  SERVICE_KEY?: string;
}

export interface BranchAliasMap {
  [pattern: string]: string;
}
