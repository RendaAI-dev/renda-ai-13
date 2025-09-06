
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Filter, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScheduleFiltersProps {
  selectedRecurrence: string | null;
  selectedCategory: string | null;
  onRecurrenceFilter: (recurrence: string | null) => void;
  onCategoryFilter: (category: string | null) => void;
  availableCategories: string[];
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  selectedRecurrence,
  selectedCategory,
  onRecurrenceFilter,
  onCategoryFilter,
  availableCategories
}) => {
  const { t } = usePreferences();
  const isMobile = useIsMobile();

  const recurrenceOptions = [
    { value: 'monthly', label: t('schedule.monthly') },
    { value: 'weekly', label: t('schedule.weekly') },
    { value: 'yearly', label: t('schedule.yearly') },
    { value: 'daily', label: t('schedule.daily') },
    { value: 'once', label: t('schedule.once') }
  ];

  const hasActiveFilters = selectedRecurrence || selectedCategory;

  const clearAllFilters = () => {
    onRecurrenceFilter(null);
    onCategoryFilter(null);
  };

  return (
    <Card>
      <CardHeader className={isMobile ? "pb-3" : undefined}>
        <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-base' : ''}`}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{t('common.filters')}</span>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className={`text-muted-foreground hover:text-foreground ${isMobile ? 'h-7 px-2' : ''}`}
            >
              <X className="h-3 w-3 mr-1" />
              {isMobile ? 'Limpar' : t('common.clearAll')}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={isMobile ? "pt-0" : "p-4"}>
        <div className={isMobile ? "space-y-3" : "space-y-4"}>
          {/* Filtro por Recorrência */}
          <div>
            <h4 className={`font-medium mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>{t('schedule.recurrence')}</h4>
            <div className="flex flex-wrap gap-2">
              {recurrenceOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedRecurrence === option.value ? 'default' : 'outline'}
                  className={`cursor-pointer hover:bg-accent ${isMobile ? 'text-xs' : ''}`}
                  onClick={() => onRecurrenceFilter(
                    selectedRecurrence === option.value ? null : option.value
                  )}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Filtro por Categoria */}
          {availableCategories.length > 0 && (
            <div>
              <h4 className={`font-medium mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>{t('categories.title')}</h4>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={`cursor-pointer hover:bg-accent ${isMobile ? 'text-xs' : ''}`}
                    onClick={() => onCategoryFilter(
                      selectedCategory === category ? null : category
                    )}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleFilters;
