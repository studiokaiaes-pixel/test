import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserPlus,
  DollarSign,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Opportunity, CommercialStage, ViewMode } from '../../types';
import { formatCurrency, formatDateES, generateNextId, getTodayISO } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';

interface CommercialPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

const STAGES: CommercialStage[] = [
  'Contacto',
  'Cualificación',
  'Propuesta',
  'Negociación',
  'Ganado',
  'Perdido',
];

export const CommercialPage: React.FC<CommercialPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const opportunities = db.commercial;

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('Todos');

  // Form state for new opportunity
  const [titulo, setTitulo] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [valorEstimado, setValorEstimado] = useState<number>(0);
  const [probabilidad, setProbabilidad] = useState<number>(50);
  const [fase, setFase] = useState<CommercialStage>('Contacto');
  const [responsable, setResponsable] = useState('Equipo Comercial KAIA');
  const [proximoPaso, setProximoPaso] = useState('');
  const [fechaCierre, setFechaCierre] = useState(getTodayISO());

  // Pipeline total metrics
  const totalPipeline = opportunities
    .filter((o) => o.fase !== 'Perdido')
    .reduce((acc, curr) => acc + curr.valorEstimado, 0);

  const totalWon = opportunities
    .filter((o) => o.fase === 'Ganado')
    .reduce((acc, curr) => acc + curr.valorEstimado, 0);

  const handleStageChange = (opp: Opportunity, newStage: CommercialStage) => {
    const updated = {
      ...opp,
      fase: newStage,
    };
    storageService.saveOpportunity(updated);
    onShowToast('success', `Oportunidad movida a ${newStage}.`);
  };

  const handleConvertLead = (opp: Opportunity) => {
    // 1. Create client if needed
    const existingIds = db.clients.map((c) => c.id);
    const newClientId = generateNextId('CLI', existingIds, false);

    storageService.saveClient({
      id: newClientId,
      nombre: opp.clienteNombre || 'Lead',
      apellidos: '',
      empresa: opp.empresa || opp.clienteNombre || 'Empresa Lead',
      cif: '',
      email: opp.email || '',
      telefono: opp.telefono || '',
      direccion: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
      estado: 'Activo',
      fechaAlta: getTodayISO(),
      fechaModificacion: getTodayISO(),
      notas: `Convertido automáticamente desde la oportunidad comercial ${opp.id}`,
    });

    // 2. Create associated project
    const projIds = db.projects.map((p) => p.id);
    const newProjId = generateNextId('PRO', projIds, false);

    storageService.saveProject({
      id: newProjId,
      titulo: opp.titulo || 'Nuevo Proyecto',
      clienteId: newClientId,
      servicio: 'Consultoría y Desarrollo Comercial',
      descripcion: `Proyecto iniciado tras cerrar la oportunidad comercial ${opp.titulo || ''}. Próximo paso fijado: ${opp.proximoPaso || ''}`,
      estado: 'En preparación',
      fechaInicio: getTodayISO(),
      fechaPrevista: opp.fechaPrevistaCierre || getTodayISO(),
      importe: opp.valorEstimado || 0,
      responsable: opp.responsable || 'Equipo KAIA',
      tareas: [{ id: '1', texto: 'Reunión de onboarding y kick-off', completada: false }],
      notas: '',
      fechaCreacion: getTodayISO(),
      fechaModificacion: getTodayISO(),
    });

    // 3. Mark opp as Ganado & link
    const updated = {
      ...opp,
      fase: 'Ganado' as CommercialStage,
      clienteId: newClientId,
    };
    storageService.saveOpportunity(updated);

    onShowToast('success', `Oportunidad convertida en Cliente (${newClientId}) y Proyecto (${newProjId}).`);
    onNavigate('project-detail', newProjId);
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !clienteNombre.trim()) {
      onShowToast('error', 'Indica el título de la oportunidad y el nombre del lead.');
      return;
    }

    const newOpp: Opportunity = {
      id: `LEAD-${Date.now().toString().slice(-4)}`,
      titulo: titulo.trim(),
      clienteNombre: clienteNombre.trim(),
      empresa: empresa.trim(),
      email,
      telefono,
      valorEstimado,
      probabilidad,
      fase,
      responsable,
      proximoPaso,
      fechaPrevistaCierre: fechaCierre,
      fechaCreacion: getTodayISO(),
    };

    storageService.saveOpportunity(newOpp);
    setShowAddForm(false);
    setTitulo('');
    setClienteNombre('');
    setEmpresa('');
    setValorEstimado(0);
    onShowToast('success', 'Oportunidad añadida al embudo comercial.');
  };

  const handleDelete = (id: string) => {
    storageService.deleteOpportunity(id);
    onShowToast('success', 'Oportunidad eliminada.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Comercial</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Embudo de oportunidades comerciales, cualificación de leads y conversión en clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cerrar formulario' : 'Añadir oportunidad'}</span>
          </button>
        </div>
      </div>

      {/* Pipeline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
            Volumen Total en Pipeline
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-950">
            {formatCurrency(totalPipeline)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {opportunities.filter((o) => o.fase !== 'Perdido' && o.fase !== 'Ganado').length} activas en proceso
          </div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
            Ventas Cerradas (Ganadas)
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-950">
            {formatCurrency(totalWon)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {opportunities.filter((o) => o.fase === 'Ganado').length} tratos cerrados con éxito
          </div>
        </div>

        <div className="p-4 bg-neutral-950 text-white rounded-sm shadow-xs">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
            Ratio de Conversión
          </span>
          <div className="text-2xl font-bold font-mono text-white">
            {opportunities.length > 0
              ? `${Math.round(
                  (opportunities.filter((o) => o.fase === 'Ganado').length / opportunities.length) * 100
                )}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Sobre oportunidades totales</div>
        </div>
      </div>

      {/* Formulario para crear oportunidad */}
      {showAddForm && (
        <div className="bg-white border border-neutral-950 p-6 rounded-sm shadow-sm space-y-4 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-950">
              NUEVA OPORTUNIDAD COMERCIAL
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-950"
            >
              CERRAR
            </button>
          </div>

          <form onSubmit={handleCreateOpportunity} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">Título de la Oportunidad *</label>
              <input
                type="text"
                value={titulo ?? ''}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Expansión de infraestructura de nube híbrida"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Fase Inicial</label>
              <select
                value={fase ?? 'Contacto'}
                onChange={(e) => setFase(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-semibold"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Nombre del Lead / Contacto *</label>
              <input
                type="text"
                value={clienteNombre ?? ''}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: Roberto Salas"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Empresa</label>
              <input
                type="text"
                value={empresa ?? ''}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ej: Inversiones Valterra S.L."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Valor Estimado (€)</label>
              <input
                type="number"
                step="0.01"
                value={valorEstimado ?? 0}
                onChange={(e) => setValorEstimado(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Probabilidad (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probabilidad ?? 50}
                onChange={(e) => setProbabilidad(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Próximo Paso</label>
              <input
                type="text"
                value={proximoPaso ?? ''}
                onChange={(e) => setProximoPaso(e.target.value)}
                placeholder="Ej: Enviar propuesta económica revisada"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Fecha Prevista de Cierre</label>
              <input
                type="date"
                value={fechaCierre ?? ''}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div className="flex items-end justify-end md:col-span-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
              >
                Guardar Oportunidad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pipeline Stages Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.fase === stage);
          const stageValue = stageOpps.reduce((acc, c) => acc + c.valorEstimado, 0);

          return (
            <div key={stage} className="bg-neutral-50 border border-neutral-200 rounded-sm flex flex-col min-h-[420px]">
              {/* Stage Header */}
              <div className="p-3 border-b border-neutral-200 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                    {stage}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-100 rounded text-neutral-600">
                    {stageOpps.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">
                  {formatCurrency(stageValue)}
                </div>
              </div>

              {/* Opp Cards */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3 bg-white border border-neutral-200 rounded-sm shadow-xs space-y-2 group hover:border-neutral-400 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block">{opp.id}</span>
                      <h4 className="text-xs font-bold text-neutral-950 leading-snug">{opp.titulo}</h4>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {opp.empresa ? `${opp.empresa} (${opp.clienteNombre})` : opp.clienteNombre}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-neutral-100">
                      <span className="font-bold text-neutral-950">{formatCurrency(opp.valorEstimado)}</span>
                      <span className="text-[10px] text-neutral-500">{opp.probabilidad}% prob.</span>
                    </div>

                    {opp.proximoPaso && (
                      <div className="text-[10px] text-neutral-500 italic bg-neutral-50 p-1.5 rounded-xs">
                        Paso: {opp.proximoPaso}
                      </div>
                    )}

                    {/* Stage transition controls & Convert button */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-1">
                      <select
                        value={opp.fase ?? 'Prospecto'}
                        onChange={(e) => handleStageChange(opp, e.target.value as CommercialStage)}
                        className="text-[10px] font-mono bg-neutral-50 border border-neutral-200 rounded-xs py-1 px-1 cursor-pointer"
                      >
                        {STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        {opp.fase !== 'Ganado' && (
                          <button
                            type="button"
                            onClick={() => handleConvertLead(opp)}
                            className="p-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-xs cursor-pointer"
                            title="Convertir en Cliente y Proyecto"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(opp.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-950 rounded-xs cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {stageOpps.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-neutral-400">
                    Vacío
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
