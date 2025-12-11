import React, { useState, useRef } from 'react';
import { Invoice, InvoiceStatus } from '../../types';
import { Card, Button, Input, Select } from '../../components/ui';
import { Plus, Search, FileText, Calendar, Trash, Edit2, Download, Upload, Loader2, ArrowUpRight, ArrowDownLeft, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InvoiceListProps {
  invoices: Invoice[];
  onCreate: () => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onImport: (invoices: Invoice[]) => Promise<void>;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onCreate, onEdit, onDelete, onImport }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesDirection = filterDirection === 'all' || inv.direction === filterDirection;
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch && matchesDirection;
  });

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Paid: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case InvoiceStatus.Pending: return 'bg-amber-100 text-amber-700 border-amber-200';
      case InvoiceStatus.Overdue: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExport = () => {
    const dataToExport = filteredInvoices.map(inv => ({
      ...inv,
      items: JSON.stringify(inv.items)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `InvoiceFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const importedInvoices: Invoice[] = data.map((row: any) => {
           return {
             ...row,
             direction: row.direction || 'outgoing', // Default if missing
             items: row.items ? JSON.parse(row.items) : [],
             total: Number(row.total) || 0,
             createdAt: row.createdAt || new Date().toISOString()
           };
        });

        if (importedInvoices.length > 0) {
            await onImport(importedInvoices);
            alert(`Successfully imported ${importedInvoices.length} invoices.`);
        } else {
            alert("No valid invoice data found in file.");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import file. Please ensure it is a valid InvoiceFlow Excel export.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSendEmail = (inv: Invoice) => {
    if (!inv.clientEmail) {
      alert("No email address for this client/vendor.");
      return;
    }
    const subject = `Invoice ${inv.id} from InvoiceFlow`;
    const body = `Dear ${inv.clientName},\n\nPlease find attached details for invoice ${inv.id}.\n\nTotal Due: $${inv.total.toFixed(2)}\nDue Date: ${new Date(inv.dueDate).toLocaleDateString()}\n\nThank you for your business.`;
    
    window.open(`mailto:${inv.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices & Bills</h1>
            <p className="text-slate-500">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2 w-full xl:w-auto flex-wrap">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".xlsx, .xls"
            />
             <Button variant="outline" onClick={handleImportClick} disabled={isImporting} className="flex-1 xl:flex-none">
                {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex-1 xl:flex-none">
                <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button onClick={onCreate} className="shadow-lg shadow-indigo-200 flex-1 xl:flex-none">
                <Plus className="h-4 w-4 mr-2" /> Create New
            </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search client, vendor or ID..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto flex gap-2">
             <Select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="w-40">
                <option value="all">All Types</option>
                <option value="outgoing">Invoices (Income)</option>
                <option value="incoming">Bills (Expense)</option>
             </Select>
             <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-40">
               <option value="all">All Statuses</option>
               <option value={InvoiceStatus.Paid}>Paid</option>
               <option value={InvoiceStatus.Pending}>Pending</option>
               <option value={InvoiceStatus.Overdue}>Overdue</option>
               <option value={InvoiceStatus.Draft}>Draft</option>
             </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold w-10">Type</th>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Client / Vendor</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-slate-300" />
                            <p>No records found matching your criteria.</p>
                        </div>
                    </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                     <td className="px-6 py-4">
                        <div className={`p-1.5 rounded-lg w-fit ${inv.direction === 'outgoing' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`} title={inv.direction === 'outgoing' ? 'Invoice (Income)' : 'Bill (Expense)'}>
                            {inv.direction === 'outgoing' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                        <span className="font-mono text-xs text-slate-500">#</span>{inv.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{inv.clientName}</div>
                        <div className="text-xs text-slate-500">{inv.clientEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                        ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="sm" onClick={() => handleSendEmail(inv)} title="Send via Email">
                            <Mail className="h-4 w-4 text-indigo-500" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => onEdit(inv)} title="Edit">
                            <Edit2 className="h-4 w-4 text-slate-600" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => onDelete(inv.id)} title="Delete">
                            <Trash className="h-4 w-4 text-red-500" />
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
