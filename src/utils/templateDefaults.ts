import { DocumentTemplateConfig, TemplateModelId } from '../types';

export interface TemplateModelInfo {
  id: TemplateModelId;
  nombre: string;
  descripcion: string;
  estiloVisual: string;
  recomendadoPara: string;
}

export const TEMPLATE_MODELS: TemplateModelInfo[] = [
  {
    id: 'minimalista',
    nombre: 'Suizo Minimalista',
    descripcion: 'Diseño sobrio, líneas finas, tipografía cuidada y máxima legibilidad.',
    estiloVisual: 'Líneas sutiles · Tarjeta limpia · Monocromo',
    recomendadoPara: 'Estudios de diseño, consultoría, arquitectura y servicios profesionales.',
  },
  {
    id: 'ejecutivo',
    nombre: 'Corporativo / Ejecutivo',
    descripcion: 'Banda superior con color de acento, cabeceras de tabla destacadas y aspecto corporativo.',
    estiloVisual: 'Banda superior · Encabezados sólidos · Bloques estructurados',
    recomendadoPara: 'Empresas consolidadas, B2B, ingeniería y agencias comerciales.',
  },
  {
    id: 'tecnico',
    nombre: 'Técnico / Cuadrícula',
    descripcion: 'Estructura reticular de alta densidad, celdas delimitadas y metadatos tabulados.',
    estiloVisual: 'Cuadrícula técnica · Celdas con bordes · Fuente técnica',
    recomendadoPara: 'Construcción, desarrollo de software, suministros y proyectos detallados.',
  },
  {
    id: 'editorial',
    nombre: 'Editorial / Elegante',
    descripcion: 'Tipografía clásica con estilo serif, espaciado generoso y filetes dobles de distinción.',
    estiloVisual: 'Tipografía refinada · Doble filete · Detalles de prestigio',
    recomendadoPara: 'Marcas premium, moda, interiorismo, eventos y alta gama.',
  },
];

export const COLOR_PRESETS = [
  { nombre: 'Carbón Puro', valor: '#0a0a0a', clase: 'bg-neutral-950' },
  { nombre: 'Azul Ejecutivo', valor: '#1e3a8a', clase: 'bg-blue-900' },
  { nombre: 'Verde Bosque', valor: '#065f46', clase: 'bg-emerald-800' },
  { nombre: 'Gris Pizarra', valor: '#475569', clase: 'bg-slate-600' },
  { nombre: 'Granate Vino', valor: '#831843', clase: 'bg-pink-900' },
  { nombre: 'Índigo Profundo', valor: '#3730a3', clase: 'bg-indigo-800' },
  { nombre: 'Tierra / Bronce', valor: '#78350f', clase: 'bg-amber-900' },
];

export const defaultQuoteTemplateConfig: DocumentTemplateConfig = {
  modelo: 'minimalista',
  colorAcento: '#0a0a0a',
  fuente: 'sans',
  tituloPersonalizado: 'PRESUPUESTO COMERCIAL',
  subtituloPersonalizado: 'PROPUESTA DE SERVICIOS Y ESTIMACIÓN ECONÓMICA',
  mostrarLogo: true,
  mostrarDatosEmpresa: true,
  mostrarCifEmpresa: true,
  mostrarDireccionEmpresa: true,
  mostrarContactoEmpresa: true,
  mostrarDatosCliente: true,
  mostrarCifCliente: true,
  mostrarDireccionCliente: true,
  mostrarContactoCliente: true,
  mostrarFechas: true,
  mostrarValidezVencimiento: true,
  mostrarEstado: true,
  mostrarColumnaIva: true,
  mostrarColumnaDescuento: true,
  mostrarDesgloseImpuestos: true,
  mostrarIrpf: false,
  mostrarDatosBancarios: false,
  mostrarCondiciones: true,
  mostrarFirmas: true,
  mostrarNotasPie: true,
  notasPiePersonalizadas: '',
  condicionesPersonalizadas: '',
};

export const defaultInvoiceTemplateConfig: DocumentTemplateConfig = {
  modelo: 'minimalista',
  colorAcento: '#0a0a0a',
  fuente: 'sans',
  tituloPersonalizado: 'FACTURA ORDINARIA',
  subtituloPersonalizado: 'DOCUMENTO FISCAL Y TRIBUTARIO OFICIAL',
  mostrarLogo: true,
  mostrarDatosEmpresa: true,
  mostrarCifEmpresa: true,
  mostrarDireccionEmpresa: true,
  mostrarContactoEmpresa: true,
  mostrarDatosCliente: true,
  mostrarCifCliente: true,
  mostrarDireccionCliente: true,
  mostrarContactoCliente: true,
  mostrarFechas: true,
  mostrarValidezVencimiento: true,
  mostrarEstado: true,
  mostrarColumnaIva: true,
  mostrarColumnaDescuento: false,
  mostrarDesgloseImpuestos: true,
  mostrarIrpf: true,
  mostrarDatosBancarios: true,
  mostrarCondiciones: false,
  mostrarFirmas: false,
  mostrarNotasPie: true,
  notasPiePersonalizadas: '',
  condicionesPersonalizadas: '',
};

export function getMergedTemplateConfig(
  stored?: Partial<DocumentTemplateConfig> | null,
  type: 'quote' | 'invoice' = 'quote'
): DocumentTemplateConfig {
  const base = type === 'quote' ? defaultQuoteTemplateConfig : defaultInvoiceTemplateConfig;
  if (!stored) return { ...base };

  return {
    modelo: stored.modelo ?? base.modelo,
    colorAcento: stored.colorAcento ?? base.colorAcento,
    fuente: stored.fuente ?? base.fuente,
    tituloPersonalizado:
      stored.tituloPersonalizado !== undefined ? stored.tituloPersonalizado : base.tituloPersonalizado,
    subtituloPersonalizado:
      stored.subtituloPersonalizado !== undefined
        ? stored.subtituloPersonalizado
        : base.subtituloPersonalizado,
    mostrarLogo: stored.mostrarLogo ?? base.mostrarLogo,
    mostrarDatosEmpresa: stored.mostrarDatosEmpresa ?? base.mostrarDatosEmpresa,
    mostrarCifEmpresa: stored.mostrarCifEmpresa ?? base.mostrarCifEmpresa,
    mostrarDireccionEmpresa: stored.mostrarDireccionEmpresa ?? base.mostrarDireccionEmpresa,
    mostrarContactoEmpresa: stored.mostrarContactoEmpresa ?? base.mostrarContactoEmpresa,
    mostrarDatosCliente: stored.mostrarDatosCliente ?? base.mostrarDatosCliente,
    mostrarCifCliente: stored.mostrarCifCliente ?? base.mostrarCifCliente,
    mostrarDireccionCliente: stored.mostrarDireccionCliente ?? base.mostrarDireccionCliente,
    mostrarContactoCliente: stored.mostrarContactoCliente ?? base.mostrarContactoCliente,
    mostrarFechas: stored.mostrarFechas ?? base.mostrarFechas,
    mostrarValidezVencimiento:
      stored.mostrarValidezVencimiento ?? base.mostrarValidezVencimiento,
    mostrarEstado: stored.mostrarEstado ?? base.mostrarEstado,
    mostrarColumnaIva: stored.mostrarColumnaIva ?? base.mostrarColumnaIva,
    mostrarColumnaDescuento: stored.mostrarColumnaDescuento ?? base.mostrarColumnaDescuento,
    mostrarDesgloseImpuestos:
      stored.mostrarDesgloseImpuestos ?? base.mostrarDesgloseImpuestos,
    mostrarIrpf: stored.mostrarIrpf ?? base.mostrarIrpf,
    mostrarDatosBancarios: stored.mostrarDatosBancarios ?? base.mostrarDatosBancarios,
    mostrarCondiciones: stored.mostrarCondiciones ?? base.mostrarCondiciones,
    mostrarFirmas: stored.mostrarFirmas ?? base.mostrarFirmas,
    mostrarNotasPie: stored.mostrarNotasPie ?? base.mostrarNotasPie,
    notasPiePersonalizadas: stored.notasPiePersonalizadas ?? '',
    condicionesPersonalizadas: stored.condicionesPersonalizadas ?? '',
  };
}
