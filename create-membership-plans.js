import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { membershipPlans } from './shared/schema.ts';
import crypto from 'crypto';

// Configurar conexão com banco
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida');
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function createMembershipPlans() {
  try {
    console.log('Criando planos de membership...');

    const plans = [
      {
        id: crypto.randomUUID(),
        name: 'Plano Público',
        description: 'Acesso básico à plataforma ANETI com recursos essenciais para networking profissional.',
        price: 0, // Gratuito
        minExperienceYears: 0,
        maxExperienceYears: null,
        requiresPayment: false,
        isRecurring: false,
        billingPeriod: 'one_time',
        features: [
          'Perfil profissional básico',
          'Visualização de membros',
          'Acesso aos grupos públicos',
          'Participação em discussões'
        ],
        benefits: [
          'Networking básico',
          'Acesso a eventos públicos',
          'Newsletter da ANETI'
        ],
        badgeColor: '#6B7280',
        priority: 1,
        isActive: true,
        isAvailableForRegistration: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Plano Júnior',
        description: 'Para profissionais iniciantes em TI com até 3 anos de experiência.',
        price: 2500, // R$ 25,00
        minExperienceYears: 0,
        maxExperienceYears: 3,
        requiresPayment: true,
        isRecurring: true,
        billingPeriod: 'monthly',
        features: [
          'Todos os recursos do Plano Público',
          'Mensagens diretas',
          'Acesso a grupos exclusivos',
          'Certificado de membro'
        ],
        benefits: [
          'Mentoria com profissionais seniores',
          'Desconto em cursos',
          'Acesso prioritário a vagas júnior'
        ],
        badgeColor: '#10B981',
        priority: 2,
        isActive: true,
        isAvailableForRegistration: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Plano Pleno',
        description: 'Para profissionais com experiência consolidada em TI (3-8 anos).',
        price: 4900, // R$ 49,00
        minExperienceYears: 3,
        maxExperienceYears: 8,
        requiresPayment: true,
        isRecurring: true,
        billingPeriod: 'monthly',
        features: [
          'Todos os recursos do Plano Júnior',
          'Criação de grupos',
          'Publicação de artigos',
          'Acesso a pesquisas salariais'
        ],
        benefits: [
          'Networking com líderes da indústria',
          'Participação em comitês técnicos',
          'Certificação profissional ANETI'
        ],
        badgeColor: '#3B82F6',
        priority: 3,
        isActive: true,
        isAvailableForRegistration: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Plano Sênior',
        description: 'Para profissionais experientes e líderes técnicos (8+ anos).',
        price: 9900, // R$ 99,00
        minExperienceYears: 8,
        maxExperienceYears: null,
        requiresPayment: true,
        isRecurring: true,
        billingPeriod: 'monthly',
        features: [
          'Todos os recursos do Plano Pleno',
          'Moderação de comunidades',
          'Acesso a relatórios exclusivos',
          'Programa de palestrantes'
        ],
        benefits: [
          'Acesso VIP a eventos',
          'Consultoria especializada',
          'Reconhecimento como especialista'
        ],
        badgeColor: '#8B5CF6',
        priority: 4,
        isActive: true,
        isAvailableForRegistration: true
      }
    ];

    for (const plan of plans) {
      await db.insert(membershipPlans).values(plan);
      console.log(`✅ Criado: ${plan.name}`);
    }

    console.log('\n🎉 Todos os planos de membership foram criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar planos:', error);
    throw error;
  }
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
  createMembershipPlans()
    .then(() => {
      console.log('✅ Processo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha:', error);
      process.exit(1);
    });
}

export { createMembershipPlans };