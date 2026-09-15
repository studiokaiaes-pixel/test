import React, { useState } from 'react';
import { UserCheck, UserPlus, Shield, Info, Lock } from 'lucide-react';
import { ViewMode } from '../../types';
import { storageService } from '../../services/storage';

interface UsersPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate, onShowToast }) => {
  const currentUser = storageService.getCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('kaia_employee');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      onShowToast('error', 'Por favor completa los campos requeridos.');
      return;
    }

    if (window.kaiaWpApiSettings) {
      try {
        const res = await fetch(`${window.kaiaWpApiSettings.root}users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.kaiaWpApiSettings.nonce,
          },
          body: JSON.stringify({
            username,
            email,
            name,
            password,
            role,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onShowToast('success', 'Usuario de WordPress creado correctamente.');
          setIsModalOpen(false);
          setUsername('');
          setEmail('');
          setName('');
          setPassword('');
        } else {
          onShowToast('error', data.message || 'Error al crear usuario en WordPress.');
        }
      } catch (err) {
        onShowToast('error', 'Error de conexión con la API de WordPress.');
      }
    } else {
      onShowToast('success', 'Usuario registrado en la aplicación (Modo Simulado).');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-neutral-800" />
            Usuarios & Autenticación WordPress
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Gestión de acceso, roles y permisos nativos integrados en el núcleo de WordPress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-2 rounded-sm text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario WP
        </button>
      </div>

      {/* Current User Card */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Sesión Actual de WordPress
          </h2>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
            Autenticado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
          <div>
            <span className="text-neutral-400 block text-[10px]">NOMBRE DE USUARIO</span>
            <span className="font-semibold text-neutral-900">{currentUser?.name || 'Administrador'}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">CORREO ELECTRÓNICO</span>
            <span className="font-semibold text-neutral-900">{currentUser?.email || 'admin@wordpress.local'}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">ROLES ACTIVOS</span>
            <span className="font-semibold text-neutral-900">
              {(currentUser?.roles || ['administrator']).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Roles & Capabilities Matrix Explanation */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Roles de Usuario y Matriz de Permisos KAIA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="border border-neutral-200 rounded-sm p-4 space-y-2 bg-neutral-50/50">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-700" />
              Administrador (administrator / kaia_administrator)
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Acceso completo e irrestricto a todos los módulos: Clientes, Presupuestos, Facturas, Finanzas, Configuración y Gestión de Usuarios.
            </p>
          </div>

          <div className="border border-neutral-200 rounded-sm p-4 space-y-2 bg-neutral-50/50">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-700" />
              Empleado (kaia_employee)
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Acceso de gestión operativa a Clientes, Proyectos, Servicios, Dominios y Documentos. Sin permisos para alterar configuración del sistema.
            </p>
          </div>

          <div className="border border-neutral-200 rounded-sm p-4 space-y-2 bg-neutral-50/50">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-700" />
              Cliente (kaia_client)
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Acceso restringido únicamente a sus propios presupuestos, facturas, proyectos, hosting y dominios contratados. Aislamiento total entre clientes.
            </p>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-sm max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Crear Usuario en WordPress</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Usuario (Username)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Rol de Acceso KAIA</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                >
                  <option value="kaia_employee">KAIA Empleado</option>
                  <option value="kaia_client">KAIA Cliente</option>
                  <option value="kaia_administrator">KAIA Administrador</option>
                  <option value="administrator">Administrador WordPress</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-sm text-xs font-medium hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-sm text-xs font-semibold hover:bg-neutral-800"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
