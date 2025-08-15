import { db } from "./db";
import { membershipPlans } from "@shared/schema";

// Run the seed function immediately
seedDefaultPlans().then(() => {
  console.log("Seeding completed");
  process.exit(0);
}).catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

// Seed default membership plans
export async function seedDefaultPlans() {
  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(membershipPlans);
    if (existingPlans.length > 0) {
      console.log("Plans already exist, skipping seed");
      return;
    }

    const defaultPlans = [
      {
        name: "Público",
        description: "Acesso gratuito para estudantes e profissionais iniciantes",
        price: 0,
        minExperienceYears: 0,
        maxExperienceYears: null,
        requiresPayment: false,
        features: [
          "Acesso à comunidade",
          "Participação em fóruns",
          "Eventos básicos",
          "Networking inicial"
        ],
        rules: "Estar matriculado em curso de TI ou ter qualquer tempo de experiência comprovada",
        isActive: true,
        isAvailableForRegistration: true,
      },
      {
        name: "Júnior",
        description: "Para profissionais com até 5 anos de experiência",
        price: 9900, // R$ 99,00 in cents
        minExperienceYears: 1,
        maxExperienceYears: 5,
        requiresPayment: true,
        features: [
          "Todos os benefícios do plano Público",
          "Acesso a webinars exclusivos",
          "Mentorias individuais",
          "Certificados de participação",
          "Acesso ao banco de vagas"
        ],
        rules: "Ser profissional atuante em TI e comprovar de 1 a 5 anos de experiência",
        isActive: true,
        isAvailableForRegistration: true,
      },
      {
        name: "Pleno",
        description: "Para profissionais com 6 a 9 anos de experiência",
        price: 14900, // R$ 149,00 in cents
        minExperienceYears: 6,
        maxExperienceYears: 9,
        requiresPayment: true,
        features: [
          "Todos os benefícios do plano Júnior",
          "Acesso a cursos avançados",
          "Participação em grupos especializados",
          "Prioridade em eventos",
          "Consultoria técnica"
        ],
        rules: "Ser profissional atuante em TI e comprovar de 6 a 9 anos de experiência",
        isActive: true,
        isAvailableForRegistration: true,
      },
      {
        name: "Sênior",
        description: "Para profissionais com 10 anos ou mais de experiência",
        price: 19900, // R$ 199,00 in cents
        minExperienceYears: 10,
        maxExperienceYears: null,
        requiresPayment: true,
        features: [
          "Todos os benefícios do plano Pleno",
          "Acesso VIP a todos os eventos",
          "Participação no conselho consultivo",
          "Oportunidade de palestrante",
          "Rede premium de contatos",
          "Consultoria estratégica"
        ],
        rules: "Ser profissional atuante em TI e comprovar 10 anos ou mais de experiência",
        isActive: true,
        isAvailableForRegistration: true,
      },
      {
        name: "Diretivo",
        description: "Membros da diretoria da ANETI",
        price: 0,
        minExperienceYears: 0,
        maxExperienceYears: null,
        requiresPayment: false,
        features: [
          "Todos os benefícios",
          "Acesso administrativo",
          "Direito a voto em decisões",
          "Representação institucional"
        ],
        rules: "Atribuído apenas por administradores",
        isActive: true,
        isAvailableForRegistration: false, // Not available for public registration
      },
      {
        name: "Honra",
        description: "Membros honorários da ANETI",
        price: 0,
        minExperienceYears: 0,
        maxExperienceYears: null,
        requiresPayment: false,
        features: [
          "Reconhecimento especial",
          "Acesso vitalício",
          "Participação em cerimônias",
          "Representação institucional"
        ],
        rules: "Atribuído apenas por administradores para membros com contribuições excepcionais",
        isActive: true,
        isAvailableForRegistration: false, // Not available for public registration
      }
    ];

    await db.insert(membershipPlans).values(defaultPlans);
    console.log("Default membership plans seeded successfully!");
  } catch (error) {
    console.error("Error seeding plans:", error);
  }
}