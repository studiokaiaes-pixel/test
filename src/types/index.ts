export type ViewMode =
  | 'dashboard'
  // Clients & Companies
  | 'clients'
  | 'client-detail'
  | 'client-new'
  | 'client-edit'
  | 'companies'
  // Services, Domains, Hosting
  | 'services'
  | 'domains'
  | 'hosting'
  // Projects
  | 'projects'
  | 'project-detail'
  | 'project-new'
  | 'project-edit'
  // Quotes
  | 'quotes'
  | 'quote-builder'
  | 'quote-detail'
  // Invoices
  | 'invoices'
  | 'invoice-builder'
  | 'invoice-detail'
  | 'invoice-payment'
  // Finances
  | 'finances'
  | 'finance-new'
  // Documents
  | 'documents'
  | 'document-new'
  // Commercial
  | 'commercial'
  | 'commercial-new'
  | 'commercial-edit'
  // Suppliers
  | 'suppliers'
  | 'supplier-detail'
  | 'supplier-new'
  | 'supplier-edit'
  // Products
  | 'products'
  | 'product-detail'
  | 'product-new'
  | 'product-edit'
  // Users
  | 'users'
  // Company & Settings
  | 'company'
  | 'settings';

export interface CompanyProfile {
  id?: string;
  nombreComercial: string;
  razonSocial: string;
  cif: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  telefono: string;
  email: string;
  web: string;
  iban: string;
  banco: string;
  swift: string;
  condicionesPago: string;
  ivaPorDefecto: number;
  retencionIRPF?: number;
  cuentaBancaria?: string;
  registroMercantil: string;
  condicionesDefecto?: string;
  pieFacturaDefecto?: string;
  moneda?: string;
}

export type CompanyInfo = CompanyProfile;

export interface Client {
  id: string; // CLI-0001
  wp_user_id?: number;
  company_id?: string;
  nombre: string;
  apellidos: string;
  empresa: string;
  cif: string;
  email: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  notas: string;
  estado: 'Activo' | 'Inactivo';
  fechaAlta: string;
  fechaModificacion: string;
  isDemo?: boolean;
}

export interface KaiaServiceItem {
  id: string; // SRV-0001
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  clienteId: string;
  empresaId?: string;
  estado: 'Activo' | 'Inactivo' | 'Cancelado' | 'Pendiente';
  fechaContratacion: string;
  fechaRenovacion?: string;
  notas?: string;
}

export interface DomainItem {
  id: string; // DOM-0001
  dominio: string;
  clienteId: string;
  empresaId?: string;
  proveedor: string;
  fechaAlta: string;
  fechaRenovacion: string;
  estado: 'Activo' | 'Pendiente' | 'Próximo a renovar' | 'Caducado' | 'Cancelado';
  coste: number;
  notas?: string;
}

export interface HostingItem {
  id: string; // HST-0001
  clienteId: string;
  empresaId?: string;
  proveedor: string;
  servicio: string;
  plan: string;
  servidor: string;
  fechaContratacion: string;
  fechaRenovacion: string;
  coste: number;
  estado: 'Activo' | 'Pendiente' | 'Próximo a renovar' | 'Caducado' | 'Cancelado';
  notas?: string;
}

export type ProjectStatus =
  | 'Pendiente'
  | 'En preparación'
  | 'En curso'
  | 'En revisión'
  | 'Finalizado'
  | 'Cancelado';

export interface ProjectTask {
  id: string;
  texto: string;
  completada: boolean;
}

export interface Project {
  id: string; // PRO-0001
  titulo: string;
  clienteId: string;
  empresaId?: string;
  servicio: string;
  descripcion: string;
  estado: ProjectStatus;
  fechaInicio: string;
  fechaPrevista: string;
  importe: number;
  responsable: string;
  presupuestoId?: string;
  tareas: ProjectTask[];
  notas: string;
  fechaCreacion: string;
  fechaModificacion: string;
  isDemo?: boolean;
}

export type QuoteStatus = 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Cancelado';

export interface QuoteLine {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  iva: number;
  descuento: number;
}

export type TemplateModelId = 'minimalista' | 'ejecutivo' | 'tecnico' | 'editorial';

export interface DocumentTemplateConfig {
  modelo: TemplateModelId;
  colorAcento: string;
  fuente: 'sans' | 'mono' | 'serif';
  tituloPersonalizado?: string;
  subtituloPersonalizado?: string;

  mostrarLogo: boolean;
  mostrarDatosEmpresa: boolean;
  mostrarCifEmpresa: boolean;
  mostrarDireccionEmpresa: boolean;
  mostrarContactoEmpresa: boolean;

  mostrarDatosCliente: boolean;
  mostrarCifCliente: boolean;
  mostrarDireccionCliente: boolean;
  mostrarContactoCliente: boolean;

  mostrarFechas: boolean;
  mostrarValidezVencimiento: boolean;
  mostrarEstado: boolean;

  mostrarColumnaIva: boolean;
  mostrarColumnaDescuento: boolean;
  mostrarDesgloseImpuestos: boolean;
  mostrarIrpf: boolean;

  mostrarDatosBancarios: boolean;
  mostrarCondiciones: boolean;
  mostrarFirmas: boolean;
  mostrarNotasPie: boolean;

  notasPiePersonalizadas?: string;
  condicionesPersonalizadas?: string;
}

export interface Quote {
  id: string; // PRE-2026-0001
  clienteId: string;
  empresaId?: string;
  fecha: string;
  validez: string;
  estado: QuoteStatus;
  lineas: QuoteLine[];
  subtotal: number;
  descuentoTotal: number;
  ivaTotal: number;
  total: number;
  condicionesPago: string;
  formaPago: string;
  plazoEntrega: string;
  revisiones: string;
  cancelacion: string;
  notas: string;
  observaciones: string;
  fechaCreacion: string;
  fechaModificacion: string;
  plantillaConfig?: DocumentTemplateConfig;
  isDemo?: boolean;
}

export type InvoiceStatus = 'Borrador' | 'Emitida' | 'Pagada' | 'Parcial' | 'Vencida' | 'Cancelada';

export interface InvoiceLine {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  iva: number;
  descuento: number;
}

export interface PaymentRecord {
  id: string;
  fecha: string;
  importe: number;
  metodo: string;
  referencia: string;
  notas: string;
}

export interface Invoice {
  id: string; // FAC-2026-0001
  numero?: string;
  serie?: string;
  clienteId: string;
  empresaId?: string;
  presupuestoId?: string;
  proyectoId?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  formaPago?: string;
  metodoPago: string;
  cuentaBancaria?: string;
  lineas: InvoiceLine[];
  baseImponible: number;
  ivaTotal: number;
  irpfTotal?: number;
  total: number;
  importePagado: number;
  importePendiente: number;
  estado: InvoiceStatus;
  pagos?: PaymentRecord[];
  notas?: string;
  fechaCreacion: string;
  fechaModificacion: string;
  plantillaConfig?: DocumentTemplateConfig;
  isDemo?: boolean;
}

export interface FinanceMovement {
  id: string; // MOV-0001
  fecha: string;
  tipo: 'Ingreso' | 'Gasto';
  categoria: string;
  descripcion?: string;
  concepto?: string;
  importe: number;
  metodo?: string;
  metodoPago?: string;
  estado: 'Completado' | 'Pendiente';
  clienteId?: string;
  empresaId?: string;
  proveedorId?: string;
  proyectoId?: string;
  facturaId?: string;
  fechaCreacion?: string;
  notas?: string;
  isDemo?: boolean;
}

export interface DocumentItem {
  id: string; // DOC-0001
  nombre: string;
  categoria: string;
  tamano: string;
  tipo: string;
  fechaSubida: string;
  clienteId?: string;
  empresaId?: string;
  proyectoId?: string;
  servicioId?: string;
  contenidoSimulado?: string;
  url?: string;
  notas?: string;
  isDemo?: boolean;
}

export type CommercialLeadStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Respuesta'
  | 'Reunión'
  | 'Presupuesto'
  | 'Negociación'
  | 'Ganado'
  | 'Perdido';

export type CommercialStage =
  | 'Contacto'
  | 'Cualificación'
  | 'Propuesta'
  | 'Negociación'
  | 'Ganado'
  | 'Perdido';

export interface CommercialLead {
  id: string; // COM-0001
  titulo?: string;
  clienteNombre?: string;
  empresa: string;
  contacto?: string;
  email: string;
  telefono: string;
  origen?: string;
  servicioInteres?: string;
  estado?: CommercialLeadStatus;
  fase?: CommercialStage;
  valorEstimado: number;
  probabilidad?: number;
  responsable?: string;
  proximoPaso?: string;
  fechaContacto?: string;
  proximoSeguimiento?: string;
  fechaPrevistaCierre?: string;
  clienteId?: string;
  empresaId?: string;
  notas?: string;
  fechaCreacion: string;
  isDemo?: boolean;
}

export type Opportunity = CommercialLead;

export interface Supplier {
  id: string; // PRV-0001
  proveedor?: string;
  empresa?: string;
  cif: string;
  contacto: string;
  email: string;
  telefono: string;
  web?: string;
  servicio: string;
  condiciones?: string;
  direccion?: string;
  iban?: string;
  estado: 'Activo' | 'Inactivo';
  notas: string;
  fechaAlta?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  isDemo?: boolean;
}

export interface Product {
  id: string; // PRD-0001
  codigo?: string;
  nombre: string;
  referencia?: string;
  categoria: string;
  descripcion: string;
  precio: number;
  iva: number;
  unidad?: 'hora' | 'proyecto' | 'mensualidad' | 'unidad' | string;
  stock?: number;
  stockMinimo?: number;
  proveedorId?: string;
  activo?: boolean;
  estado?: 'Disponible' | 'Agotado' | 'Descatalogado';
  fechaCreacion?: string;
  fechaModificacion?: string;
  isDemo?: boolean;
}

export type ProductItem = Product;

export interface ActivityLog {
  id: string;
  fecha?: string;
  timestamp?: string;
  descripcion?: string;
  accion?: string;
  detalles?: string;
  usuario?: string;
  entidad?: string;
  tipo: string;
  entidadId?: string;
  targetView?: ViewMode;
  targetId?: string;
}

export interface AppSettings {
  tema: 'claro' | 'oscuro';
  formatoFecha: string;
  moneda: string;
  autoGuardar: boolean;
  backupUltimaFecha?: string;
  prefijoPresupuesto?: string;
  prefijoFactura?: string;
  prefijoProyecto?: string;
  prefijoCliente?: string;
  incluirAno?: boolean;
  digitosNumero?: number;
  separadorDecimal?: string;
  plantillaPresupuestoDefecto?: DocumentTemplateConfig;
  plantillaFacturaDefecto?: DocumentTemplateConfig;
}

export type SystemSettings = AppSettings;

export interface KaiaUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  isClient?: boolean;
  kaiaClientId?: string;
}

export interface KaiaDatabase {
  company: CompanyProfile;
  clients: Client[];
  services?: KaiaServiceItem[];
  domains?: DomainItem[];
  hosting?: HostingItem[];
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  finances: FinanceMovement[];
  documents: DocumentItem[];
  leads: CommercialLead[];
  commercial?: CommercialLead[];
  suppliers: Supplier[];
  products: Product[];
  activities: ActivityLog[];
  settings: AppSettings;
  user?: KaiaUser;
}
