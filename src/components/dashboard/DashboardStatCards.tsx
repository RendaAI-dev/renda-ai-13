
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/transactionUtils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface DashboardStatCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  hideValues: boolean;
  onNavigateToTransactionType: (type: 'income' | 'expense') => void;
}

const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  hideValues,
  onNavigateToTransactionType
}) => {
  const { t, currency } = usePreferences();
  
  const renderHiddenValue = () => '******';

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
      variants={itemVariants}
    >
      {/* Card do Saldo */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="relative overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
          <CardContent className="p-4 lg:p-6">
            <div className="text-center text-white relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-white/20">
                  <Wallet className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium opacity-90">{t('stats.currentBalance')}</p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold">
                {hideValues ? renderHiddenValue() : formatCurrency(balance, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Card de Receita */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="relative overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" 
          onClick={() => onNavigateToTransactionType('income')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-green-700 dark:text-green-400">
                  {t('common.income')}
                </p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-green-700 dark:text-green-400">
                {hideValues ? renderHiddenValue() : formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-green-200/30 dark:bg-green-800/20 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Card de Despesa */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="sm:col-span-2 lg:col-span-1"
      >
        <Card 
          className="relative overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20" 
          onClick={() => onNavigateToTransactionType('expense')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-red-700 dark:text-red-400">
                  {t('common.expense')}
                </p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-red-700 dark:text-red-400">
                {hideValues ? renderHiddenValue() : formatCurrency(totalExpenses, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-red-200/30 dark:bg-red-800/20 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStatCards;
