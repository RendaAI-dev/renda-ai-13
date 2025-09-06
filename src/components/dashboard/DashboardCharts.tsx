
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, createLocalDate } from '@/utils/transactionUtils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { calculateCategorySummaries } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface DashboardChartsProps {
  currentMonth?: Date;
  hideValues?: boolean;
  monthTransactions?: any[]; // NEW: Accept month-specific transactions
}

// Generate chart data from the actual transaction data
const generateChartData = (transactions: any[], month: Date) => {
  console.log("Generating chart data for month:", month, "with transactions:", transactions.length);
  
  // Create a map to group transactions by day
  const transactionsByDay = new Map();
  
  // Initialize with all days in the month
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(month.getFullYear(), month.getMonth(), i);
    transactionsByDay.set(i, {
      day: i,
      income: 0,
      expenses: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }
  
  // Fill with actual transaction data
  transactions.forEach(transaction => {
    const transactionDate = createLocalDate(transaction.date);
    const day = transactionDate.getDate();
    
    // Skip if not from the current month
    if (transactionDate.getMonth() !== month.getMonth() || 
        transactionDate.getFullYear() !== month.getFullYear()) {
      return;
    }
    
    const dayData = transactionsByDay.get(day) || {
      day,
      income: 0, 
      expenses: 0,
      dateLabel: `${day}/${month.getMonth() + 1}`
    };
    
    if (transaction.type === 'income') {
      dayData.income += transaction.amount;
    } else {
      dayData.expenses += transaction.amount;
    }
    
    transactionsByDay.set(day, dayData);
  });
  
  // Convert map to array and calculate balance
  const result = Array.from(transactionsByDay.values());
  result.forEach(item => {
    item.balance = item.income - item.expenses;
  });
  
  // Sort by day
  result.sort((a, b) => a.day - b.day);
  
  // If we have too many days, reduce by grouping
  if (daysInMonth > 10) {
    const condensedData = [];
    const step = Math.ceil(daysInMonth / 10);
    
    for (let i = 0; i < daysInMonth; i += step) {
      const group = result.slice(i, i + step);
      if (group.length > 0) {
        const groupData = {
          day: group[0].day,
          dateLabel: `${group[0].day}-${group[group.length - 1].day}/${month.getMonth() + 1}`,
          income: group.reduce((sum, item) => sum + item.income, 0),
          expenses: group.reduce((sum, item) => sum + item.expenses, 0),
          balance: group.reduce((sum, item) => sum + item.balance, 0)
        };
        condensedData.push(groupData);
      }
    }
    
    return condensedData;
  }
  
  return result;
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  currentMonth = new Date(), 
  hideValues = false,
  monthTransactions 
}) => {
  const { filteredTransactions } = useAppContext();
  const { currency, t } = usePreferences();
  
  // Use monthTransactions if provided, otherwise fall back to filteredTransactions
  const transactionsToUse = monthTransactions || filteredTransactions;
  const expenseSummaries = calculateCategorySummaries(transactionsToUse, 'expense');
  
  console.log("Rendering charts with transactions:", transactionsToUse.length, "for month:", currentMonth.toDateString());
  
  // Generate data for the current month using the provided transactions
  const monthData = generateChartData(transactionsToUse, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'income' 
                ? t('common.income') 
                : entry.name === 'expenses' 
                  ? t('common.expense')
                  : t('common.balance')}: {
                    hideValues 
                      ? '******' 
                      : formatCurrency(entry.value, currency)
                  }
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Income/Expense Chart */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.incomeVsExpenses')} - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis tickFormatter={(value) => 
                    hideValues 
                      ? '***' 
                      : formatCurrency(value, currency).split('.')[0]
                  } />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name={t('common.income')} 
                    stroke="#26DE81" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name={t('common.expense')} 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.expenseBreakdown')} - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {expenseSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseSummaries}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                      label={({ category, percent }) => 
                        `${category}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expenseSummaries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      formatter={(value) => 
                        hideValues 
                          ? '******' 
                          : formatCurrency(Number(value), currency)
                      } 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-metacash-gray">{t('common.noData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
