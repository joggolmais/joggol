# Documento de Planejamento de Interface

**Produto:** JogGol — Plataforma Esportiva Digital SaaS
**Versão do documento:** 1.0
**Base:** PRD Executivo para Educadores v2.0
**Público-alvo deste documento:** Designers de UI/UX, Desenvolvedores Frontend, Product Owners
**Direção visual:** Liquid Glass (com restrições de legibilidade e performance)
**Abordagem:** Mobile-first, PWA, Offline-first, WCAG 2.2 AA

---

## 1. Visão Geral da Arquitetura de UI

### 1.1 Camadas de Navegação
- **Camada Pública (sem autenticação):** Landing, Login, Cadastro, Entrada por Convite.
- **Camada do Jogador:** Home, Minhas Peladas, Detalhes da Pelada, Perfil, Estatísticas, Rankings.
- **Camada do Organizador:** Painel de Gestão, Criação de Pelada, Pelada Ativa, Súmula, Financeiro.
- **Camada de Arena:** Grade de Horários, Quadras, Reservas, Bloqueios.
- **Camada Administrativa (SaaS):** Organizações, Membros, Permissões, Planos, Auditoria.
- **Camada de Plataforma (Super-Admin):** Painel Global, Tenants, Observabilidade.

### 1.2 Componentes Transversais (Design System)
- **Tokens:** cores, tipografia, espaçamento, raios, elevação, blur (Liquid Glass).
- **Componentes base:** Button, Input, Select, Checkbox, Radio, Switch, Modal, Drawer, Toast, Tooltip, Tabs, Accordion, Card, Badge, Avatar, Chip, Skeleton, EmptyState, ErrorState.
- **Componentes de domínio:** PlayerCard, TeamCard, GameCard, ScoreBoard, Timer, EventFeed, RotationQueue, PaymentStatusBadge, SyncStatusIndicator.
- **Indicadores de estado offline:** `salvo local`, `sincronizando`, `sincronizado`, `erro de sincronização`.
- **Acessibilidade:** foco visível, ARIA labels, navegação por teclado, contraste AA, suporte a `prefers-reduced-motion`.

---

## 2. Telas Públicas

### 2.1 Landing Page
**Objetivo:** Apresentar o JogGol e direcionar para cadastro/login.
- **Componentes:**
  - Header com logo JogGol e botões "Entrar" / "Criar conta".
  - Hero com frase-guia: *"Complexidade no sistema. Simplicidade para o usuário."*
  - Seção de benefícios (3–4 cards: organizar, confirmar, formar times, cobrar).
  - Seção de personas (Organizador, Jogador, Arena).
  - CTA principal: "Criar minha primeira pelada".
  - Footer com links legais (LGPD, Termos, Privacidade).
- **Interações:** scroll suave, animações discretas (respeitando `reduced motion`).
- **Dados:** conteúdo estático; sem chamadas autenticadas.

### 2.2 Login
**Objetivo:** Autenticar usuário existente.
- **Componentes:**
  - Formulário (e-mail + senha).
  - Botão "Entrar".
  - Link "Esqueci minha senha".
  - Botão "Entrar com Google" (se habilitado).
  - Link "Criar conta".
- **Interações:** validação inline, feedback de erro humano, loading state.
- **Dados:** `User/Profile` via Supabase Auth.

### 2.3 Cadastro
**Objetivo:** Criar nova conta.
- **Componentes:**
  - Formulário (nome, e-mail, senha, confirmação).
  - Checkbox de aceite de termos e LGPD.
  - Botão "Criar conta".
- **Interações:** validação de força de senha, feedback de e-mail já cadastrado.
- **Dados:** criação em `User/Profile`.

### 2.4 Entrada por Convite (Convidado)
**Objetivo:** Permitir entrada sem cadastro tradicional via token seguro.
- **Componentes:**
  - Card de contexto da pelada (nome, data, local, valor).
  - Formulário mínimo (nome, telefone/WhatsApp, posição preferida).
  - Botão "Confirmar presença".
  - Botão "Entrar na lista de espera" (quando lotado).
  - Indicador de status: `CONFIRMADO` / `LISTA_ESPERA` / `PENDENTE`.
- **Interações:** validação de token (expiração, revogação), feedback de sucesso.
- **Dados:** `Invitation`, `GameParticipant`, `Game`.

### 2.5 Recuperação de Senha
- **Componentes:** formulário de e-mail, botão "Enviar link", confirmação.
- **Dados:** Supabase Auth.

---

## 3. Telas do Jogador

### 3.1 Home do Jogador
**Objetivo:** Visão rápida das próximas peladas e status.
- **Componentes:**
  - Header com avatar, nome e sino de notificações.
  - Card "Próxima pelada" (data, local, status, valor).
  - Lista de peladas ativas/confirmadas.
  - Atalho para "Meu perfil" e "Rankings".
  - Indicador de sincronização offline.
- **Interações:** pull-to-refresh, navegação por toque.
- **Dados:** `Game`, `GameParticipant`, `Notification`.

### 3.2 Minhas Peladas
- **Componentes:**
  - Tabs: "Próximas", "Histórico", "Convites".
  - Lista de `GameCard` com status e ação primária.
  - EmptyState com CTA "Entrar por convite".
- **Dados:** `Game`, `GameParticipant`, `Invitation`.

### 3.3 Detalhes da Pelada (Visão Jogador)
- **Componentes:**
  - Cabeçalho: nome, data, horário, local (link para mapa).
  - Status do jogador: `CONFIRMADO`, `LISTA_ESPERA`, `EM_CAMPO`, `BANCO`.
  - Valor e status de pagamento (`PaymentStatusBadge`).
  - Lista de confirmados (avatares).
  - Botão "Confirmar" / "Desistir" / "Entrar na espera".
  - Seção de regras da pelada.
- **Interações:** confirmação em poucos toques, feedback imediato.
- **Dados:** `Game`, `GameParticipant`, `Payment`, `Team`.

### 3.4 Meu Perfil
- **Componentes:**
  - Avatar, nome, apelido, posição preferida.
  - Card de atleta (`PlayerCard` com Overall, ELO, tier).
  - Estatísticas: gols, assistências, partidas, cartões.
  - Conquistas, XP, nível, medalhas.
  - Botão "Editar perfil".
- **Dados:** `Player`, `GameEvent`, `Standing`.

### 3.5 Estatísticas e Histórico
- **Componentes:**
  - Gráficos de evolução (gols por mês, ELO).
  - Lista de partidas com resultado.
  - Filtros por período, pelada, organização.
- **Dados:** `GameEvent`, `Game`, `Standing`.

### 3.6 Rankings
- **Componentes:**
  - Tabs por escopo: Pelada, Organização, Liga, Global.
  - Lista ranqueada com posição, avatar, pontuação.
  - Destaque para o próprio usuário.
- **Dados:** `Standing`, `Player`.

### 3.7 Hall da Fama
- **Componentes:** cards de destaque, conquistas históricas, filtros por temporada.
- **Dados:** `Standing`, `Competition`.

### 3.8 Notificações
- **Componentes:**
  - Lista de notificações por categoria.
  - Preferências por categoria (toggles).
  - Indicador de lida/não lida.
- **Dados:** `Notification`.

---

## 4. Telas do Organizador

### 4.1 Painel do Organizador
**Objetivo:** Central de controle das peladas.
- **Componentes:**
  - Header com seletor de organização (multi-tenant).
  - Cards de resumo: peladas ativas, confirmações pendentes, pagamentos divergentes.
  - Lista de peladas com ações rápidas.
  - Botão flutuante "Criar pelada".
- **Dados:** `Game`, `Organization`, `Payment`.

### 4.2 Criar/Editar Pelada
- **Componentes:**
  - Formulário em etapas (wizard):
    1. Informações básicas (nome, data, horário, local).
    2. Regras (nº de jogadores, tempo, rodízio, goleiros).
    3. Financeiro (valor, forma de cobrança).
    4. Convite (gerar link, mensagem).
  - Pré-visualização do convite.
  - Botão "Salvar rascunho" / "Abrir confirmações".
- **Interações:** validação por etapa, salvamento incremental.
- **Dados:** `Game`, `Invitation`, `Organization`.

### 4.3 Gestão de Confirmações
- **Componentes:**
  - Lista de participantes com status (`CONFIRMADO`, `PENDENTE`, `LISTA_ESPERA`, `DESISTENTE`).
  - Ações: promover da espera, remover, marcar como pago.
  - Indicador de vagas restantes.
  - Botão "Fechar confirmações".
- **Dados:** `GameParticipant`, `Payment`.

### 4.4 Formação de Times
- **Componentes:**
  - Botão "Gerar times equilibrados".
  - Visualização dos times (cards com jogadores, posições, overall).
  - Ajuste manual (drag-and-drop).
  - Indicador de equilíbrio (média de ELO/overall).
  - Botão "Confirmar times".
- **Interações:** transparência nas decisões automáticas, opção de correção manual.
- **Dados:** `Team`, `Player`, `GameParticipant`.

### 4.5 Pelada Ativa (Tela Crítica)
**Objetivo:** Conduzir a partida em tempo real.
- **Componentes:**
  - **Placar sempre visível** (topo fixo).
  - **Cronômetro** com controles (iniciar, pausar, retomar).
  - **Times em campo** (cards lado a lado).
  - **Banco de reservas** com próxima entrada sugerida.
  - **Botões grandes de ação rápida:** Gol, Cartão, Substituição, Pausa, Encerrar.
  - **Feed de eventos** (histórico com correções).
  - **Rodízio** (`RotationQueue`) com sugestão de próxima entrada.
  - Suporte a **orientação horizontal**.
- **Interações:** toques grandes (~48×48 px), confirmação para ações críticas, undo de eventos.
- **Dados:** `Game`, `MatchPeriod`, `GameEvent`, `RotationState`, `Team`.

### 4.6 Súmula e Encerramento
- **Componentes:**
  - Resumo do placar, gols, cartões, substituições.
  - Lista de participantes com estatísticas.
  - Botão "Finalizar pelada".
  - Botão "Exportar súmula" (PDF/imagem).
- **Dados:** `GameEvent`, `Game`, `GameParticipant`.

### 4.7 Financeiro da Pelada
- **Componentes:**
  - Tabela de valores esperados vs. identificados.
  - Status por jogador (`PENDENTE`, `CONFIRMADO`, `DIVERGENTE`, `PARCIAL`).
  - Ações: marcar como pago, registrar divergência.
  - Botão "Gerar cobrança PIX".
- **Interações:** superfícies sólidas (não usar Liquid Glass em dados financeiros).
- **Dados:** `Payment`, `GameParticipant`.

### 4.8 Histórico de Peladas
- **Componentes:** lista filtrável, cards com resultado, link para súmula.
- **Dados:** `Game`, `GameEvent`.

---

## 5. Telas de Competições

### 5.1 Lista de Competições
- **Componentes:** cards de torneios/copas/ligas, filtros por status.
- **Dados:** `Competition`.

### 5.2 Detalhes da Competição
- **Componentes:**
  - Cabeçalho com nome, formato, período.
  - Tabs: Classificação, Chaveamento, Partidas, Premiações.
  - Botão "Inscrever time" (quando aplicável).
- **Dados:** `Competition`, `Standing`, `Game`.

### 5.3 Classificação / Chaveamento
- **Componentes:** tabela de pontos, chaveamento visual (mata-mata), repescagem.
- **Dados:** `Standing`, `Competition`.

### 5.4 Súmula de Partida de Competição
- **Componentes:** mesma estrutura da Pelada Ativa, com vínculo à competição.
- **Dados:** `Game`, `GameEvent`, `Competition`.

### 5.5 Premiação e Pódio
- **Componentes:** pódio visual, cards de premiados, histórico.
- **Dados:** `Competition`, `Standing`.

---

## 6. Telas de Arenas e Quadras

### 6.1 Lista de Arenas
- **Componentes:** cards de arenas com localização, quadras disponíveis.
- **Dados:** `Arena`, `Court`.

### 6.2 Detalhes da Arena
- **Componentes:** informações, fotos, quadras, políticas de cancelamento.
- **Dados:** `Arena`, `Court`.

### 6.3 Grade de Horários
- **Componentes:**
  - Visualização semanal/diária.
  - Slots com status: `LIVRE`, `RESERVADO`, `BLOQUEADO`.
  - Ações: reservar, bloquear, editar.
- **Interações:** drag-and-drop para reservas, prevenção de conflito.
- **Dados:** `Booking`, `Court`.

### 6.4 Criar/Editar Reserva
- **Componentes:** formulário (quadra, data, horário, responsável, valor).
- **Dados:** `Booking`, `Court`, `Payment`.

### 6.5 Bloqueios de Horário
- **Componentes:** formulário de bloqueio (motivo, período, recorrência).
- **Dados:** `Booking`.

---

## 7. Telas Administrativas (SaaS)

### 7.1 Painel da Organização
- **Componentes:** resumo de membros, peladas, competições, arenas, financeiro.
- **Dados:** `Organization`, `OrganizationMember`.

### 7.2 Gestão de Membros
- **Componentes:**
  - Lista de membros com papéis.
  - Ações: convidar, editar papel, remover.
  - Filtros por papel.
- **Dados:** `OrganizationMember`, `User/Profile`.

### 7.3 Papéis e Permissões
- **Componentes:** matriz de permissões por papel, toggles.
- **Dados:** `OrganizationMember`.

### 7.4 Planos e Limites
- **Componentes:** cards de planos, uso atual vs. limite, botão "Fazer upgrade".
- **Dados:** `Subscription`.

### 7.5 Auditoria
- **Componentes:**
  - Tabela de `AuditLog` com filtros (usuário, ação, data).
  - Detalhes de cada evento.
  - Exportação.
- **Dados:** `AuditLog`.

### 7.6 Configurações da Organização
- **Componentes:** dados cadastrais, integrações (WhatsApp, pagamentos), preferências.
- **Dados:** `Organization`.

---

## 8. Telas do Super-Administrador da Plataforma

### 8.1 Painel Global
- **Componentes:** métricas agregadas, tenants ativos, alertas críticos.
- **Dados:** `Organization`, `Subscription`, `AuditLog`.

### 8.2 Gestão de Tenants
- **Componentes:** lista de organizações, status, plano, ações.
- **Dados:** `Organization`.

### 8.3 Observabilidade
- **Componentes:** logs estruturados, request/correlation ID, alertas.
- **Dados:** logs e métricas.

### 8.4 Disputas
- **Componentes:** lista de `Dispute`, detalhes, resolução.
- **Dados:** `Dispute`.

---

## 9. Telas de Árbitro / Mesário (Papel Futuro)

### 9.1 Painel do Árbitro
- **Componentes:** partidas atribuídas, botão "Iniciar súmula".