
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/transactionUtils';
import { Goal } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface GoalNavigationProps {
  goals: Goal[];
  currentGoalIndex: number;
  onGoalChange: (index: number) => void;
}

const GoalNavigation: React.FC<GoalNavigationProps> = ({ 
  goals, 
  currentGoalIndex, 
  onGoalChange 
}) => {
  const { t, currency } = usePreferences();
  
  if (goals.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          {t('goals.noGoals')}
        </p>
      </div>
    );
  }

  const currentGoal = goals[currentGoalIndex];
  const progress = Math.min(Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100), 100);
  
  const handlePreviousGoal = () => {
    onGoalChange(currentGoalIndex > 0 ? currentGoalIndex - 1 : goals.length - 1);
  };
  
  const handleNextGoal = () => {
    onGoalChange(currentGoalIndex < goals.length - 1 ? currentGoalIndex + 1 : 0);
  };
  
  return (
    <motion.div 
      className="p-4 bg-card border rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{t('goals.progress')}</h3>
        
        {goals.length > 1 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePreviousGoal}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentGoalIndex + 1}/{goals.length}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextGoal}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <p className="text-sm font-medium">{currentGoal.name}</p>
          <p className="text-sm font-medium">{progress}%</p>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-metacash-success">
            {formatCurrency(currentGoal.currentAmount, currency)}
          </span>
          <span className="text-muted-foreground">
            {t('goals.of')} {formatCurrency(currentGoal.targetAmount, currency)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalNavigation;
