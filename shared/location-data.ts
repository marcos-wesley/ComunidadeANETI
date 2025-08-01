// Brazilian states and cities data
export interface State {
  code: string;
  name: string;
  cities: string[];
}

// IT Areas as specified by the user, alphabetically ordered
export const itAreas = [
  "Automação e Robótica",
  "Banco de Dados e Administração de Dados",
  "Ciência de Dados e Inteligência Artificial",
  "Cloud Computing e Arquitetura em Nuvem",
  "Desenvolvimento de Software",
  "DevOps e Engenharia de Confiabilidade (SRE)",
  "Educação e Pesquisa em TI",
  "Engenharia de Dados e Big Data",
  "ERP, CRM e Sistemas Corporativos",
  "Gestão de Projetos e Produtos de TI",
  "Governança de TI e Gestão de Serviços",
  "Infraestrutura de TI",
  "Segurança da Informação e Cibersegurança",
  "Suporte Técnico e Help Desk",
  "Tecnologia Aplicada à Saúde (Health Tech)",
  "Tecnologia para o Setor Público e Governo Digital",
  "Telecomunicações e Redes",
  "Testes e Qualidade de Software (QA)",

  const state = brazilianStates.find(s => s.code === stateCode);
  return state ? state.cities : [];
};

// Helper function to get state options for select
export const getStateOptions = () => {
  return brazilianStates.map(state => ({
    value: state.code,
    label: state.name
  }));
};

// Helper function to get city options for select
export const getCityOptions = (stateCode: string) => {
  const cities = getCitiesByState(stateCode);
  return cities.map(city => ({
    value: city,
    label: city
  }));
};

// Helper function to get IT area options for select
export const getItAreaOptions = () => {
  return itAreas.map(area => ({
    value: area,
    label: area
  }));
};