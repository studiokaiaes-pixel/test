import { KaiaDatabase } from '../../types';

export type StorageEngineType = 'electron-sqlite' | 'browser-localstorage';

export interface PortableDirectoryStructure {
  baseDir: string;
  databaseDir: string;
  documentsDir: string;
  backupsDir: string;
  exportsDir: string;
  dbSqlitePath: string;
  dbJsonPath: string;
  schemaSqlPath: string;
}

export interface DesktopEnvironmentInfo {
  isElectron: boolean;
  isPortable: boolean;
  isDev: boolean;
  platform: 'win32' | 'darwin' | 'linux' | 'browser';
  storageEngine: StorageEngineType;
  paths: PortableDirectoryStructure;
  counts: {
    backups: number;
    documents: number;
    exports: number;
  };
  lastSync?: string;
  dbSizeBytes?: number;
}

export interface BackupResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  timestamp: string;
}

export interface DatabaseIntegrityReport {
  isValid: boolean;
  tablesCount: number;
  recordsCount: {
    clients: number;
    projects: number;
    quotes: number;
    invoices: number;
    finances: number;
    documents: number;
    leads: number;
    suppliers: number;
    products: number;
    activities: number;
  };
  checkedAt: string;
  storageEngine: StorageEngineType;
  portableReady: boolean;
}

export interface IStorageAdapter {
  init(): Promise<KaiaDatabase>;
  read(): Promise<KaiaDatabase | null>;
  write(database: KaiaDatabase): Promise<boolean>;
  createBackup(note?: string): Promise<BackupResult>;
  getEnvironmentInfo(): Promise<DesktopEnvironmentInfo>;
}
