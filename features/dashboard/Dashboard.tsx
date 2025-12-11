import React from 'react';
import { Invoice, InvoiceStatus } from '../../types';
import { Card } from '../../components/ui';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  // Financials
  const totalIncome = invoices
    .filter(inv => inv.direction === 'outgoing' && inv.status !== InvoiceStatus.Draft)
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalExpense = invoices
    .filter(inv => inv.direction === 'incoming' && inv.status !== InvoiceStatus.Draft)
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingIncome = invoices
    .filter(inv => inv.direction === 'outgoing' && inv.status === InvoiceStatus.Pending)
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdueIncome = invoices
    .filter(inv => inv.direction === 'outgoing' && inv.status === InvoiceStatus.Overdue)
    .reduce((sum, inv) => sum + inv.total, 0);

  // --- Charts Data Preparation ---

  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        fullDate: d,
        total: 0,
        pending: 0,
        overdue: 0
      });
    }
    return months;
  };

  // Bar Chart Data (Total Revenue vs Expense)
  const barChartData = getLast6Months().map(month => {
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === month.fullDate.getMonth() && d.getFullYear() === month.fullDate.getFullYear();
    });

    const income = monthInvoices
      .filter(inv => inv.direction === 'outgoing' && inv.status !== InvoiceStatus.Draft)
      .reduce((sum, inv) => sum + inv.total, 0);
      
    return { ...month, total: income };
  });

  // Line Chart Data (Pending vs Overdue Trends)
  // We map based on Invoice Date to show the volume of invoices created that are currently pending/overdue
  const lineChartData = getLast6Months().map(month => {
    const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === month.fullDate.getMonth() && d.getFullYear() === month.fullDate.getFullYear();
    });

    const pending = monthInvoices
        .filter(inv => inv.status === InvoiceStatus.Pending)
        .reduce((sum, inv) => sum + inv.total, 0);

    const overdue = monthInvoices
        .filter(inv => inv.status === InvoiceStatus.Overdue)
        .reduce((sum, inv) => sum + inv.total, 0);

    return { ...month, pending, overdue };
  });

  const StatCard = ({ title, amount, icon: Icon, color, bg }: any) => (
    <Card className="p-6 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-bold text-slate-900">${amount.toLocaleString()}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Income" 
            amount={totalIncome} 
            icon={ArrowUpRight} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
        />
        <StatCard 
            title="Total Expenses" 
            amount={totalExpense} 
            icon={ArrowDownLeft} 
            color="text-rose-600" 
            bg="bg-rose-50" 
        />
        <StatCard 
            title="Pending Income" 
            amount={pendingIncome} 
            icon={Clock} 
            color="text-amber-600" 
            bg="bg-amber-50" 
        />
         <StatCard 
            title="Overdue Income" 
            amount={overdueIncome} 
            icon={AlertCircle} 
            color="text-red-600" 
            bg="bg-red-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Overview Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Revenue History</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis hide />
                <Tooltip 
                    cursor={{ fill: '#f1f5f9', radius: 8 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={40} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending vs Overdue Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Pending vs Overdue Trends</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pending"
                    stroke="#d97706" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                />
                <Line 
                    type="monotone" 
                    dataKey="overdue" 
                    name="Overdue"
                    stroke="#dc2626" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${inv.direction === 'outgoing' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                    {inv.direction === 'outgoing' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.clientName}</p>
                    <p className="text-xs text-slate-500">#{inv.id.slice(-6).toUpperCase()} • {new Date(inv.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                    <span className={`block text-sm font-semibold ${inv.direction === 'outgoing' ? 'text-slate-900' : 'text-slate-600'}`}>
                        {inv.direction === 'outgoing' ? '+' : '-'}${inv.total.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === InvoiceStatus.Paid ? 'bg-emerald-100 text-emerald-700' : 
                        inv.status === InvoiceStatus.Overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {inv.status}
                    </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
            )}
          </div>
        </Card>
    </div>
  );
};
