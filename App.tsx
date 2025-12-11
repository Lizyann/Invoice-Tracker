import React, { useState, useEffect } from 'react';
import { AuthScreen } from './features/auth/AuthScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { InvoiceList } from './features/invoices/InvoiceList';
import { InvoiceEditor } from './features/invoices/InvoiceEditor';
import { ProfileSettings } from './features/settings/ProfileSettings';
import { Layout } from './components/Layout';
import { User, Invoice } from './types';
import { logout, getInvoices, saveInvoice, deleteInvoice, saveInvoicesBulk, subscribeToAuthChanges } from './services/storage';
import { HashRouter } from 'react-router-dom';
import { Loader2, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'invoices' | 'settings'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      
      if (currentUser) {
        await fetchInvoices(currentUser.id);
      } else {
        setInvoices([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchInvoices = async (userId: string) => {
    setIsLoadingData(true);
    setError(null);
    try {
      const data = await getInvoices(userId);
      setInvoices(data);
    } catch (e: any) {
      console.error("Full fetch error:", e);
      // Safely extract error message
      let msg = 'Unknown error occurred';
      if (typeof e === 'string') msg = e;
      else if (e instanceof Error) msg = e.message;
      else if (e && typeof e === 'object') {
        msg = e.message || e.error_description || e.details || JSON.stringify(e);
      }
      
      setError(`Could not load invoices: ${msg}`);
    } finally {
        setIsLoadingData(false);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    fetchInvoices(loggedInUser.id);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!user) return;
    try {
        await saveInvoice(invoice);
        await fetchInvoices(user.id);
        setIsEditing(false);
        setCurrentInvoice(null);
        setView('invoices');
    } catch (e: any) {
        const msg = e.message || JSON.stringify(e);
        alert("Failed to save invoice: " + msg);
    }
  };

  const handleImportInvoices = async (importedInvoices: Invoice[]) => {
    if (!user) return;
    const invoicesWithUser = importedInvoices.map(inv => ({
        ...inv,
        userId: user.id
    }));
    try {
        await saveInvoicesBulk(invoicesWithUser);
        await fetchInvoices(user.id);
    } catch (e: any) {
        const msg = e.message || JSON.stringify(e);
        alert("Failed to import: " + msg);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this invoice?")) {
        try {
            await deleteInvoice(id);
            await fetchInvoices(user.id);
        } catch (e: any) {
             const msg = e.message || JSON.stringify(e);
             alert("Failed to delete: " + msg);
        }
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isAuthChecking) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout 
        user={user} 
        onLogout={handleLogout}
        currentView={view}
        onNavigate={(v) => {
          setView(v);
          setIsEditing(false);
        }}
      >
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                <div>
                  <strong>Connection Error: </strong> {error}
                  <p className="mt-1 text-xs text-red-600">Please ensure you have run the <code className="bg-red-100 px-1 rounded">supabase_setup.sql</code> script in your Supabase SQL Editor.</p>
                </div>
                <button 
                  onClick={() => user && fetchInvoices(user.id)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors"
                  title="Retry"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
            </div>
        )}

        {isEditing ? (
          <InvoiceEditor 
            userId={user.id} 
            initialData={currentInvoice} 
            onSave={handleSaveInvoice}
            onCancel={() => {
                setIsEditing(false);
                setCurrentInvoice(null);
            }} 
          />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard invoices={invoices} />}
            {view === 'invoices' && (
              <InvoiceList 
                invoices={invoices} 
                onCreate={() => {
                    setCurrentInvoice(null);
                    setIsEditing(true);
                }}
                onEdit={(inv) => {
                    setCurrentInvoice(inv);
                    setIsEditing(true);
                }}
                onDelete={handleDeleteInvoice}
                onImport={handleImportInvoices}
              />
            )}
            {view === 'settings' && (
              <ProfileSettings 
                user={user} 
                onUpdate={handleUpdateProfile} 
              />
            )}
          </>
        )}
      </Layout>
    </HashRouter>
  );
};

export default App;