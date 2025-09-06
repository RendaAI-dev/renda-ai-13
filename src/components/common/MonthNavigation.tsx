
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { usePreferences } from '@/contexts/PreferencesContext';

interface MonthNavigationProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({ 
  currentMonth, 
  onMonthChange 
}) => {
  const { language } = usePreferences();
  
  // Always use Portuguese locale for month names as requested
  const formatLocale = pt;
  
  const handlePreviousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };
  
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePreviousMonth}
        className="hover:bg-muted rounded-full h-10 w-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <div className="text-xl font-medium capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: formatLocale })}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextMonth}
        className="hover:bg-muted rounded-full h-10 w-10"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default MonthNavigation;
