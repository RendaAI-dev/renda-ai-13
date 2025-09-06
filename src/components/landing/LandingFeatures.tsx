
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Target, Calendar, PieChart, Wallet, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingFeatures = () => {
  const features = [
    {
      icon: Wallet,
      title: "Controle de Transações",
      description: "Registre receitas e despesas de forma rápida e organizada"
    },
    {
      icon: Target,
      title: "Metas Financeiras",
      description: "Defina objetivos e acompanhe seu progresso em tempo real"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Visualize seus dados com gráficos intuitivos e relatórios completos"
    },
    {
      icon: Calendar,
      title: "Agendamento",
      description: "Programe pagamentos recorrentes e nunca esqueça uma conta"
    },
    {
      icon: PieChart,
      title: "Análise por Categoria",
      description: "Entenda onde seu dinheiro está sendo gasto"
    },
    {
      icon: TrendingUp,
      title: "Dashboard Inteligente",
      description: "Visão geral completa da sua situação financeira"
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
            Tudo que você precisa para organizar suas finanças
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas e intuitivas para transformar a maneira como você lida com o dinheiro
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingFeatures;
