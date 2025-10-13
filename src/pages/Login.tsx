import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { PreRegistrationModal } from "@/components/PreRegistrationModal";

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    return hasMinLength && hasLetter;
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      // Validação de registro
      if (!email || !password || !confirmPassword || !name || !profession) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos",
          variant: "destructive",
        });
        return;
      }

      if (!validatePassword(password)) {
        toast({
          title: "Senha inválida",
          description: "A senha deve ter no mínimo 6 caracteres e conter pelo menos 1 letra",
          variant: "destructive",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }

      try{
        await register(email, password, name, profession);

        toast({
          title: "Cadastro realizado!",
          description: `Bem-vindo, ${name}!`,
        });

        setTimeout(() => {
          navigate("/home");
        }, 500);
      } catch (err) {
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive",
        });
      }

    } else {
        try {
          await login(email, password);
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta ao Organiza Pro",
          });

          setTimeout(() => {
            navigate("/home");
          }, 500);
        } catch (err) {
          toast({
            title: "Erro",
            description: err.message,
            variant: "destructive",
          });
        }
      }
  };

  return (
    <div className="min-h-screen flex align-items-center">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Calendar className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">Organiza Pro</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
                {isRegister ? "Criar conta" : "Bem-vindo"}
              </h1>
              <p className="text-muted-foreground">
                {isRegister 
                  ? "Preencha os dados para criar sua conta" 
                  : "Entre na sua conta para gerenciar seu negócio"
                }
              </p>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    type="text"
                    placeholder="Ex: Psicólogo, Personal Trainer..."
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isRegister}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegister && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres e pelo menos 1 letra
                </p>
              )}
            </div>

            {isRegister && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
            <div className="d-flex flex-column gap-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-base shadow-glow hover:shadow-lg transition-smooth"
              >
                {isRegister ? "Criar conta" : "Entrar"}
              </Button>
              <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full h-12 text-base shadow-glow hover:shadow-lg transition-smooth"
                >
                  {"Cadastre-se"}
              </Button>
            </div>
          </form>

          {/* Toggle Register/Login
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isRegister 
                ? "Já tem uma conta? Entrar" 
                : "Cadastre-se"
              }
            </button>
          </div> */}

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-primary transition-smooth"
            >
              ← Voltar para a página inicial
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Illustration/Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary-glow p-12 items-center justify-center">
        <div className="max-w-md text-primary-foreground animate-slide-up">
          <h2 className="text-4xl font-bold mb-6">
            Organize seu negócio de forma profissional
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Agenda Inteligente</h3>
                <p className="text-primary-foreground/80">
                  Visualize todos os seus compromissos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Controle Financeiro</h3>
                <p className="text-primary-foreground/80">
                  Acompanhe receitas e pagamentos pendentes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestão de Clientes</h3>
                <p className="text-primary-foreground/80">
                  Mantenha histórico completo de cada cliente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PreRegistrationModal
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </div>
  );
};

export default Login;
