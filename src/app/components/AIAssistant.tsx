/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ChevronDown, ChevronUp, RefreshCw, 
  Atom, HeartPulse, GraduationCap, Clock, Cpu, Coins, Lightbulb,
  CheckCircle2, Compass, HelpCircle, X
} from 'lucide-react';
import { ThemeInsight, ThemeKey } from '../../types';

interface AIAssistantProps {
  title: string;
  content: string;
}

// Complete pre-written dictionary of themes and insights
const INSIGHTS_DB: Record<ThemeKey, Omit<ThemeInsight, 'themeKey'>> = {
  ciencia: {
    title: 'Análise Científica',
    colorClass: {
      bg: 'bg-cyan-50/60',
      border: 'border-cyan-100',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800',
      accent: 'text-cyan-600'
    },
    analysis: 'A nota aborda aspectos científicos de exploração, pesquisa ou modelagem teórica. O pensamento científico instrumentaliza a curiosidade humana, explicando fenômenos por debaixo de dados observáveis e teorias robustas.',
    suggestions: [
      'Distinga claramente entre hipóteses iniciais e fatos comprovados por metodologias empíricas.',
      'Defina operacionalmente as variáveis quantitativas ou qualitativas que estão sob sua observação direta.',
      'Documente potenciais vieses de confirmação ou correlações enganosas que possam deturpar sua análise.',
      'Sublinhe referências a artigos revisados por pares (peer-reviewed) para elevar a credibilidade técnica.'
    ],
    opportunities: [
      'Estruturar experimentos controlados isolando variáveis de maneira matematicamente formal.',
      'Aprofundar-se em metodologias de estatística inferencial para obter inferências de alta amostragem.',
      'Estudar o processo de falseabilidade de Karl Popper na delimitação do conhecimento empírico.'
    ],
    questions: [
      'Que novas evidências específicas seriam necessárias para refutar categoricamente sua tese atual?',
      'Como este experimento ou teoria seria desenhado se um observador externo independente tentasse reproduzi-lo?',
      'As correlações identificadas na nota sugerem causalidade direta ou são subprodutos de uma variável oculta?'
    ]
  },
  saude: {
    title: 'Perspectivas de Saúde & Bem-estar',
    colorClass: {
      bg: 'bg-[#c8ff00]/10',
      border: 'border-[#c8ff00]/30',
      text: 'text-neutral-100',
      badge: 'bg-[#c8ff00]/20 text-[#c8ff00]',
      accent: 'text-[#c8ff00]'
    },
    analysis: 'Esta nota centra-se na preservação do bem-estar biológico, regulação do corpo e hábitos saudáveis. A saúde sustentável é integrada, demandando sintonia entre repouso, combustível celular (nutrição) e atividade muscular periódica.',
    suggestions: [
      'Substitua descrições ambíguas (ex: "fazer exercícios") por metas baseadas em frequência cardíaca e carga controlada.',
      'Correlacione sistematicamente seus registros de energia diária com a duração e consistência do seu sono.',
      'Desenhe rotinas ergonômicas de micro-pausas ativas ou alongamentos a cada 50 minutos de esforço intelectual continuado.',
      'Busque embasamento junto a especialistas credenciados (médicos, nutricionistas) para estruturar rotinas individualizadas.'
    ],
    opportunities: [
      'Compreender os ritmos circadianos e a incidência de luz sobre a produção de melatonina e cortisol.',
      'Estudar os macronutrientes sob a ótica da bioenergética muscular para maximizar eficiência biológica.',
      'Aprender técnicas respiratórias reguladoras (ex: caixa ou foles) para o manejo agudo do sistema nervoso simpático.'
    ],
    questions: [
      'O cansaço que você deseja corrigir é decorrente de falta de descanso físico genuíno ou de privação de estímulos criativos?',
      'Seu plano de ação considera os impactos hormonais decorrentes de oscilações prolongadas de estresse?',
      'Você está atacando os efeitos de curto-prazo da rotina ou implementando mudanças preventivas de infraestrutura biológica?'
    ]
  },
  aprendizado: {
    title: 'Estratégias de Aprendizado Ativo',
    colorClass: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800',
      accent: 'text-amber-600'
    },
    analysis: 'A nota retrata a aquisição, retenção e síntese de novas informações. Investigações pedagógicas constatam que a digestão ativa e a reformulação conceitual geram conexões neuronais de longo prazo infinitamente superiores à leitura passiva.',
    suggestions: [
      'Aplique a Técnica Feynman: resuma a essência deste conteúdo de forma tão inteligível que até uma criança o entenderia.',
      'Substitua a releitura linear por sessões ativas de autoexplicação baseadas exclusivamente nas suas anotações corporificadas.',
      'Conecte estas novas informações de forma deliberada com analogias de conceitos que você já domina há anos.',
      'Crie cartões de memória (flashcards) com perguntas norteadoras para implementar a prática da repetição espaçada.'
    ],
    opportunities: [
      'Utilizar abordagens de "Prática Deliberada" segmentando as sub-competências técnicas para focar na zona de desconforto de aprendizagem.',
      'Compreender os mecanismos de consolidação da memória de longa duração por meio da neuroplasticidade sináptica.',
      'Metodizar a criação de um "Segunda Cérebro" estruturando notas interligadas por associação conceitual semântica.'
    ],
    questions: [
      'De que forma prática e palpável você conseguirá desdobrar e utilizar este novo conceito dentro das próximas 24 horas?',
      'Esta anotação apenas aglomera dados e resumos ou desafia de forma assertiva sua perspectiva anterior sobre a matéria?',
      'Como você explicaria as conexões latentes entre esta nota e os aprendizados de outras disciplinas correlatas?'
    ]
  },
  produtividade: {
    title: 'Engenharia de Produtividade & Foco',
    colorClass: {
      bg: 'bg-[#c8ff00]/10',
      border: 'border-[#c8ff00]/30',
      text: 'text-neutral-100',
      badge: 'bg-[#c8ff00]/20 text-[#c8ff00]',
      accent: 'text-[#c8ff00]'
    },
    analysis: 'O teor da nota foca na arquitetura do foco, priorização e execução de projetos. Uma produtividade profissional sofisticada prioriza a eliminação sistemática do ruído e a canalização de energia naquilo que é alavanca vital.',
    suggestions: [
      'Mapeie e classifique as metas sugeridas na nota sob o prisma da Matriz de Eisenhower (urgência contra importância real).',
      'Defina blocos temporais exclusivos e intransponíveis de "Trabalho Profundo" (Deep Work) imune a redes ou mensagens instantâneas.',
      'Limite sua lista de entregas diárias a no máximo 1 a 3 tarefas verdadeiramente críticas que de fato desbloqueiem progresso.',
      'Implemente análises de retrospectiva semanal cronometrada avaliando desalinhamentos operacionais do planejamento.'
    ],
    opportunities: [
      'Estruturar fluxos operacionais completos sob as diretrizes do sistema "Getting Things Done" (GTD) para desonerar a mente de lembretes ativos.',
      'Aplicar a Lei de Parkinson reduzindo voluntariamente os prazos fictícios das reuniões para forçar resolutividade concentrada.',
      'Mapear a flutuação dos seus níveis biológicos de energia ao longo do dia comercial para agendar tarefas complexas em alta performance.'
    ],
    questions: [
      'Qual dessas tarefas na sua anotação exigirá o maior esforço psicológico de iniciação e qual será seu gatilho de arranque?',
      'Se você pudesse realizar somente uma atividade deste planejamento hoje, qual resolveria a maior parcela das pendências gerais?',
      'Você está medindo produtividade por mera movimentação ocupada (lazer produtivo) ou por geração mensurável de valor real?'
    ]
  },
  tecnologia: {
    title: 'Desenvolvimento Tecnológico & Engenharia',
    colorClass: {
      bg: 'bg-[#c8ff00]/10',
      border: 'border-[#c8ff00]/30',
      text: 'text-neutral-100',
      badge: 'bg-[#c8ff00]/20 text-[#c8ff00]',
      accent: 'text-[#c8ff00]'
    },
    analysis: 'A nota trata sobre ferramentas técnicas, linguagens de codificação e arquitetura lógica. O desenvolvimento bem fundamentado requer clareza na manipulação de dados, desenho de algoritmos eficientes e boas práticas de manutenção computacional.',
    suggestions: [
      'Rabisque em pseudocódigo ou fluxogramas a coesão estrutural do seu algoritmo lógico antes de inaugurar o editor de códigos corporativo.',
      'Adote rigorosamente os preceitos de Clean Code: funções curtas com propósito único, sem efeitos colaterais ocultos, e nomenclatura explícita.',
      'Proteja seu ecossistema desenvolvendo testes de software automatizados para as lógicas de negócio críticas descritas nesta anotação.',
      'Crie documentações compactas detalhando as estruturas de entrada, saída, e esquemas de dados da sua infraestrutura.'
    ],
    opportunities: [
      'Dominar princípios SOLID de orientação a objetos e padrões de projeto consolidados pela engenharia de software contemporânea.',
      'Aprofundar nos conceitos de otimização de consultas e estruturas de dados de baixa complexidade assintótica (Notação Big O).',
      'Implementar rotinas eficientes de Integração Contínua e Distribuição Contínua (CI/CD) para ganho de previsibilidade sistêmica.'
    ],
    questions: [
      'Como sua arquitetura de dados descrita na nota se comportaria se recebesse repentinamente um tráfego volumoso 100 vezes maior?',
      'Qual é a solução mais minimalista que preserva a robustez sem introduzir bibliotecas desnecessárias ou sobredosagem arquitetônica?',
      'A stack de tecnologia listada na anotação é fundamentada em necessidade técnica real ou em preferências pessoais superficiais?'
    ]
  },
  financas: {
    title: 'Gestão Financeira & Alocação Inteligente',
    colorClass: {
      bg: 'bg-yellow-50/50',
      border: 'border-yellow-250',
      text: 'text-yellow-950',
      badge: 'bg-yellow-100/90 text-yellow-905',
      accent: 'text-yellow-700'
    },
    analysis: 'Reflexões associadas a orçamentos, rendimentos, contenções e portfólios de investimentos. A saúde financeira assenta-se na previsibilidade do fluxo de caixa e no descompasso positivo estrutural entre arrecadações e desembolsos.',
    suggestions: [
      'Formate e agrupe seus custos de despesas em categorias de sobrevivência e lazer para neutralizar micro-vazamentos financeiros.',
      'Estruture como fundação irrevogável o aporte em uma Reserva de Emergência intocável equivalente a 6 meses de suas despesas correntes.',
      'Opte pela automação de investimentos logo no recebimento da renda mensal: pague-se primeiro antes de gerenciar boletos secundários.',
      'Mantenha vigilância ativa sobre o parcelamento de passivos de rápida depreciação para afastar a incidência nociva de juros compostos em dívida.'
    ],
    opportunities: [
      'Compreender de maneira sólida as variáveis macroeconômicas de regulação financeira: Taxa Selic, Meta de Inflação e Curva de Juros Futuros.',
      'Descortinar a alocação diversificada do seu patrimônio balanceando ativos de Renda Fixa pós-fixada com parcelas de Renda Variável.',
      'Estudar psicologia econômica e dinâmicas de heurística cognitiva que provocam disparos impulsivos nas decisões de consumo.'
    ],
    questions: [
      'O investimento desenhado na nota está adequado ao seu horizonte temporal estratégico de resgate ou visa lucros de curtíssimo prazo amador?',
      'As escolhas de gastos descritas estão autenticamente alinhadas com sua visão existencial de futuro ou apenas compram aprovação social imediata?',
      'Qual seria a resiliência do seu patrimônio líquido consolidado em caso de recessão de mercado intensa nos próximos 24 meses?'
    ]
  },
  geral: {
    title: 'Pensamento Estruturado & Cognição',
    colorClass: {
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      text: 'text-neutral-900',
      badge: 'bg-neutral-100 text-neutral-800',
      accent: 'text-neutral-600'
    },
    analysis: 'Seu rascunho de nota foi mapeado sob o filtro estrutural geral. Para dar clareza a qualquer pensamento bruto, é crucial estabelecer estruturas de ancoragem analítica livre de divagações prolixas.',
    suggestions: [
      'Incorpore cabeçalhos visuais claros ou marcadores de tópicos para hierarquizar os parágrafos densos em blocos digestíveis.',
      'Extraia uma frase-síntese de no máximo 15 palavras no início absoluto da nota para guiar o leitor ou seu próprio "Eu" do futuro.',
      'Determine e anote uma única "Ação Próxima" concreta que represente o passo seguinte inevitável para esta ideia progredir.',
      'Revise o texto excluindo adjetivos subjetivos ou orações acessórias para aumentar a objetividade informativa geral.'
    ],
    opportunities: [
      'Mapear e construir resumos através de diagramas mentais ou notas vinculadas em grafos conceituais.',
      'Aprimorar táticas de redação técnica concisa e condensação textual orientada para memorização acelerada.',
      'Estudar matrizes de resolução de problemas complexos, como o método de pensamento por primeiros princípios de Elon Musk.'
    ],
    questions: [
      'Qual é o verdadeiro núcleo central de valor desta anotação e quão diluído ele está entre explicações colaterais?',
      'Se você reler esta exata nota daqui a seis meses, ela conterá pistas contextuais suficientes para resgatar sua clareza de hoje?',
      'Que parte desta nota representa pura conceituação teórica e qual parte é passível de desdobramento operacional em tarefas reais?'
    ]
  }
};

// Normalized word stems / keywords to match themes
const THEME_KEYWORDS: Array<{ theme: ThemeKey; keywords: string[] }> = [
  {
    theme: 'ciencia',
    keywords: ['ciencia', 'pesquisa', 'estudo', 'experimento', 'teoria', 'tecnico', 'metodo', 'hipotese', 'diferenca']
  },
  {
    theme: 'saude',
    keywords: ['saude', 'exercicio', 'alimentacao', 'sono', 'corpo', 'biologico', 'bem-estar', 'stress', 'estresse', 'dormir', 'comer', 'fisico']
  },
  {
    theme: 'aprendizado',
    keywords: ['aprender', 'estudar', 'curso', 'livro', 'conhecimento', 'aprendizado', 'feynman', 'memorizacao', 'fixacao', 'disciplina']
  },
  {
    theme: 'produtividade',
    keywords: ['produtividade', 'trabalho', 'tarefa', 'meta', 'planejamento', 'foco', 'pomodoro', 'tempo', 'priorizacao', 'prioridade', 'agenda', 'cronograma']
  },
  {
    theme: 'tecnologia',
    keywords: ['tecnologia', 'programacao', 'codigo', 'software', 'computador', 'algoritmo', 'clean code', 'solid', 'programa', 'backend', 'frontend', 'desenvolvimento', 'tecnologico']
  },
  {
    theme: 'financas',
    keywords: ['dinheiro', 'investimento', 'economia', 'orcamento', 'financas', 'selic', 'juros', 'custos', 'riqueza', 'patrimonio', 'gasto', 'financeiro']
  }
];

const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD') // splits combined characters with diacritics into base + diacritic
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' '); // replace punctuation with spaces
};

export default function AIAssistant({ title, content }: AIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [detectedThemes, setDetectedThemes] = useState<ThemeKey[]>([]);
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset or adjust states when fields become completely empty (i.e. form reset)
  useEffect(() => {
    if (!title.trim() && !content.trim()) {
      setHasGenerated(false);
      setDetectedThemes([]);
      setExpandedThemes({});
      setIsAnalyzing(false);
      setIsModalOpen(false);
    }
  }, [title, content]);

  // Determine which keywords are currently in the title and content
  const performDetection = (): ThemeKey[] => {
    const textToAnalyze = `${normalizarTexto(title)} ${normalizarTexto(content)}`;
    const matched: ThemeKey[] = [];

    THEME_KEYWORDS.forEach(({ theme, keywords }) => {
      const matchFound = keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'i');
        return regex.test(textToAnalyze);
      });
      if (matchFound) {
        matched.push(theme);
      }
    });

    return matched.length > 0 ? matched : ['geral'];
  };

  const handleGenerateInsights = () => {
    setIsModalOpen(true);
    setIsAnalyzing(true);
    
    // Simulate professional processing delay (1.5s)
    setTimeout(() => {
      const matched = performDetection();
      setDetectedThemes(matched);
      
      // Expand the first matched theme by default
      const initialExpanded: Record<string, boolean> = {};
      matched.forEach((theme, index) => {
        initialExpanded[theme] = index === 0;
      });
      
      setExpandedThemes(initialExpanded);
      setHasGenerated(true);
      setIsAnalyzing(false);
    }, 1500);
  };

  const toggleThemeExpand = (theme: string) => {
    setExpandedThemes(prev => ({
      ...prev,
      [theme]: !prev[theme]
    }));
  };

  // If there's no text typed in the entire form, do not render the assistant button
  const hasTypedText = title.trim().length > 0 || content.trim().length > 0;
  if (!hasTypedText) return null;

  return (
    <>
      {/* Modern Compact Text Button (No icon, no green, no borders) */}
      <button
        type="button"
        onClick={handleGenerateInsights}
        disabled={!hasTypedText}
        className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        id="btn-generate-ai-insights"
        title="Analisar conceitos e insights desta nota com IA"
      >
        Analisar com IA
      </button>

      {/* Screen Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Card content wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative z-50 text-neutral-900 dark:text-neutral-100"
              id="ai-insights-modal"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 leading-none mb-0.5">
                      Insights com IA
                    </h3>
                    <p className="font-sans text-[10px] text-neutral-400 dark:text-neutral-500">
                      Análise contextual e recomendações práticas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable insights area inside the overlay */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white dark:bg-neutral-900 space-y-4">
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 flex flex-col items-center justify-center text-center gap-4"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-200 animate-spin"></div>
                      </div>
                      <div className="space-y-1.5 max-w-sm">
                        <p className="font-sans font-semibold text-xs text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                          Mapeando conceitos de foco...
                        </p>
                        <p className="font-sans text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                          Identificando temas-chave para gerar proposições e reflexões críticas.
                        </p>
                      </div>
                    </motion.div>
                  ) : hasGenerated && detectedThemes.length > 0 ? (
                    <motion.div
                      key="insights-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3.5">
                        {detectedThemes.map((themeKey) => {
                          const insight = INSIGHTS_DB[themeKey];
                          const isExpanded = !!expandedThemes[themeKey];
                          
                          const renderIcon = () => {
                            switch (themeKey) {
                              case 'ciencia': return <Atom className="w-4 h-4 text-cyan-600" />;
                              case 'saude': return <HeartPulse className="w-4 h-4 text-[#c8ff00]" />;
                              case 'aprendizado': return <GraduationCap className="w-4 h-4 text-amber-600" />;
                              case 'produtividade': return <Clock className="w-4 h-4 text-[#c8ff00]" />;
                              case 'tecnologia': return <Cpu className="w-4 h-4 text-[#c8ff00]" />;
                              case 'financas': return <Coins className="w-4 h-4 text-yellow-500" />;
                              default: return <Lightbulb className="w-4 h-4 text-neutral-400" />;
                            }
                          };

                          return (
                            <div
                              key={themeKey}
                              className={`border ${insight.colorClass.border} rounded-xl overflow-hidden transition-all duration-200`}
                              id={`insight-card-${themeKey}`}
                            >
                              {/* Header trigger */}
                              <button
                                type="button"
                                onClick={() => toggleThemeExpand(themeKey)}
                                className={`w-full flex items-center justify-between p-3.5 cursor-pointer select-none text-left ${insight.colorClass.bg} transition-colors`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 bg-white rounded-lg shadow-xs border border-black/5">
                                    {renderIcon()}
                                  </div>
                                  <div>
                                    <span className={`${insight.colorClass.text} font-sans font-bold text-sm`}>
                                      {insight.title}
                                    </span>
                                    {!isExpanded && (
                                      <span className="ml-2 font-mono text-[9px] uppercase font-semibold text-neutral-400">
                                        (Clique para expandir)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="p-1 text-neutral-500 rounded-md hover:bg-black/5 transition-colors">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </button>

                              {/* Explanations content toggle */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="border-t border-black/5"
                                  >
                                    <div className="p-4 space-y-4 bg-white text-xs text-neutral-700 leading-relaxed font-sans">
                                      {/* Analysis */}
                                      <div className="space-y-1">
                                        <h5 className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 opacity-75">
                                          Contexto do Tema
                                        </h5>
                                        <p className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-600 italic">
                                          "{insight.analysis}"
                                        </p>
                                      </div>

                                      {/* Suggestions */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <h5 className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 opacity-75">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#c8ff00]" />
                                            Sugestões de Melhorias
                                          </h5>
                                          <ul className="space-y-2 pl-0">
                                            {insight.suggestions.map((item, idx) => (
                                              <li key={idx} className="border-l-3 border-[#c8ff00] pl-2.5 py-0.5 text-neutral-600 text-[11px] bg-[#c8ff00]/10 rounded-r">
                                                <span>{item}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Learning opportunities */}
                                        <div className="space-y-2">
                                          <h5 className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[10px] flex items-center gap-1.5 opacity-75">
                                            <Compass className="w-3.5 h-3.5 text-[#c8ff00]" />
                                            Oportunidades de Aprendizado
                                          </h5>
                                          <ul className="space-y-2 pl-0">
                                            {insight.opportunities.map((item, idx) => (
                                              <li key={idx} className="border-l-3 border-[#c8ff00] pl-2.5 py-0.5 text-neutral-600 dark:text-neutral-300 text-[11px] bg-[#c8ff00]/10 rounded-r">
                                                <span>{item}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Critical Questions */}
                                      <div className="space-y-2">
                                        <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5 opacity-75">
                                          <HelpCircle className="w-3.5 h-3.5 text-[#c8ff00]" />
                                          Perguntas para Reflexão Crítica
                                        </h5>
                                        <ul className="space-y-2 list-none pl-0">
                                          {insight.questions.map((item, idx) => (
                                            <li key={idx} className="border-l-3 border-[#c8ff00] pl-2.5 py-0.5 text-[11px] text-neutral-800 dark:text-neutral-200 bg-[#c8ff00]/10 rounded-r">
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Sticky footer controls */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans tracking-wide hidden sm:inline">
                  Processamento estruturado por Centralize AI
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleGenerateInsights}
                    className="cursor-pointer select-none text-xs text-[#c8ff00] hover:text-[#b8e600] flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xs"
                    id="btn-reanalyze-ai"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reanalisar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer select-none text-xs text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white px-3 py-1 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
