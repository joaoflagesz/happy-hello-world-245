/**
 * ✏️ EDITE TUDO POR AQUI
 * Todo o conteúdo do site (textos, datas, fotos e música) vive neste arquivo.
 */

export const site = {
  nomeDela: "Meu Amor",
  heroTitulo: "Para a garota que mudou completamente minha vida",
  heroSubtitulo:
    "Um pequeno lugar no mundo feito só para guardar o que sinto por você.",
  heroBotao: "Começar nossa história",
};

/** Data e hora em que tudo começou (formato ISO). */
export const inicioDoNamoro = "2023-05-14T20:30:00";

/** 🎵 Coloque o arquivo em /public/music/nossa-musica.mp3 (ou use uma URL). */
export const musica = {
  src: "/music/nossa-musica.mp3",
  titulo: "Nossa música",
  artista: "Só nossa",
};

export type TimelineItem = {
  titulo: string;
  data: string;
  texto: string;
};

export const timeline: TimelineItem[] = [
  {
    titulo: "Primeira conversa",
    data: "O começo de tudo",
    texto:
      "Uma mensagem simples que virou madrugada. Eu ainda não sabia, mas ali minha vida já tinha mudado de direção.",
  },
  {
    titulo: "Primeiro encontro",
    data: "O dia que eu não esqueço",
    texto:
      "Meu coração batia rápido demais. Você chegou e o mundo inteiro ficou mais silencioso.",
  },
  {
    titulo: "Primeira foto juntos",
    data: "Nosso primeiro registro",
    texto:
      "A primeira de muitas. Guardo essa como quem guarda um tesouro pequeno e infinito.",
  },
  {
    titulo: 'Primeiro "Eu te amo"',
    data: "Sem pressa, sem medo",
    texto:
      "As palavras saíram sozinhas, porque já eram verdade há muito tempo.",
  },
  {
    titulo: "Momentos inesquecíveis",
    data: "Todos os dias comuns",
    texto:
      "Risadas sem motivo, viagens, brigas bobas e reconciliações. Tudo isso é nós.",
  },
  {
    titulo: "Hoje",
    data: "E todos os dias que vêm",
    texto:
      "Continuo escolhendo você. Hoje, amanhã e em todas as versões possíveis dessa vida.",
  },
];

export type FotoItem = {
  /** Coloque a imagem em /public/fotos/ e use "/fotos/nome.jpg" */
  src?: string;
  legenda: string;
};

export const galeria: FotoItem[] = [
  { legenda: "Nosso primeiro dia" },
  { legenda: "Aquele pôr do sol" },
  { legenda: "Rindo de nada" },
  { legenda: "Nossa viagem" },
  { legenda: "Café da manhã" },
  { legenda: "Você dormindo" },
  { legenda: "A noite mais bonita" },
  { legenda: "Só nós dois" },
];

export const carta = {
  titulo: "Uma carta para você",
  saudacao: "Meu amor,",
  texto: `Escreva aqui a sua carta. Este espaço é seu — fale do dia em que se conheceram, das coisas pequenas que só vocês entendem, do que você sente quando ela sorri.

Cada palavra vai aparecer devagar, como se você estivesse escrevendo agora, só para ela.`,
  assinatura: "Com todo o meu amor,",
};

export type Momento = {
  titulo: string;
  descricao: string;
  data: string;
  src?: string;
};

export const momentos: Momento[] = [
  {
    titulo: "Nossa primeira viagem",
    descricao: "Estrada, playlist alta e a certeza de que qualquer lugar com você é casa.",
    data: "Verão",
  },
  {
    titulo: "A madrugada infinita",
    descricao: "Falamos até o sol nascer e nenhum dos dois quis dormir.",
    data: "Uma noite qualquer",
  },
  {
    titulo: "O abraço que curou o dia",
    descricao: "Você não disse nada. Não precisava. Só ficou.",
    data: "Sempre que preciso",
  },
];

export const frases = [
  "Se eu tivesse que escolher de novo, escolheria você em todas as vidas.",
  "Você é o meu lugar preferido no mundo.",
  "Amar você é a coisa mais simples e mais bonita que eu faço.",
];

export const final = {
  titulo: "Obrigado por fazer parte da minha vida.",
  subtitulo: "Eu te amo infinitamente ❤️",
};
