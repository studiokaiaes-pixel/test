/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode } from './types';
import { storageService } from './services/storage';

// Layout & Common Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationToast, ToastInfo } from './components/common/NotificationToast';
import { GlobalSearch } from './components/common/GlobalSearch';

// Pages
import { Dashboard } from './pages/Dashboard';

// Clients & Companies
import { ClientsList } from './pages/Clients/ClientsList';
import { ClientDetail } from './pages/Clients/ClientDetail';
import { ClientForm } from './pages/Clients/ClientForm';

// Services, Domains, Hosting
import { ServicesPage } from './pages/Services/ServicesPage';
import { DomainsPage } from './pages/Domains/DomainsPage';
import { HostingPage } from './pages/Hosting/HostingPage';

// Projects
import { ProjectsList } from './pages/Projects/ProjectsList';
import { ProjectDetail } from './pages/Projects/ProjectDetail';
import { ProjectForm } from './pages/Projects/ProjectForm';

// Quotes
import { QuotesList } from './pages/Quotes/QuotesList';
import { QuoteBuilder } from './pages/Quotes/QuoteBuilder';
import { QuoteDetail } from './pages/Quotes/QuoteDetail';

// Invoices
import { InvoicesList } from './pages/Invoices/InvoicesList';
import { InvoiceBuilder } from './pages/Invoices/InvoiceBuilder';
import { InvoiceDetail } from './pages/Invoices/InvoiceDetail';

// Finances
import { FinancesPage } from './pages/Finances/FinancesPage';

// Documents
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { DocumentForm } from './pages/Documents/DocumentForm';

// Commercial
import { CommercialPage } from './pages/Commercial/CommercialPage';

// Suppliers
import { SuppliersPage } from './pages/Suppliers/SuppliersPage';
import { SupplierForm } from './pages/Suppliers/SupplierForm';

// Products
import { ProductsPage } from './pages/Products/ProductsPage';
import { ProductForm } from './pages/Products/ProductForm';

// Users
import { UsersPage } from './pages/Users/UsersPage';

// Company & Settings
import { CompanyPage } from './pages/Company/CompanyPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const handleNavigate = useCallback((view: ViewMode, id?: string) => {
    setCurrentView(view);
    setSelectedId(id);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const showToast = useCallback((type: 'loading' | 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      // Clients
      case 'clients':
      case 'companies':
        return <ClientsList onNavigate={handleNavigate} />;
      case 'client-detail':
        return <ClientDetail clientId={selectedId || 'CLI-0001'} onNavigate={handleNavigate} />;
      case 'client-new':
        return <ClientForm onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'client-edit':
        return <ClientForm clientId={selectedId} onNavigate={handleNavigate} onShowToast={showToast} />;

      // Services, Domains, Hosting
      case 'services':
        return <ServicesPage onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'domains':
        return <DomainsPage onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'hosting':
        return <HostingPage onNavigate={handleNavigate} onShowToast={showToast} />;

      // Projects
      case 'projects':
        return <ProjectsList onNavigate={handleNavigate} />;
      case 'project-detail':
        return (
          <ProjectDetail
            projectId={selectedId || 'PRO-0001'}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      case 'project-new':
        return <ProjectForm onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'project-edit':
        return <ProjectForm projectId={selectedId} onNavigate={handleNavigate} onShowToast={showToast} />;

      // Quotes
      case 'quotes':
        return <QuotesList onNavigate={handleNavigate} />;
      case 'quote-builder':
        return <QuoteBuilder onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'quote-detail':
        return (
          <QuoteDetail
            quoteId={selectedId || 'PRE-2026-0001'}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );

      // Invoices
      case 'invoices':
        return <InvoicesList onNavigate={handleNavigate} />;
      case 'invoice-builder':
        return <InvoiceBuilder onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'invoice-detail':
      case 'invoice-payment':
        return (
          <InvoiceDetail
            invoiceId={selectedId || 'FAC-2026-0001'}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );

      // Finances
      case 'finances':
      case 'finance-new':
        return <FinancesPage onNavigate={handleNavigate} onShowToast={showToast} />;

      // Documents
      case 'documents':
        return <DocumentsPage onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'document-new':
        return <DocumentForm onNavigate={handleNavigate} onShowToast={showToast} />;

      // Commercial
      case 'commercial':
      case 'commercial-new':
      case 'commercial-edit':
        return <CommercialPage onNavigate={handleNavigate} onShowToast={showToast} />;

      // Suppliers
      case 'suppliers':
        return <SuppliersPage onNavigate={handleNavigate} me="suppliers" onShowToast={showToast} />;
      case 'supplier-detail':
      case 'supplier-edit':
        return (
          <SupplierForm
            supplierId={selectedId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      case 'supplier-new':
        return <SupplierForm onNavigate={handleNavigate} onShowToast={showToast} />;

      // Products
      case 'products':
        return <ProductsPage onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'product-detail':
      case 'product-edit':
        return (
          <ProductForm
            productId={selectedId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      case 'product-new':
        return <ProductForm onNavigate={handleNavigate} onShowToast={showToast} />;

      // Users
      case 'users':
        return <UsersPage onNavigate={handleNavigate} onShowToast={showToast} />;

      // Company
      case 'company':
        return <CompanyPage onNavigate={handleNavigate} onShowToast={showToast} />;

      // Settings
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} onShowToast={showToast} />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans antialiased">
      {/* Top Fixed Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={handleNavigate}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isDark={false}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Global Search Dialog (Ctrl+K) */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Real-time Toast Notifications */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
