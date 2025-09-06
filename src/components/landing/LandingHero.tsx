
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const LandingHero = () => {
  const { companyName } = useBrandingConfig();
  
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('planos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section className="py-20 md:py-32 w-full">
      <div className="w-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Transforme sua vida financeira com o {companyName}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A ferramenta completa para controlar suas finanças, definir metas e 
            alcançar a liberdade financeira que você sempre sonhou.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="text-xs sm:text-sm md:text-base px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6" 
              onClick={scrollToPlans}
            >
              Estou pronto para economizar
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-xs sm:text-sm md:text-base px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6" 
              asChild
            >
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col items-center text-center p-6">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Controle Total</h3>
            <p className="text-muted-foreground">Acompanhe cada centavo e veja seu dinheiro crescer</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <Shield className="h-12 w-12 text-secondary mb-4" />
            <h3 className="text-lg font-semibold mb-2">100% Seguro</h3>
            <p className="text-muted-foreground">Seus dados protegidos com a melhor tecnologia</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <Smartphone className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sempre Disponível</h3>
            <p className="text-muted-foreground">Acesse de qualquer lugar, a qualquer momento</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;
