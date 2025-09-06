
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Crown, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

const SubscriptionStatusCard: React.FC = () => {
  const { subscription, hasActiveSubscription, isSubscriptionExpiring, isSubscriptionExpired } = useSubscription();
  const { t, language } = usePreferences();
  
  const locale = language === 'pt' ? ptBR : enUS;

  const getStatusVariant = () => {
    if (isSubscriptionExpired) return 'destructive';
    if (!hasActiveSubscription) return 'destructive';
    if (isSubscriptionExpiring) return 'outline';
    return 'success';
  };

  const getStatusText = () => {
    if (isSubscriptionExpired) return 'Plano Vencido';
    if (!hasActiveSubscription) return t('plans.status.inactive');
    if (isSubscriptionExpiring) return t('plans.status.expiring');
    return t('plans.status.active');
  };

  const getPlanText = () => {
    if (!subscription) return t('plans.noPlan');
    
    // Determine plan type based on plan_type field
    switch (subscription.plan_type) {
      case 'monthly':
        return t('plans.monthly');
      case 'annual':
        return t('plans.annual');
      default:
        return subscription.plan_type || t('plans.free');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('plans.currentPlan')}
          </CardTitle>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {getPlanText()}
            </p>
            {subscription?.current_period_end && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                {isSubscriptionExpired ? 'Vencido em' : hasActiveSubscription ? t('plans.renewsOn') : t('plans.expiresOn')}: {formatDate(subscription.current_period_end)}
              </div>
            )}
          </div>
          {isSubscriptionExpiring && hasActiveSubscription && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{t('plans.status.expiring')}</span>
            </div>
          )}
          {isSubscriptionExpired && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Plano vencido</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
