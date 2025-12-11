import { supabase } from './supabaseClient';
import { Invoice, User } from '../types';

// --- Helper: Map Supabase User to App User ---
const mapUser = (user: any): User => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.full_name || user.email || 'User',
  avatarUrl: user.user_metadata?.avatar_url,
  companyName: user.user_metadata?.company_name,
  phone: user.user_metadata?.phone,
  address: user.user_metadata?.address,
});

// --- Auth Services ---

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapUser(session.user));
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

  return mapUser(data.user);
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
  
  if (!data.session) {
    throw new Error('Account created! Please check your email to confirm your account before logging in.');
  }

  return mapUser(data.user);
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return mapUser(session.user);
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  // Ensure "avatars" bucket exists and policies allow insert/select for auth users in Supabase Dashboard
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    // Check for common error indicating bucket missing
    if (uploadError.message.includes('Bucket not found') || (uploadError as any).statusCode === '404') {
        throw new Error('Storage bucket "avatars" not found. Please run the provided supabase_setup.sql script in your Supabase SQL Editor.');
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.name,
      avatar_url: updates.avatarUrl,
      company_name: updates.companyName,
      phone: updates.phone,
      address: updates.address,
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Update failed");

  return mapUser(data.user);
};

// --- Data Services ---

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
  const dbPayload = {
    user_id: invoice.userId,
    direction: invoice.direction,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    date: invoice.date,
    due_date: invoice.dueDate,
    status: invoice.status,
    items: invoice.items,
    notes: invoice.notes,
    total: invoice.total,
  };

  const isRealId = invoice.id && !invoice.id.startsWith('inv_');
  
  let result;
  
  if (isRealId) {
    const { data, error } = await supabase
      .from('invoices')
      .update(dbPayload)
      .eq('id', invoice.id)
      .select()
      .single();
    
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from('invoices')
      .insert(dbPayload)
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  }

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
    user_id: inv.userId,
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