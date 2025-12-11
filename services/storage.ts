import { supabase } from './supabaseClient';
import { Invoice, User } from '../types';

// --- Auth Services ---

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email || 'User',
      });
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user data returned');

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.full_name || data.user.email || 'User',
  };
};

export const signup = async (email: string, password: string, name: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user created');
  
  // If email confirmation is enabled, session might be null.
  if (!data.session) {
    throw new Error('Account created! Please check your email to confirm your account before logging in.');
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: name,
  };
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.full_name || session.user.email || 'User',
  };
};

// --- Data Services ---

// We map Supabase DB column names to our TypeScript Interface properties if they differ.
// In the SQL setup, I used snake_case for DB columns.

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    direction: row.direction,
    clientName: row.client_name,
    clientEmail: row.client_email,
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
    items: row.items,
    notes: row.notes,
    total: row.total,
    createdAt: row.created_at,
  }));
};

export const saveInvoice = async (invoice: Invoice): Promise<Invoice> => {
  // Convert camelCase to snake_case for DB
  const dbPayload = {
    // id: invoice.id, // Supabase generates ID for new inserts if not provided, or we use upsert
    user_id: invoice.userId,
    direction: invoice.direction,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    date: invoice.date,
    due_date: invoice.dueDate,
    status: invoice.status,
    items: invoice.items, // stored as jsonb
    notes: invoice.notes,
    total: invoice.total,
    // created_at: handled by default for new rows
  };

  // If ID looks like a UUID (real ID), include it for update. 
  // If it's a temp ID (starts with 'inv_') or empty, let Supabase gen UUID for insert.
  const isRealId = invoice.id && !invoice.id.startsWith('inv_');
  
  let result;
  
  if (isRealId) {
    // Update existing
    const { data, error } = await supabase
      .from('invoices')
      .update(dbPayload)
      .eq('id', invoice.id)
      .select()
      .single();
    
    if (error) throw error;
    result = data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('invoices')
      .insert(dbPayload)
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  }

  // Map back to frontend type
  return {
    id: result.id,
    userId: result.user_id,
    direction: result.direction,
    clientName: result.client_name,
    clientEmail: result.client_email,
    date: result.date,
    dueDate: result.due_date,
    status: result.status,
    items: result.items,
    notes: result.notes,
    total: result.total,
    createdAt: result.created_at,
  };
};

export const saveInvoicesBulk = async (invoices: Invoice[]): Promise<void> => {
  const payload = invoices.map(inv => ({
    user_id: inv.userId, // Ensure we use the logged-in user ID
    direction: inv.direction,
    client_name: inv.clientName,
    client_email: inv.clientEmail,
    date: inv.date,
    due_date: inv.dueDate,
    status: inv.status,
    items: inv.items,
    notes: inv.notes,
    total: inv.total,
  }));

  const { error } = await supabase.from('invoices').insert(payload);
  if (error) throw error;
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);
    
  if (error) throw error;
};
