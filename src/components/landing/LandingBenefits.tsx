
import React from 'react';
import { Shield, Clock, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const LandingBenefits = () => {
  const { companyName } = useBrandingConfig();
  
  const benefits = [
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados são criptografados e protegidos com os mais altos padrões de segurança"
    },
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Automatize suas finanças e tenha mais tempo para o que realmente importa"
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Faça parte de uma comunidade de pessoas que alcançaram seus objetivos financeiros"
    },
    {
      icon: Award,
      title: "Resultados Comprovados",
      description: `Milhares de usuários já transformaram suas vidas financeiras com o ${companyName}`
    }
  ];

  return (
    <section className="py-20 bg-muted/30 w-full">
      <div className="w-full px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher o {companyName}?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais do que uma ferramenta, é o seu parceiro na jornada rumo à liberdade financeira
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingBenefits;
