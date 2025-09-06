
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  className
}) => {
  const { t } = usePreferences();
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("p-6 overflow-hidden relative", className)}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {change && (
              <p className={cn(
                "text-xs font-medium mt-2",
                change.isPositive ? "text-green-400" : "text-red-400"
              )}>
                {change.isPositive ? "+" : ""}{change.value}%{" "}
                <span className="opacity-70">{t('stats.fromLastPeriod')}</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          )}
        </div>
        
        {/* Decorative element */}
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
      </Card>
    </motion.div>
  );
};

export default StatCard;
