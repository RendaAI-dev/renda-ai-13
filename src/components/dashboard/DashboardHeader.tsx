
import React from 'react';
import { Button } from '@/components/ui/button';
import MonthNavigation from '@/components/common/MonthNavigation';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePreferences } from '@/contexts/PreferencesContext';

interface DashboardHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  hideValues: boolean;
  toggleHideValues: () => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentMonth,
  onMonthChange,
  hideValues,
  toggleHideValues,
  onAddTransaction
}) => {
  const { t } = usePreferences();

  return (
    <motion.div 
      className="flex flex-col sm:flex-row justify-between items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MonthNavigation currentMonth={currentMonth} onMonthChange={onMonthChange} />
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHideValues}
          className="flex items-center gap-2"
        >
          {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {hideValues ? t('common.show') : t('common.hide')} {t('common.values')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onAddTransaction('expense')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('transaction.addTransaction')}
        </Button>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
