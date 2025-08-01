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
  "TI Sustentável e Tecnologia Verde",
  "UX/UI Design e Experiência do Usuário",
].sort();

// Brazilian states with major cities, alphabetically ordered
export const brazilianStates: State[] = [
  {
    code: "AC",
    name: "Acre",
    cities: [
      "Brasiléia",
      "Cruzeiro do Sul",
      "Feijó",
      "Rio Branco",
      "Sena Madureira",
      "Tarauacá"
    ].sort()
  },
  {
    code: "AL",
    name: "Alagoas",
    cities: [
      "Arapiraca",
      "Maceió",
      "Palmeira dos Índios",
      "Penedo",
      "Rio Largo",
      "União dos Palmares"
    ].sort()
  },
  {
    code: "AP",
    name: "Amapá",
    cities: [
      "Laranjal do Jari",
      "Macapá",
      "Oiapoque",
      "Santana",
      "Serra do Navio"
    ].sort()
  },
  {
    code: "AM",
    name: "Amazonas",
    cities: [
      "Coari",
      "Itacoatiara",
      "Manacapuru",
      "Manaus",
      "Parintins",
      "Tabatinga",
      "Tefé"
    ].sort()
  },
  {
    code: "BA",
    name: "Bahia",
    cities: [
      "Barreiras",
      "Camaçari",
      "Feira de Santana",
      "Ilhéus",
      "Itabuna",
      "Jequié",
      "Juazeiro",
      "Lauro de Freitas",
      "Paulo Afonso",
      "Porto Seguro",
      "Salvador",
      "Simões Filho",
      "Teixeira de Freitas",
      "Vitória da Conquista"
    ].sort()
  },
  {
    code: "CE",
    name: "Ceará",
    cities: [
      "Caucaia",
      "Crato",
      "Fortaleza",
      "Iguatu",
      "Juazeiro do Norte",
      "Maracanaú",
      "Maranguape",
      "Sobral"
    ].sort()
  },
  {
    code: "DF",
    name: "Distrito Federal",
    cities: [
      "Brasília"
    ]
  },
  {
    code: "ES",
    name: "Espírito Santo",
    cities: [
      "Cachoeiro de Itapemirim",
      "Cariacica",
      "Colatina",
      "Guarapari",
      "Linhares",
      "São Mateus",
      "Serra",
      "Viana",
      "Vila Velha",
      "Vitória"
    ].sort()
  },
  {
    code: "GO",
    name: "Goiás",
    cities: [
      "Águas Lindas de Goiás",
      "Anápolis",
      "Aparecida de Goiânia",
      "Catalão",
      "Formosa",
      "Goiânia",
      "Itumbiara",
      "Jataí",
      "Luziânia",
      "Planaltina",
      "Rio Verde",
      "Valparaíso de Goiás"
    ].sort()
  },
  {
    code: "MA",
    name: "Maranhão",
    cities: [
      "Açailândia",
      "Bacabal",
      "Balsas",
      "Codó",
      "Imperatriz",
      "Paço do Lumiar",
      "São José de Ribamar",
      "São Luís",
      "Timon"
    ].sort()
  },
  {
    code: "MT",
    name: "Mato Grosso",
    cities: [
      "Barra do Garças",
      "Cáceres",
      "Cuiabá",
      "Rondonópolis",
      "Sinop",
      "Tangará da Serra",
      "Várzea Grande"
    ].sort()
  },
  {
    code: "MS",
    name: "Mato Grosso do Sul",
    cities: [
      "Campo Grande",
      "Corumbá",
      "Dourados",
      "Naviraí",
      "Ponta Porã",
      "Três Lagoas"
    ].sort()
  },
  {
    code: "MG",
    name: "Minas Gerais",
    cities: [
      "Araguari",
      "Barbacena",
      "Belo Horizonte",
      "Betim",
      "Contagem",
      "Coronel Fabriciano",
      "Divinópolis",
      "Governador Valadares",
      "Ibirité",
      "Ipatinga",
      "Ituiutaba",
      "Juiz de Fora",
      "Montes Claros",
      "Muriaé",
      "Poços de Caldas",
      "Pouso Alegre",
      "Ribeirão das Neves",
      "Sabará",
      "Santa Luzia",
      "São João del Rei",
      "Sete Lagoas",
      "Teófilo Otoni",
      "Uberaba",
      "Uberlândia",
      "Varginha",
      "Vespasiano"
    ].sort()
  },
  {
    code: "PA",
    name: "Pará",
    cities: [
      "Abaetetuba",
      "Altamira",
      "Ananindeua",
      "Barcarena",
      "Belém",
      "Bragança",
      "Castanhal",
      "Itaituba",
      "Marabá",
      "Parauapebas",
      "Santarém"
    ].sort()
  },
  {
    code: "PB",
    name: "Paraíba",
    cities: [
      "Bayeux",
      "Cabedelo",
      "Campina Grande",
      "João Pessoa",
      "Patos",
      "Santa Rita",
      "Sousa"
    ].sort()
  },
  {
    code: "PR",
    name: "Paraná",
    cities: [
      "Apucarana",
      "Arapongas",
      "Araucária",
      "Campo Largo",
      "Cascavel",
      "Colombo",
      "Curitiba",
      "Foz do Iguaçu",
      "Guarapuava",
      "Londrina",
      "Maringá",
      "Paranaguá",
      "Pinhais",
      "Ponta Grossa",
      "São José dos Pinhais",
      "Toledo",
      "Umuarama"
    ].sort()
  },
  {
    code: "PE",
    name: "Pernambuco",
    cities: [
      "Cabo de Santo Agostinho",
      "Camaragibe",
      "Caruaru",
      "Garanhuns",
      "Igarassu",
      "Jaboatão dos Guararapes",
      "Olinda",
      "Paulista",
      "Petrolina",
      "Recife",
      "São Lourenço da Mata",
      "Vitória de Santo Antão"
    ].sort()
  },
  {
    code: "PI",
    name: "Piauí",
    cities: [
      "Parnaíba",
      "Picos",
      "Teresina"
    ].sort()
  },
  {
    code: "RJ",
    name: "Rio de Janeiro",
    cities: [
      "Angra dos Reis",
      "Belford Roxo",
      "Cabo Frio",
      "Campos dos Goytacazes",
      "Duque de Caxias",
      "Itaboraí",
      "Macaé",
      "Magé",
      "Maricá",
      "Mesquita",
      "Nilópolis",
      "Niterói",
      "Nova Friburgo",
      "Nova Iguaçu",
      "Petrópolis",
      "Queimados",
      "Resende",
      "Rio de Janeiro",
      "São Gonçalo",
      "São João de Meriti",
      "Seropédica",
      "Teresópolis",
      "Volta Redonda"
    ].sort()
  },
  {
    code: "RN",
    name: "Rio Grande do Norte",
    cities: [
      "Caicó",
      "Currais Novos",
      "Mossoró",
      "Natal",
      "Parnamirim"
    ].sort()
  },
  {
    code: "RS",
    name: "Rio Grande do Sul",
    cities: [
      "Alvorada",
      "Bagé",
      "Bento Gonçalves",
      "Cachoeirinha",
      "Canoas",
      "Caxias do Sul",
      "Erechim",
      "Gravataí",
      "Novo Hamburgo",
      "Passo Fundo",
      "Pelotas",
      "Porto Alegre",
      "Rio Grande",
      "Santa Cruz do Sul",
      "Santa Maria",
      "Sapucaia do Sul",
      "Uruguaiana",
      "Viamão"
    ].sort()
  },
  {
    code: "RO",
    name: "Rondônia",
    cities: [
      "Ariquemes",
      "Cacoal",
      "Guajará-Mirim",
      "Ji-Paraná",
      "Porto Velho",
      "Vilhena"
    ].sort()
  },
  {
    code: "RR",
    name: "Roraima",
    cities: [
      "Boa Vista",
      "Rorainópolis"
    ].sort()
  },
  {
    code: "SC",
    name: "Santa Catarina",
    cities: [
      "Balneário Camboriú",
      "Blumenau",
      "Brusque",
      "Chapecó",
      "Criciúma",
      "Florianópolis",
      "Itajaí",
      "Joinville",
      "Lages",
      "Palhoça",
      "São José"
    ].sort()
  },
  {
    code: "SP",
    name: "São Paulo",
    cities: [
      "Americana",
      "Araçatuba",
      "Araraquara",
      "Barueri",
      "Bauru",
      "Campinas",
      "Carapicuíba",
      "Cotia",
      "Diadema",
      "Embu das Artes",
      "Ferraz de Vasconcelos",
      "Franca",
      "Francisco Morato",
      "Franco da Rocha",
      "Guaratinguetá",
      "Guarujá",
      "Guarulhos",
      "Hortolândia",
      "Indaiatuba",
      "Itapecerica da Serra",
      "Itapetininga",
      "Itapevi",
      "Itaquaquecetuba",
      "Jandira",
      "Jaú",
      "Jundiaí",
      "Limeira",
      "Mauá",
      "Mogi das Cruzes",
      "Osasco",
      "Piracicaba",
      "Praia Grande",
      "Presidente Prudente",
      "Ribeirão Pires",
      "Ribeirão Preto",
      "Rio Claro",
      "Salto",
      "Santa Bárbara d'Oeste",
      "Santana de Parnaíba",
      "Santo André",
      "Santos",
      "São Bernardo do Campo",
      "São Caetano do Sul",
      "São Carlos",
      "São José do Rio Preto",
      "São José dos Campos",
      "São Paulo",
      "São Vicente",
      "Sorocaba",
      "Sumaré",
      "Suzano",
      "Taboão da Serra",
      "Taubaté",
      "Valinhos",
      "Várzea Paulista"
    ].sort()
  },
  {
    code: "SE",
    name: "Sergipe",
    cities: [
      "Aracaju",
      "Estância",
      "Itabaiana",
      "Lagarto",
      "Nossa Senhora do Socorro"
    ].sort()
  },
  {
    code: "TO",
    name: "Tocantins",
    cities: [
      "Araguaína",
      "Gurupi",
      "Palmas",
      "Porto Nacional"
    ].sort()
  }
];

// Helper function to get cities by state code
export const getCitiesByState = (stateCode: string): string[] => {
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