export enum InvoiceStatus {
  Draft = 'draft',
  Pending = 'pending',
  Paid = 'paid',
  Overdue = 'overdue',
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  userId: string;
  direction: 'outgoing' | 'incoming'; // outgoing = Invoice (Income), incoming = Bill (Expense)
  clientName: string; // Acts as Vendor Name for incoming
  clientEmail: string; // Acts as Vendor Email for incoming
  date: string; // ISO Date string
  dueDate: string; // ISO Date string
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  total: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
