import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Users, ArrowRight, Check } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Organize compromissos e nunca mais perca um atendimento"
    },
    {
      icon: DollarSign,
      title: "Controle Financeiro",
      description: "Acompanhe receitas e pagamentos pendentes em tempo real"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Mantenha histórico completo de cada cliente em um só lugar"
    }
  ];

  const benefits = [
    "Economize tempo com organização automática",
    "Nunca mais esqueça um compromisso",
    "Tenha controle total das suas finanças",
    "Acesse de qualquer dispositivo",
    "Interface simples e intuitiva",
    "Comece a usar em minutos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">Organiza Pro</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/login")}
            className="hover:shadow-md transition-smooth"
          >
            Entrar
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Gerencie seu negócio de forma{" "}
            <span className="text-gradient">simples e eficiente</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A plataforma completa para profissionais autônomos organizarem clientes, 
            compromissos e pagamentos em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/login")}
              className="text-lg h-14 px-8 shadow-glow hover:shadow-lg transition-smooth"
            >
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg h-14 px-8 hover:shadow-md transition-smooth"
            >
              Ver demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Tudo que você precisa em um só lugar
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-smooth animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Por que escolher o Organiza Pro?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <p className="text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-12 md:p-16 text-center shadow-glow">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Pronto para organizar seu negócio?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais que já transformaram a gestão 
            dos seus negócios com o Organiza Pro.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/login")}
            className="text-lg h-14 px-8 hover:shadow-xl transition-smooth"
          >
            Começar gratuitamente
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Organiza Pro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
