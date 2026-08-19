# NotaMind — Bloco de Notas Minimalista com Assistente de IA Local

NotaMind é uma aplicação web crossplataforma minimalista focada na organização inteligente de anotações pessoais. Desenvolvida com **React**, **TypeScript** e **Tailwind CSS v4**, a ferramenta integra uma interface livre de ruídos, persistência garantida em nível de navegador e um **Assistente de Insights Inteligente baseado em regras**.

---

## 🚀 Funcionalidades Principais

### 1. Sistema de Notas Fluido
*   **Controle Total**: Criação, edição interativa e exclusão de anotações com feedbacks visuais dinâmicos.
*   **Persistência Instantânea**: Salvamento automático e ressincronização transparente por meio de logs estruturados em `localStorage`.
*   **Fila Organizada**: Listagem com ordenação cronológica decrescente automática (notas mais recentes sempre no topo).
*   **Navegação Rápida**: Card exclusivo "Nova Nota" desenhado com bordas tracejadas para transição de foco guiada ao formulário.
*   **Identificadores Visuais**: Análise rápida de palavras-chave no rascunho emite tags temáticas automáticas nos previews para melhor identificação visual.

### 2. Design Minimalista & UX Refinada
*   **Cores e Contraste**: Plano de fundo minimalista em cinza ultra-claro (`bg-neutral-50`) combinado com cards brancos de sombras suaves e toques de gradiente violeta/roxo na ambientação da IA.
*   **Disposição Responsiva**: Grid auto-adaptável inteligente que se formata em 2 colunas confortáveis no desktop (Formulário/Assistente à esquerda, acervo de notas à direita).
*   **Tratamento Hover**: Botão de exclusão (lixeira) ocultado por padrão e revelado dinamicamente no hover de cada card, protegendo os elementos contra cliques acidentais através de contenção de propagação de eventos.
*   **Localização Completa**: Datas de criação formatadas nativamente de acordo com os padrões brasileiros (`pt-BR`).
*   **Micro-Animações**: Transições fluidas com `motion` ao expandir e alternar insights e seções da ferramenta.

### 3. Assistente de IA Local (Baseado em Regras)
O assistente é ativado instantaneamente dentro do container do formulário sempre que houver caracteres digitados nos campos de edição de rascunhos.
Clicando em **"Obter Insights da IA"**, um delay simulado de `1.5` segundos com barra de progresso em gradiente imita o carregamento de processamento de redes neurais antes de apresentar seções coloridas e expansíveis contendo:
*   Análise contextualizada da área de foco detectada.
*   3 a 4 sugestões acionáveis de melhoria baseadas em evidências cognitivas ou práticas recomendadas.
*   3 oportunidades personalizadas de aprendizado técnico para ampliação conceitual.
*   Perguntas desafiadoras para exercitar seu pensamento crítico.

---

## 🔍 Temas Detectados & Palavras-Chave

O motor inteligente faz varreduras normalizadas e insensíveis a acentos ou maiúsculas. Os 6 temas principais suportados são:

| Tema | Palavras-Chave de Gatilho | Foco de Estudo |
| :--- | :--- | :--- |
| **Ciência** | `ciência`, `pesquisa`, `estudo`, `experimento`, `teoria`, `técnico`, `método` | Refinar hipóteses, variáveis empíricas e falseabilidade popperiana. |
| **Saúde** | `saúde`, `exercício`, `saude`, `exercicio`, `alimentação`, `sono`, `corpo` | Ritmos circadianos, bioenergética celular e hábitos preventivos. |
| **Aprendizado** | `aprender`, `estudar`, `curso`, `livro`, `conhecimento`, `aprendizado` | Método Feynman, repetição espaçada e arquiteturas de segundo cérebro. |
| **Produtividade** | `produtividade`, `trabalho`, `tarefa`, `meta`, `planejamento`, `foco` | Matriz de Eisenhower, deep work conceitual e metodologia GTD. |
| **Tecnologia** | `tecnologia`, `programação`, `código`, `software`, `algoritmo` | Diretrizes de Clean Code, arquitetura SOLID e robustez de testes unitários. |
| **Finanças** | `dinheiro`, `investimento`, `economia`, `orçamento`, `finanças` | Planejamento de portfólios, fluxo de caixa e psicologia do consumo. |

*Nota: Se nenhum termo for correspondido no rascunho de texto digitado, o assistente ativa um tema de refatoração para **Pensamento Estruturado**, fornecendo orientações lógicas universais de organização conceitual.*

---

## 🛠️ Stack Técnica Empregada

*   **Front-End**: React 19 + TypeScript (tipagem forte e consistente em `/src/types.ts`)
*   **Bundler**: Vite
*   **Estilização**: Tailwind CSS v4 (com as mais novas diretivas `@theme` nativas)
*   **Animação**: Motion (`motion/react`)
*   **Iconografia**: Lucide React para pictogramas leves e acessíveis
