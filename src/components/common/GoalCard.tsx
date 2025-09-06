
import React from 'react';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { Target, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick, onEdit, onDelete }) => {
  const { t, currency } = usePreferences();
  
  // Calculate progress percentage
  const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  
  // Determine progress color
  const getProgressColor = () => {
    if (progress < 25) return 'bg-metacash-error';
    if (progress < 50) return 'bg-metacash-warning';
    if (progress < 75) return 'bg-metacash-blue';
    return 'bg-metacash-success';
  };
  
  return (
    <Card 
      className="p-4 lg:p-6 transition-all hover:shadow-lg cursor-pointer border border-border/50 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base lg:text-lg truncate">{goal.name}</h3>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: goal.color + '20' }}
          >
            <Target className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: goal.color }} />
          </div>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="font-medium text-sm lg:text-base">
            {formatCurrency(goal.currentAmount, currency)}
          </span>
          <span className="text-xs lg:text-sm text-muted-foreground">
            {t('goals.toGo')} {formatCurrency(goal.targetAmount, currency)}
          </span>
        </div>
        
        <div className="progress-bar">
          <div 
            className={`progress-bar-value ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs lg:text-sm">
          <span className="font-medium">{progress}% {t('goals.complete')}</span>
          <span className="text-muted-foreground">
            {formatCurrency(goal.targetAmount - goal.currentAmount, currency)} {t('goals.remaining')}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default GoalCard;
