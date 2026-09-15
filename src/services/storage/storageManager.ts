import {
  ActivityLog,
  Client,
  CommercialLead,
  CompanyProfile,
  DocumentItem,
  DomainItem,
  FinanceMovement,
  HostingItem,
  Invoice,
  KaiaDatabase,
  KaiaServiceItem,
  KaiaUser,
  PaymentRecord,
  Product,
  Project,
  Quote,
  Supplier,
  ViewMode,
} from '../../types';
import { getTodayISO } from '../../utils/formatters';
import { defaultCompany, defaultSettings, initialDemoData, STORAGE_KEY } from './defaults';

declare global {
  interface Window {
    kaiaWpApiSettings?: {
      root: string;
      nonce: string;
      user: KaiaUser;
      siteUrl: string;
      logoutUrl: string;
    };
  }
}

export class StorageManager {
  private db: KaiaDatabase;
  private listeners: (() => void)[] = [];
  private isWpConnected = false;

  constructor() {
    this.db = this.loadInitial();
    this.initWpBridge();
  }

  private loadInitial(): KaiaDatabase {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as KaiaDatabase;
          if (parsed.company && Array.isArray(parsed.clients) && Array.isArray(parsed.invoices)) {
            return {
              ...initialDemoData,
              ...parsed,
              company: { ...defaultCompany, ...parsed.company },
              settings: { ...defaultSettings, ...parsed.settings },
            };
          }
        }
      }
    } catch (e) {
      console.warn('Almacenamiento local temporal no disponible:', e);
    }
    return { ...initialDemoData };
  }

  private async initWpBridge(): Promise<void> {
    if (typeof window !== 'undefined' && window.kaiaWpApiSettings) {
      this.isWpConnected = true;
      try {
        const res = await fetch(`${window.kaiaWpApiSettings.root}state`, {
          headers: {
            'X-WP-Nonce': window.kaiaWpApiSettings.nonce,
          },
        });
        if (res.ok) {
          const stateData = await res.json();
          this.db = {
            ...initialDemoData,
            ...stateData,
            company: { ...defaultCompany, ...(stateData.company || {}) },
            settings: { ...defaultSettings, ...(stateData.settings || {}) },
          };
          this.notify();
        }
      } catch (err) {
        console.warn('KAIA REST API backend no alcanzable, usando estado local:', err);
      }
    }
  }

  private async postToWp(endpoint: string, data: any): Promise<void> {
    if (!this.isWpConnected || typeof window === 'undefined' || !window.kaiaWpApiSettings) {
      return;
    }
    try {
      await fetch(`${window.kaiaWpApiSettings.root}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.kaiaWpApiSettings.nonce,
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error(`Error enviando datos a WP REST API [${endpoint}]:`, err);
    }
  }

  private async deleteFromWp(endpoint: string, id: string): Promise<void> {
    if (!this.isWpConnected || typeof window === 'undefined' || !window.kaiaWpApiSettings) {
      return;
    }
    try {
      await fetch(`${window.kaiaWpApiSettings.root}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': window.kaiaWpApiSettings.nonce,
        },
      });
    } catch (err) {
      console.error(`Error eliminando elemento en WP REST API [${endpoint}/${id}]:`, err);
    }
  }

  private persist(db: KaiaDatabase): void {
    this.db = db;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      }
    } catch (e) {
      console.warn('Error en persistencia local:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getDatabase(): KaiaDatabase {
    if (!this.db.commercial) {
      this.db.commercial = this.db.leads;
    }
    this.db.company = { ...defaultCompany, ...(this.db.company || {}) };
    this.db.settings = { ...defaultSettings, ...(this.db.settings || {}) };
    return this.db;
  }

  public getCurrentUser(): KaiaUser | undefined {
    return typeof window !== 'undefined' ? window.kaiaWpApiSettings?.user : this.db.user;
  }

  public getActivityLogs(): ActivityLog[] {
    return (this.db.activities || []).map((a) => ({
      ...a,
      accion: a.descripcion || a.accion || 'Actividad registrada',
      detalles: a.entidadId ? `ID: ${a.entidadId}` : a.tipo,
      usuario: a.usuario || 'Usuario KAIA',
      entidad: (a.tipo || 'SISTEMA').toUpperCase(),
      timestamp: a.fecha || a.timestamp || getTodayISO(),
    }));
  }

  public logActivity(
    descripcion: string,
    tipo: ActivityLog['tipo'],
    entidadId?: string,
    targetView?: ViewMode,
    targetId?: string
  ): void {
    const now = new Date();
    const dateStr = `${getTodayISO()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: ActivityLog = {
      id: `ACT-${Date.now()}`,
      fecha: dateStr,
      descripcion,
      tipo,
      entidadId,
      targetView,
      targetId,
      usuario: this.getCurrentUser()?.name || 'Administrador KAIA',
    };
    const updatedActivities = [newLog, ...(this.db.activities || [])].slice(0, 100);
    this.persist({
      ...this.db,
      activities: updatedActivities,
    });
  }

  // --- CLIENTES ---
  public getClients(): Client[] {
    return this.db.clients || [];
  }

  public getClient(id: string): Client | undefined {
    return (this.db.clients || []).find((c) => c.id === id);
  }

  public saveClient(client: Client): void {
    const exists = (this.db.clients || []).some((c) => c.id === client.id);
    let updatedClients: Client[];
    if (exists) {
      updatedClients = this.db.clients.map((c) => (c.id === client.id ? client : c));
      this.logActivity(`Cliente ${client.empresa || client.nombre} actualizado`, 'cliente', client.id, 'client-detail', client.id);
    } else {
      updatedClients = [client, ...(this.db.clients || [])];
      this.logActivity(`Cliente ${client.empresa || client.nombre} creado`, 'cliente', client.id, 'client-detail', client.id);
    }
    this.persist({ ...this.db, clients: updatedClients });
    this.postToWp('clients', client);
  }

  public deleteClient(id: string): void {
    const client = this.getClient(id);
    const updated = (this.db.clients || []).filter((c) => c.id !== id);
    this.logActivity(`Cliente ${client?.empresa || id} eliminado`, 'cliente');
    this.persist({ ...this.db, clients: updated });
    this.deleteFromWp('clients', id);
  }

  // --- SERVICIOS ---
  public getServices(): KaiaServiceItem[] {
    return this.db.services || [];
  }

  public saveService(service: KaiaServiceItem): void {
    const exists = (this.db.services || []).some((s) => s.id === service.id);
    let updated: KaiaServiceItem[];
    if (exists) {
      updated = (this.db.services || []).map((s) => (s.id === service.id ? service : s));
    } else {
      updated = [service, ...(this.db.services || [])];
    }
    this.logActivity(`Servicio ${service.nombre} guardado`, 'servicio');
    this.persist({ ...this.db, services: updated });
    this.postToWp('services', service);
  }

  public deleteService(id: string): void {
    const updated = (this.db.services || []).filter((s) => s.id !== id);
    this.logActivity(`Servicio ${id} eliminado`, 'servicio');
    this.persist({ ...this.db, services: updated });
    this.deleteFromWp('services', id);
  }

  // --- DOMINIOS ---
  public getDomains(): DomainItem[] {
    return this.db.domains || [];
  }

  public saveDomain(domain: DomainItem): void {
    const exists = (this.db.domains || []).some((d) => d.id === domain.id);
    let updated: DomainItem[];
    if (exists) {
      updated = (this.db.domains || []).map((d) => (d.id === domain.id ? domain : d));
    } else {
      updated = [domain, ...(this.db.domains || [])];
    }
    this.logActivity(`Dominio ${domain.dominio} guardado`, 'dominio');
    this.persist({ ...this.db, domains: updated });
    this.postToWp('domains', domain);
  }

  public deleteDomain(id: string): void {
    const updated = (this.db.domains || []).filter((d) => d.id !== id);
    this.logActivity(`Dominio ${id} eliminado`, 'dominio');
    this.persist({ ...this.db, domains: updated });
    this.deleteFromWp('domains', id);
  }

  // --- HOSTING ---
  public getHosting(): HostingItem[] {
    return this.db.hosting || [];
  }

  public saveHosting(hosting: HostingItem): void {
    const exists = (this.db.hosting || []).some((h) => h.id === hosting.id);
    let updated: HostingItem[];
    if (exists) {
      updated = (this.db.hosting || []).map((h) => (h.id === hosting.id ? hosting : h));
    } else {
      updated = [hosting, ...(this.db.hosting || [])];
    }
    this.logActivity(`Alojamiento web ${hosting.servidor} guardado`, 'hosting');
    this.persist({ ...this.db, hosting: updated });
    this.postToWp('hosting', hosting);
  }

  public deleteHosting(id: string): void {
    const updated = (this.db.hosting || []).filter((h) => h.id !== id);
    this.logActivity(`Alojamiento ${id} eliminado`, 'hosting');
    this.persist({ ...this.db, hosting: updated });
    this.deleteFromWp('hosting', id);
  }

  // --- PROYECTOS ---
  public getProjects(): Project[] {
    return this.db.projects || [];
  }

  public getProject(id: string): Project | undefined {
    return (this.db.projects || []).find((p) => p.id === id);
  }

  public saveProject(project: Project): void {
    const exists = (this.db.projects || []).some((p) => p.id === project.id);
    let updated: Project[];
    if (exists) {
      updated = this.db.projects.map((p) => (p.id === project.id ? project : p));
      this.logActivity(`Proyecto ${project.titulo} actualizado`, 'proyecto', project.id, 'project-detail', project.id);
    } else {
      updated = [project, ...(this.db.projects || [])];
      this.logActivity(`Proyecto ${project.titulo} creado`, 'proyecto', project.id, 'project-detail', project.id);
    }
    this.persist({ ...this.db, projects: updated });
    this.postToWp('projects', project);
  }

  public deleteProject(id: string): void {
    const p = this.getProject(id);
    const updated = (this.db.projects || []).filter((item) => item.id !== id);
    this.logActivity(`Proyecto ${p?.titulo || id} eliminado`, 'proyecto');
    this.persist({ ...this.db, projects: updated });
    this.deleteFromWp('projects', id);
  }

  // --- PRESUPUESTOS ---
  public getQuotes(): Quote[] {
    return this.db.quotes || [];
  }

  public getQuote(id: string): Quote | undefined {
    return (this.db.quotes || []).find((q) => q.id === id);
  }

  public saveQuote(quote: Quote): void {
    const exists = (this.db.quotes || []).some((q) => q.id === quote.id);
    let updated: Quote[];
    if (exists) {
      updated = this.db.quotes.map((q) => (q.id === quote.id ? quote : q));
      this.logActivity(`Presupuesto ${quote.id} actualizado`, 'presupuesto', quote.id, 'quote-detail', quote.id);
    } else {
      updated = [quote, ...(this.db.quotes || [])];
      this.logActivity(`Presupuesto ${quote.id} generado`, 'presupuesto', quote.id, 'quote-detail', quote.id);
    }
    this.persist({ ...this.db, quotes: updated });
    this.postToWp('quotes', quote);
  }

  public deleteQuote(id: string): void {
    const updated = (this.db.quotes || []).filter((q) => q.id !== id);
    this.logActivity(`Presupuesto ${id} eliminado`, 'presupuesto');
    this.persist({ ...this.db, quotes: updated });
    this.deleteFromWp('quotes', id);
  }

  // --- FACTURAS ---
  public getInvoices(): Invoice[] {
    return this.db.invoices || [];
  }

  public getInvoice(id: string): Invoice | undefined {
    return (this.db.invoices || []).find((i) => i.id === id);
  }

  public saveInvoice(invoice: Invoice): void {
    const exists = (this.db.invoices || []).some((i) => i.id === invoice.id);
    let updated: Invoice[];
    if (exists) {
      updated = this.db.invoices.map((i) => (i.id === invoice.id ? invoice : i));
      this.logActivity(`Factura ${invoice.id} actualizada`, 'factura', invoice.id, 'invoice-detail', invoice.id);
    } else {
      updated = [invoice, ...(this.db.invoices || [])];
      this.logActivity(`Factura ${invoice.id} emitida`, 'factura', invoice.id, 'invoice-detail', invoice.id);
    }
    this.persist({ ...this.db, invoices: updated });
    this.postToWp('invoices', invoice);
  }

  public registerPayment(invoiceId: string, payment: PaymentRecord): void {
    const invoice = this.getInvoice(invoiceId);
    if (!invoice) return;

    const updatedPagos = [...(invoice.pagos || []), payment];
    const totalPagado = updatedPagos.reduce((acc, p) => acc + p.importe, 0);
    const pendiente = Math.max(0, invoice.total - totalPagado);

    let nuevoEstado = invoice.estado;
    if (pendiente <= 0.01) {
      nuevoEstado = 'Pagada';
    } else if (totalPagado > 0) {
      nuevoEstado = 'Parcial';
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      pagos: updatedPagos,
      importePagado: totalPagado,
      importePendiente: pendiente,
      estado: nuevoEstado,
      fechaModificacion: getTodayISO(),
    };

    const client = this.getClient(invoice.clienteId);
    const nuevoMovimiento: FinanceMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      fecha: payment.fecha,
      tipo: 'Ingreso',
      categoria: 'Cobro de Facturas',
      descripcion: `Cobro ${invoice.id} (${client?.empresa || client?.nombre || 'Cliente'}) - Ref: ${payment.referencia || 'S/R'}`,
      importe: payment.importe,
      metodo: payment.metodo,
      estado: 'Completado',
      clienteId: invoice.clienteId,
      proyectoId: invoice.proyectoId,
      facturaId: invoice.id,
      fechaCreacion: payment.fecha,
    };

    const updatedFinances = [nuevoMovimiento, ...(this.db.finances || [])];
    const updatedInvoices = (this.db.invoices || []).map((i) => (i.id === invoiceId ? updatedInvoice : i));

    this.logActivity(
      `Pago de ${payment.importe.toFixed(2)} € registrado para ${invoice.id}`,
      'pago',
      invoice.id,
      'invoice-detail',
      invoice.id
    );

    this.persist({
      ...this.db,
      invoices: updatedInvoices,
      finances: updatedFinances,
    });

    this.postToWp(`invoices/${invoiceId}/payments`, payment);
  }

  public deleteInvoice(id: string): void {
    const updated = (this.db.invoices || []).filter((i) => i.id !== id);
    this.logActivity(`Factura ${id} eliminada`, 'factura');
    this.persist({ ...this.db, invoices: updated });
    this.deleteFromWp('invoices', id);
  }

  // --- FINANZAS ---
  public getFinances(): FinanceMovement[] {
    return this.db.finances || [];
  }

  public saveFinance(movement: FinanceMovement): void {
    const exists = (this.db.finances || []).some((m) => m.id === movement.id);
    let updated: FinanceMovement[];
    if (exists) {
      updated = (this.db.finances || []).map((m) => (m.id === movement.id ? movement : m));
    } else {
      updated = [movement, ...(this.db.finances || [])];
    }
    this.logActivity(`Movimiento financiero (${movement.tipo}): ${movement.descripcion}`, 'finanzas');
    this.persist({ ...this.db, finances: updated });
    this.postToWp('finances', movement);
  }

  public deleteFinance(id: string): void {
    const updated = (this.db.finances || []).filter((m) => m.id !== id);
    this.logActivity(`Movimiento financiero ${id} eliminado`, 'finanzas');
    this.persist({ ...this.db, finances: updated });
    this.deleteFromWp('finances', id);
  }

  // --- DOCUMENTOS ---
  public getDocuments(): DocumentItem[] {
    return this.db.documents || [];
  }

  public saveDocument(doc: DocumentItem): void {
    const exists = (this.db.documents || []).some((d) => d.id === doc.id);
    let updated: DocumentItem[];
    if (exists) {
      updated = (this.db.documents || []).map((d) => (d.id === doc.id ? doc : d));
    } else {
      updated = [doc, ...(this.db.documents || [])];
    }
    this.logActivity(`Documento añadido: ${doc.nombre}`, 'documento');
    this.persist({ ...this.db, documents: updated });
    this.postToWp('documents', doc);
  }

  public deleteDocument(id: string): void {
    const doc = (this.db.documents || []).find((d) => d.id === id);
    const updated = (this.db.documents || []).filter((d) => d.id !== id);
    this.logActivity(`Documento eliminado: ${doc?.nombre || id}`, 'documento');
    this.persist({ ...this.db, documents: updated });
    this.deleteFromWp('documents', id);
  }

  // --- COMERCIAL (LEADS) ---
  public getLeads(): CommercialLead[] {
    return this.db.leads || [];
  }

  public getLead(id: string): CommercialLead | undefined {
    return (this.db.leads || []).find((l) => l.id === id);
  }

  public saveLead(lead: CommercialLead): void {
    const exists = (this.db.leads || []).some((l) => l.id === lead.id);
    let updated: CommercialLead[];
    if (exists) {
      updated = (this.db.leads || []).map((l) => (l.id === lead.id ? lead : l));
    } else {
      updated = [lead, ...(this.db.leads || [])];
    }
    this.logActivity(`Oportunidad comercial ${lead.empresa} (${lead.estado}) actualizada`, 'comercial');
    this.persist({ ...this.db, leads: updated });
    this.postToWp('leads', lead);
  }

  public deleteLead(id: string): void {
    const l = this.getLead(id);
    const updated = (this.db.leads || []).filter((item) => item.id !== id);
    this.logActivity(`Oportunidad ${l?.empresa || id} eliminada`, 'comercial');
    this.persist({ ...this.db, leads: updated });
    this.deleteFromWp('leads', id);
  }

  // --- PROVEEDORES ---
  public getSuppliers(): Supplier[] {
    return this.db.suppliers || [];
  }

  public getSupplier(id: string): Supplier | undefined {
    return (this.db.suppliers || []).find((s) => s.id === id);
  }

  public saveSupplier(supplier: Supplier): void {
    const exists = (this.db.suppliers || []).some((s) => s.id === supplier.id);
    let updated: Supplier[];
    if (exists) {
      updated = (this.db.suppliers || []).map((s) => (s.id === supplier.id ? supplier : s));
    } else {
      updated = [supplier, ...(this.db.suppliers || [])];
    }
    this.logActivity(`Proveedor ${supplier.proveedor} guardado`, 'sistema');
    this.persist({ ...this.db, suppliers: updated });
    this.postToWp('suppliers', supplier);
  }

  public deleteSupplier(id: string): void {
    const s = this.getSupplier(id);
    const updated = (this.db.suppliers || []).filter((item) => item.id !== id);
    this.logActivity(`Proveedor ${s?.proveedor || id} eliminado`, 'sistema');
    this.persist({ ...this.db, suppliers: updated });
    this.deleteFromWp('suppliers', id);
  }

  // --- PRODUCTOS ---
  public getProducts(): Product[] {
    return this.db.products || [];
  }

  public getProduct(id: string): Product | undefined {
    return (this.db.products || []).find((p) => p.id === id);
  }

  public saveProduct(product: Product): void {
    const exists = (this.db.products || []).some((p) => p.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = (this.db.products || []).map((p) => (p.id === product.id ? product : p));
    } else {
      updated = [product, ...(this.db.products || [])];
    }
    this.logActivity(`Producto ${product.nombre} guardado`, 'sistema');
    this.persist({ ...this.db, products: updated });
    this.postToWp('products', product);
  }

  public deleteProduct(id: string): void {
    const p = this.getProduct(id);
    const updated = (this.db.products || []).filter((item) => item.id !== id);
    this.logActivity(`Producto ${p?.nombre || id} eliminado`, 'sistema');
    this.persist({ ...this.db, products: updated });
    this.deleteFromWp('products', id);
  }

  // --- EMPRESA Y CONFIGURACIÓN ---
  public getCompany(): CompanyProfile {
    return { ...defaultCompany, ...(this.db.company || {}) };
  }

  public saveCompany(company: CompanyProfile): void {
    this.logActivity('Datos de empresa KAIA actualizados', 'sistema');
    this.persist({ ...this.db, company });
    this.postToWp('company', company);
  }

  public getSettings(): KaiaDatabase['settings'] {
    return { ...defaultSettings, ...(this.db.settings || {}) };
  }

  public saveSettings(settings: KaiaDatabase['settings']): void {
    this.persist({ ...this.db, settings });
    this.postToWp('settings', settings);
  }
}

export const storageService = new StorageManager();
