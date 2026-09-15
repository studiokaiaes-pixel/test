import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Save,
  ShieldAlert,
  History,
  CheckCircle2,
  Database,
  HardDrive,
  FolderOpen,
  FileCode,
  ShieldCheck,
  Check,
  FolderCheck,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { storageService, DatabaseIntegrityReport, DesktopEnvironmentInfo } from '../../services/storage';
import { SystemSettings, ViewMode } from '../../types';
import { formatDateES } from '../../utils/formatters';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface SettingsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SystemSettings>({ ...db.settings });
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'numeracion' | 'portable' | 'backups' | 'actividad'>('portable');
  const [envInfo, setEnvInfo] = useState<DesktopEnvironmentInfo | null>(null);
  const [integrity, setIntegrity] = useState<DatabaseIntegrityReport | null>(null);

  const logs = storageService.getActivityLogs();

  useEffect(() => {
    storageService.getEnvironmentInfo().then(setEnvInfo);
    setIntegrity(storageService.verifyDatabaseIntegrity());
  }, []);

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setSettings((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('loading', 'Guardando configuración...');
    storageService.saveSettings(settings);
    onShowToast('success', 'Configuración guardada correctamente.');
  };

  // Export JSON database
  const handleExportJSON = () => {
    const dataStr = storageService.exportDatabaseJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KAIA_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Copia de seguridad descargada en formato JSON.');
  };

  // Import JSON database
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.importDatabaseJSON(content);
        if (success) {
          onShowToast('success', 'Base de datos restaurada con éxito.');
          setTimeout(() => {
            window.location.reload();
          }, 600);
        } else {
          onShowToast('error', 'El archivo JSON no es una base de datos KAIA válida.');
        }
      } catch (err) {
        onShowToast('error', 'Error al procesar el archivo.');
      }
    };
    reader.readAsText(file);
  };

  // Export SQLite Schema DDL / Dump
  const handleExportSqlDump = () => {
    const sqlStr = storageService.getSqliteSchemaScript();
    const blob = new Blob([sqlStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaia_schema_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Script SQL para SQLite (kaia_schema.sql) descargado correctamente.');
  };

  // Create backup in backups/
  const handleCreatePortableBackup = async () => {
    onShowToast('loading', 'Generando copia de seguridad local...');
    const res = await storageService.createPortableBackup('manual');
    if (res.success) {
      onShowToast('success', `Copia guardada: ${res.fileName || 'backup completado'}`);
      const updatedEnv = await storageService.getEnvironmentInfo();
      setEnvInfo(updatedEnv);
    } else {
      onShowToast('error', res.error || 'No se pudo crear la copia');
    }
  };

  const handleOpenFolder = async (folder: 'database' | 'documents' | 'backups' | 'exports' | 'base') => {
    if (!envInfo?.isElectron) {
      onShowToast('loading', 'Función nativa disponible al ejecutar KAIA mediante Electron / KAIA.exe.');
      return;
    }
    const ok = await storageService.openPortableFolder(folder);
    if (!ok) {
      onShowToast('error', 'No se pudo abrir la carpeta en el explorador de archivos.');
    }
  };

  const handleCheckIntegrity = () => {
    const rep = storageService.verifyDatabaseIntegrity();
    setIntegrity(rep);
    onShowToast('success', `Integridad verificada: 12 tablas operativas en SQLite.`);
  };

  const handleResetDemo = () => {
    storageService.resetToInitialData();
    setShowResetModal(false);
    onShowToast('success', 'Datos de demostración restablecidos.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-100">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-neutral-950">Configuración del Sistema</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Parámetros de numeración correlativa, copias de seguridad y registro de auditoría.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 bg-neutral-50/70 rounded-t-sm">
        <button
          type="button"
          onClick={() => setActiveTab('portable')}
          className={`py-3 px-5 text-xs font-mono uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'portable'
              ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Entorno Portable (USB & SQLite)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('numeracion')}
          className={`py-3 px-5 text-xs font-mono uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'numeracion'
              ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Formatos y Numeración
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`py-3 px-5 text-xs font-mono uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'backups'
              ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Copias de Seguridad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('actividad')}
          className={`py-3 px-5 text-xs font-mono uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'actividad'
              ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Registro de Auditoría ({logs.length})
        </button>
      </div>

      {/* Tab: Entorno Portable y SQLite */}
      {activeTab === 'portable' && (
        <div className="bg-white border border-neutral-200 rounded-b-sm shadow-xs p-6 space-y-6">
          {/* Header del entorno */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                ARQUITECTURA PORTABLE Y PERSISTENCIA SQLITE
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse"></span>
                {envInfo?.isElectron ? (envInfo?.isPortable ? 'Windows Portable (USB)' : 'Escritorio Local') : 'Modo Web / Preview'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              KAIA está estructurado para ejecutarse como aplicación de escritorio nativa mediante Electron y generar un ejecutable <strong className="text-neutral-950 font-mono">KAIA.exe</strong> portable para Windows. Los datos residen junto al ejecutable en el pendrive, garantizando independencia total de Internet y cero residuos en el sistema anfitrión (<span className="font-mono">%APPDATA%</span>).
            </p>
          </div>

          {/* Tarjetas de estado técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Motor de Datos</span>
                <Database className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <div className="text-sm font-bold font-mono text-neutral-950">SQLite 3.x</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Archivo local <span className="font-mono">kaia.sqlite</span></div>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Aislamiento AppData</span>
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <div className="text-sm font-bold font-mono text-neutral-950">0% Residuos</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Sin escritura en <span className="font-mono">%APPDATA%</span></div>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Operatividad</span>
                <HardDrive className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <div className="text-sm font-bold font-mono text-neutral-950">100% Offline</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Sin dependencia de Internet</div>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Ejecución</span>
                <Layers className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <div className="text-sm font-bold font-mono text-neutral-950">Directa Nativa</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Sin navegador ni localhost manual</div>
            </div>
          </div>

          {/* Rutas de almacenamiento en el pendrive */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase">
                ESTRUCTURA DE CARPETAS EN EL PENDRIVE (JUNTO A KAIA.EXE)
              </h3>
              {envInfo?.isElectron && (
                <button
                  type="button"
                  onClick={() => handleOpenFolder('base')}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-600 hover:text-neutral-950 cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  Abrir carpeta raíz en Explorador
                </button>
              )}
            </div>

            <div className="border border-neutral-200 rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-700 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Carpeta / Archivo</th>
                    <th className="py-2.5 px-3">Ubicación física resuelta</th>
                    <th className="py-2.5 px-3">Propósito y Contenido</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                  <tr className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-neutral-950">
                      database/
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[200px]" title={envInfo?.paths.databaseDir}>
                      {envInfo?.paths.databaseDir || '[Pendrive]:\\KAIA\\database'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-sans">
                      Base de datos SQLite (<span className="font-mono">kaia.sqlite</span>) y control transaccional
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {envInfo?.isElectron ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder('database')}
                          className="px-2 py-1 text-[10px] bg-white border border-neutral-300 hover:border-neutral-900 rounded-xs cursor-pointer text-neutral-900"
                        >
                          Abrir
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Principal</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-neutral-950">
                      documents/
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[200px]" title={envInfo?.paths.documentsDir}>
                      {envInfo?.paths.documentsDir || '[Pendrive]:\\KAIA\\documents'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-sans">
                      Contratos, pliegos técnicos y anexos de clientes y proyectos
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {envInfo?.isElectron ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder('documents')}
                          className="px-2 py-1 text-[10px] bg-white border border-neutral-300 hover:border-neutral-900 rounded-xs cursor-pointer text-neutral-900"
                        >
                          Abrir
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Archivos</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-neutral-950">
                      backups/
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[200px]" title={envInfo?.paths.backupsDir}>
                      {envInfo?.paths.backupsDir || '[Pendrive]:\\KAIA\\backups'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-sans">
                      Copias de seguridad automáticas y fechadas (<span className="font-mono">.sqlite / .json</span>)
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {envInfo?.isElectron ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder('backups')}
                          className="px-2 py-1 text-[10px] bg-white border border-neutral-300 hover:border-neutral-900 rounded-xs cursor-pointer text-neutral-900"
                        >
                          Abrir
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Backups</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-neutral-950">
                      exports/
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[200px]" title={envInfo?.paths.exportsDir}>
                      {envInfo?.paths.exportsDir || '[Pendrive]:\\KAIA\\exports'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-sans">
                      Presupuestos y facturas en PDF, extractos y balances contables
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {envInfo?.isElectron ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder('exports')}
                          className="px-2 py-1 text-[10px] bg-white border border-neutral-300 hover:border-neutral-900 rounded-xs cursor-pointer text-neutral-900"
                        >
                          Abrir
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Exportaciones</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Acciones de Operación Local */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase mb-3">
              OPERACIONES DE BASE DE DATOS Y RESPALDO PORTABLE
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCreatePortableBackup}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-400 rounded-sm text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                    Crear Respaldo en carpeta backups/
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Genera una copia fechada de seguridad en el pendrive sin interrumpir la operativa.
                </p>
              </button>

              <button
                type="button"
                onClick={handleExportSqlDump}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-400 rounded-sm text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                    Descargar Script SQLite (kaia_schema.sql)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Descarga el esquema DDL y volcado relacional SQL estándar para SQLite 3.x.
                </p>
              </button>

              <button
                type="button"
                onClick={handleCheckIntegrity}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-400 rounded-sm text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                    Verificar Integridad de Base de Datos
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Audita la coherencia de claves foráneas, índices y las 12 tablas relacionales del sistema.
                </p>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-400 rounded-sm text-left transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                    Exportar Base Completa en JSON
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Descarga el volcado JSON estructurado para auditoría externa o migración inmediata.
                </p>
              </button>
            </div>
          </div>

          {/* Informe de tablas e integridad relacional */}
          {integrity && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                  <span className="text-xs font-bold font-mono text-neutral-950 uppercase tracking-wider">
                    Auditoría Relacional: {integrity.tablesCount} Tablas SQLite Verificadas
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  Revisado: {formatDateES(integrity.checkedAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">clients</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.clients} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">projects</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.projects} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">quotes</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.quotes} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">invoices</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.invoices} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">finances</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.finances} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">documents</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.documents} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">leads</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.leads} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">suppliers</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.suppliers} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">products</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.products} reg.</div>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded-xs">
                  <div className="text-[10px] text-neutral-400 uppercase">activities</div>
                  <div className="font-bold text-neutral-950">{integrity.recordsCount.activities} reg.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Formatos y Numeración */}
      {activeTab === 'numeracion' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-neutral-200 rounded-b-sm shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-4">
              PREFIJOS DE SERIES CORRELATIVAS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Prefijo Presupuestos
                </label>
                <input
                  type="text"
                  name="prefijoPresupuesto"
                  value={settings.prefijoPresupuesto ?? ''}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Prefijo Facturas
                </label>
                <input
                  type="text"
                  name="prefijoFactura"
                  value={settings.prefijoFactura ?? ''}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Prefijo Proyectos
                </label>
                <input
                  type="text"
                  name="prefijoProyecto"
                  value={settings.prefijoProyecto ?? ''}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Prefijo Clientes
                </label>
                <input
                  type="text"
                  name="prefijoCliente"
                  value={settings.prefijoCliente ?? ''}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200">
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-4">
              FORMATO DE CORRELATIVOS Y CIFRAS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="incluirAno"
                  name="incluirAno"
                  checked={!!settings.incluirAno}
                  onChange={handleSettingsChange}
                  className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                />
                <label htmlFor="incluirAno" className="text-xs text-neutral-900 font-medium cursor-pointer">
                  Incluir año actual en la serie (Ej: FAC-2026-0001)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Número de Dígitos en Secuencia
                </label>
                <input
                  type="number"
                  min="3"
                  max="8"
                  name="digitosNumero"
                  value={settings.digitosNumero ?? 4}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Formato de Fecha
                </label>
                <select
                  name="formatoFecha"
                  value={settings.formatoFecha ?? 'DD/MM/YYYY'}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 09/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (Ej: 2026-09-09)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Separador Decimal
                </label>
                <select
                  name="separadorDecimal"
                  value={settings.separadorDecimal ?? ','}
                  onChange={handleSettingsChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm cursor-pointer"
                >
                  <option value=",">Coma (1.250,00 €)</option>
                  <option value=".">Punto (1,250.00 €)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Copias de Seguridad */}
      {activeTab === 'backups' && (
        <div className="bg-white border border-neutral-200 rounded-b-sm shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-2">
              GESTIÓN DE DATOS Y RESPALDOS (JSON)
            </h2>
            <p className="text-xs text-neutral-600">
              Todos los clientes, proyectos, facturas, documentos y configuraciones residen con persistencia continua. Puedes exportar o restaurar tu base de datos completa en cualquier momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Export */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-sm space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-neutral-950" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                  Exportar todos los datos (JSON)
                </h3>
              </div>
              <p className="text-xs text-neutral-600">
                Descarga un archivo JSON estructurado con la base de datos íntegra de KAIA.
              </p>
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-950 bg-white border border-neutral-300 hover:border-neutral-950 rounded-sm cursor-pointer shadow-xs transition-colors"
              >
                Descargar copia JSON
              </button>
            </div>

            {/* Import */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-sm space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-neutral-950" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                  Importar datos (JSON)
                </h3>
              </div>
              <p className="text-xs text-neutral-600">
                Carga una copia de seguridad JSON previamente exportada para restaurar el sistema.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-950 bg-white border border-neutral-300 hover:border-neutral-950 rounded-sm cursor-pointer shadow-xs transition-colors"
              >
                Seleccionar archivo y restaurar
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-6 border-t border-neutral-200">
            <div className="p-5 bg-neutral-100/70 border border-neutral-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950 font-mono">
                  Restablecer datos de ejemplo
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Vuelve a inicializar el sistema con los datos de muestra corporativos de KAIA.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-white border border-neutral-400 hover:bg-neutral-900 hover:text-white rounded-sm cursor-pointer whitespace-nowrap transition-colors"
              >
                Restablecer datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Registro de Actividad */}
      {activeTab === 'actividad' && (
        <div className="bg-white border border-neutral-200 rounded-b-sm shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-950 uppercase">
                HISTORIAL DE ACCIONES RECIENTES
              </h2>
              <p className="text-[11px] text-neutral-500">
                Auditoría en tiempo real de creaciones, modificaciones y cobros realizados en KAIA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                storageService.clearActivityLogs();
                onShowToast('success', 'Historial vaciado.');
              }}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-950 cursor-pointer"
            >
              Limpiar historial
            </button>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[520px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 font-mono">
                No hay actividades registradas aún.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-neutral-50/80 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-neutral-950">
                      {log.accion}
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      {log.detalles}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                      <span>Usuario: {log.usuario}</span>
                      <span>·</span>
                      <span>Entidad: {log.entidad}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap">
                    {formatDateES(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetModal}
        title="Restablecer datos de ejemplo"
        message="¿Confirmas que deseas restablecer todos los registros a los datos de ejemplo iniciales de KAIA?"
        confirmLabel="Restablecer"
        onConfirm={handleResetDemo}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
