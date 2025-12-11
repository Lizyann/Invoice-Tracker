import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import { Button, Input, Select, Card } from '../../components/ui';
import { Plus, Trash2, Save, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface InvoiceEditorProps {
  initialData?: Invoice | null;
  userId: string;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ initialData, userId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    direction: 'outgoing', // Default to outgoing
    clientName: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: InvoiceStatus.Draft,
    items: [],
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        direction: initialData.direction || 'outgoing',
        date: initialData.date.split('T')[0],
        dueDate: initialData.dueDate.split('T')[0],
      });
      setItems(initialData.items);
    } else {
      // Default empty item
      setItems([{ id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof Invoice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || items.length === 0) return;

    const total = calculateTotal();
    const invoiceToSave: Invoice = {
      id: initialData?.id || `inv_${Date.now()}`,
      userId,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      direction: formData.direction || 'outgoing',
      clientName: formData.clientName!,
      clientEmail: formData.clientEmail || '',
      date: new Date(formData.date!).toISOString(),
      dueDate: new Date(formData.dueDate!).toISOString(),
      status: formData.status as InvoiceStatus,
      items: items.map(i => ({...i, quantity: Number(i.quantity), price: Number(i.price)})),
      notes: formData.notes,
      total,
    };

    onSave(invoiceToSave);
  };

  const isIncoming = formData.direction === 'incoming';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
            {initialData ? (isIncoming ? 'Edit Bill' : 'Edit Invoice') : (isIncoming ? 'New Bill' : 'New Invoice')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6 md:p-8 space-y-8">
          
          {/* Direction Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                <button
                    type="button"
                    onClick={() => handleInputChange('direction', 'outgoing')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${!isIncoming ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Invoice (Income)
                </button>
                <button
                    type="button"
                    onClick={() => handleInputChange('direction', 'incoming')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${isIncoming ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Bill (Expense)
                </button>
            </div>
          </div>

          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label={isIncoming ? "Vendor Name" : "Client Name"}
                placeholder={isIncoming ? "e.g. Office Supplies Co" : "e.g. Acme Corp"}
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                required
              />
              <Input
                label={isIncoming ? "Vendor Email" : "Client Email"}
                type="email"
                placeholder={isIncoming ? "billing@vendor.com" : "billing@client.com"}
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              />
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                />
                <Input
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    required
                />
               </div>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as InvoiceStatus)}
              >
                <option value={InvoiceStatus.Draft}>Draft</option>
                <option value={InvoiceStatus.Pending}>Pending</option>
                <option value={InvoiceStatus.Paid}>Paid</option>
                <option value={InvoiceStatus.Overdue}>Overdue</option>
              </Select>
            </div>
          </div>

          <div className="border-t border-slate-100 my-6" />

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
            </div>
            
            <div className="space-y-3">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 px-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50 p-3 rounded-lg md:bg-transparent md:p-0">
                  <div className="col-span-6">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                     <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="text-right"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-right"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-1 flex justify-end md:justify-center pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 my-6" />

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes / Journal Entry</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                placeholder="Add additional notes, payment terms, or journal details here..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
            <div className="flex flex-col justify-end items-end space-y-4">
              <div className="w-full md:w-64 bg-slate-50 p-4 rounded-lg space-y-3">
                 <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-slate-600">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                 </div>
                 <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-lg text-slate-900">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Bar */}
        <div className="flex justify-end gap-3 sticky bottom-6 z-10">
          <Card className="p-2 flex gap-3 shadow-2xl shadow-indigo-100 bg-white/90 backdrop-blur-sm border-indigo-100">
            <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit" className="px-8 shadow-lg shadow-indigo-200">
                <Save className="h-4 w-4 mr-2" />
                Save {isIncoming ? 'Bill' : 'Invoice'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
};
