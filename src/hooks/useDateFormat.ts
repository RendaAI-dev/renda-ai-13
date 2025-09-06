
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePreferences } from '@/contexts/PreferencesContext';

export const useDateFormat = () => {
  const { language } = usePreferences();

  const formatDate = (date: Date | string, formatString: string = 'dd/MM/yyyy') => {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If the string is in YYYY-MM-DD format, parse it as local date to avoid timezone issues
      if (date.includes('-') && date.length === 10) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // For ISO strings or other formats, use parseISO which handles timezone better
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (language === 'pt') {
      return format(dateObj, formatString, { locale: ptBR });
    }
    
    return format(dateObj, formatString);
  };

  const formatMonth = (date: Date | string) => {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (date.includes('-') && date.length === 10) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (language === 'pt') {
      return format(dateObj, 'MMMM yyyy', { locale: ptBR });
    }
    
    return format(dateObj, 'MMMM yyyy');
  };

  const formatShortDate = (date: Date | string) => {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (date.includes('-') && date.length === 10) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (language === 'pt') {
      return format(dateObj, "d 'de' MMM", { locale: ptBR });
    }
    
    return format(dateObj, 'MMM d');
  };

  return {
    formatDate,
    formatMonth,
    formatShortDate
  };
};
