
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlanConfig } from '@/hooks/usePlanConfig';

const LandingPricing = () => {
  const { config, isLoading, error } = usePlanConfig();

  if (isLoading) {
    return (
      <section className="py-20 w-full" id="planos">
        <div className="w-full px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !config) {
    return (
      <section className="py-20 w-full" id="planos">
        <div className="w-full px-4">
          <div className="text-center text-red-600">
            Erro ao carregar configurações dos planos
          </div>
        </div>
      </section>
    );
  }

  const plans = [{
    name: "Mensal",
    price: config.prices.monthly.displayPrice,
    period: "/mês",
    description: "Para uso pessoal completo",
    features: ["Movimentos ilimitados", "Dashboard completo", "Todos os relatórios", "Metas ilimitadas", "Agendamentos", "Suporte prioritário"],
    limitations: [],
    buttonText: "Assinar Agora",
    buttonVariant: "default" as const,
    popular: false,
    linkTo: `/register?priceId=${config.prices.monthly.priceId}&planType=monthly`
  }, {
    name: "Anual",
    price: config.prices.annual.displayPrice,
    period: "/ano",
    originalPrice: config.prices.annual.displayOriginalPrice,
    savings: config.prices.annual.displaySavings,
    description: "Melhor custo-benefício",
    features: ["Movimentos ilimitados", "Dashboard completo", "Todos os relatórios", "Metas ilimitadas", "Agendamentos", "Suporte VIP", "Backup automático", "Análises avançadas"],
    limitations: [],
    buttonText: "Melhor Oferta",
    buttonVariant: "default" as const,
    popular: true,
    linkTo: `/register?priceId=${config.prices.annual.priceId}&planType=annual`
  }];

  return (
    <section className="py-20 w-full" id="planos">
      <div className="w-full px-4">
        <motion.div 
          className="text-center mb-16" 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transforme sua vida financeira com nossos planos completos
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" 
          initial={{ opacity: 0, y: 40 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, staggerChildren: 0.1 }} 
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: index * 0.1 }} 
              viewport={{ once: true }} 
              className="relative"
            >
              <Card className={`h-full relative ${plan.popular ? 'border-primary shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Mais Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                        <span className="ml-2 text-sm font-medium text-green-600">{plan.savings}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full" variant={plan.buttonVariant} size="lg" asChild>
                    <Link to={plan.linkTo}>{plan.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingPricing;
