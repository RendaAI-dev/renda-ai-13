
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const TimeRangeSelector = () => {
  const { t } = usePreferences();
  const { timeRange, setTimeRange, customStartDate, customEndDate, setCustomDateRange } = useAppContext();
  
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as any);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (value) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        startDate = sevenDaysAgo;
        endDate = today;
        break;
      case '14days':
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        startDate = fourteenDaysAgo;
        endDate = today;
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        startDate = thirtyDaysAgo;
        endDate = today;
        break;
      case 'custom':
        // Keep current custom dates
        return;
      default:
        break;
    }
    
    setCustomDateRange(startDate, endDate);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={timeRange} onValueChange={handleTimeRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('time.selectRange')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="14days">Últimos 14 dias</SelectItem>
          <SelectItem value="30days">Últimos 30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      {timeRange === 'custom' && (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal"
                size="sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, 'PP') : t('time.startDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customStartDate || undefined}
                onSelect={(date) => setCustomDateRange(date, customEndDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal"
                size="sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, 'PP') : t('time.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customEndDate || undefined}
                onSelect={(date) => setCustomDateRange(customStartDate, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;
