import React from 'react';
import { User } from '../types';
import { LayoutDashboard, FileText, Settings, LogOut, Wallet, Menu, X } from 'lucide-react';
import { Button } from './ui';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: 'dashboard' | 'invoices';
  onNavigate: (view: 'dashboard' | 'invoices') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: 'dashboard' | 'invoices', icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon className={`h-5 w-5 ${currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-8">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Wallet className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">InvoiceFlow</span>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="invoices" icon={FileText} label="Invoices" />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
            </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">InvoiceFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-10 pt-20 px-4 lg:hidden">
            <nav className="space-y-4">
                <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem view="invoices" icon={FileText} label="Invoices" />
                <div className="pt-8 border-t border-slate-100">
                    <Button variant="danger" className="w-full justify-center" onClick={onLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                </div>
            </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};
