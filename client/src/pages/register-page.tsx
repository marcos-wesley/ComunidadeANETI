import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import RegistrationSteps from "@/components/RegistrationSteps";

export default function RegisterPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // If user is already logged in and has an active membership, redirect to home
  if (user && user.membershipStatus === 'active') {
    return <Redirect to="/" />;
  }

  const handleRegistrationComplete = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary mx-auto rounded-lg flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ANETI</h1>
            <p className="text-gray-600">Associação Nacional dos Especialistas em TI</p>
            <h2 className="text-xl font-semibold text-gray-800 mt-4">
              Solicitação de Associação
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Complete todas as etapas para enviar sua solicitação de associação
            </p>
          </div>

          <RegistrationSteps onComplete={handleRegistrationComplete} />
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center">
        <div className="text-center text-white max-w-md px-8">
          <h2 className="text-3xl font-bold mb-4">
            Conecte-se com profissionais de TI
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Faça parte da maior rede de especialistas em tecnologia do Brasil.
            Compartilhe conhecimento, encontre oportunidades e evolua sua carreira.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Networking profissional</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Vagas exclusivas de emprego</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Cursos e certificações</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Fóruns especializados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}