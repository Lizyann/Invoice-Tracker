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
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'invoices' | 'settings'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
    try {
      const data = await getInvoices(userId);
      setInvoices(data);
    } catch (e) {
      console.error("Failed to fetch invoices", e);
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
    } catch (e) {
        alert("Failed to save invoice. " + (e as Error).message);
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
    } catch (e) {
        alert("Failed to import. " + (e as Error).message);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this invoice?")) {
        try {
            await deleteInvoice(id);
            await fetchInvoices(user.id);
        } catch (e) {
             alert("Failed to delete. " + (e as Error).message);
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