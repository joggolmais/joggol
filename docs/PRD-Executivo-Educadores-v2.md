# JogGol — PRD Executivo para Educadores
## Documento de Referência Rápida (Versão Educacional)

**Versão:** 2.0 — Recorte pedagógico
**Data-base:** 10/10/2026
**Público-alvo:** Educadores, instrutores, professores de tecnologia, mentores de produto e facilitadores de bootcamps
**Documento-fonte:** PRD mestre JogGol v2.0

---

## 1. Resumo

O **JogGol** é uma plataforma esportiva digital SaaS criada para organizar futebol amador e evoluir para um ecossistema completo de jogadores, times, torneios, arenas, pagamentos e rankings.

Nasceu resolvendo um problema real e cotidiano: **organizar uma pelada** — convite, confirmação, lista de espera, cobrança, formação de times, rodízio, placar e súmula. A partir disso, expande-se para competições, arenas, monetização e gestão multi-organização.

**Frase-guia do produto:**
> *"Complexidade no sistema. Simplicidade para o usuário."*

**Por que é um excelente caso de estudo educacional:**
- Cobre o ciclo completo de produto: problema → persona → requisito → arquitetura → segurança → produção.
- Exige decisões explícitas sobre escopo, riscos e trade-offs.
- Combina domínio de negócio real (esporte amador) com desafios técnicos modernos (offline-first, multi-tenant, PWA, pagamentos, WhatsApp API).
- Traz política de **não destruição**, **decisões em aberto** e **Definition of Done** — práticas raras em PRDs didáticos.

---

## 2. Visão

**Visão de curto prazo:** tornar a organização de uma pelada simples, justa e automática, sem depender de planilhas, grupos de WhatsApp desorganizados ou memória do organizador.

**Visão de longo prazo:** ser o **ecossistema esportivo amador** que conecta jogadores, organizadores, arenas, competições e pagamentos em uma base SaaS multi-tenant segura, escalável e monetizável.

**Posicionamento estratégico:**
- Trabalhar **junto** com o WhatsApp, não contra ele.
- Centralizar dados, decisões e processos na plataforma.
- Manter a comunicação social onde ela já funciona.

**Princípios de produto (para discussão em sala):**
1. Baixa fricção para entrar.
2. Uma tela, uma decisão.
3. Complexidade progressiva por perfil.
4. Transparência nas decisões automáticas.
5. Justiça percebida no equilíbrio e no rodízio.
6. Backend como fonte de verdade.
7. Segurança e privacidade por padrão.
8. Offline resiliente, com limites explícitos.
9. Nada importante desaparece silenciosamente.
10. Menos cliques, menos mensagens, menos dúvidas.

---

## 3. Mercado

**Contexto:** a organização de partidas amadoras hoje depende de:
- grupos de WhatsApp;
- planilhas soltas;
- comprovantes dispersos;
- memória do organizador.

**Dores típicas:**
- dificuldade para confirmar presença;
- listas duplicadas;
- vagas perdidas e lista de espera desorganizada;
- cobrança manual e divergências;
- times percebidos como injustos;
- rodízio desigual;
- conflito de horários em quadras;
- ausência de histórico esportivo confiável.

**Oportunidade:**
- Mercado fragmentado, sem solução dominante.
- Público fiel e recorrente (peladas semanais).
- Potencial de monetização via SaaS, inscrições pagas, arenas e patrocínios.
- Extensível para torneios, ligas, arenas, academias e comunidades.

**Segmentos atendidos:**
| Segmento | Necessidade central |
|---|---|
| Jogador | Saber onde, quando, quanto e se está confirmado |
| Organizador | Criar, convidar e conduzir com mínimo esforço |
| Arena/quadra | Gerir horários, reservas e conflitos |
| Organização SaaS | Multi-tenant, permissões, planos e limites |
| Plataforma | Monetizar, escalar, auditar e observar |

---

## 4. Personas

### 4.1 Organizador
Administra a pelada. Quer criar → convidar → acompanhar → deixar o sistema trabalhar. Corrige decisões automáticas quando necessário.

### 4.2 Jogador
Quer entrar → confirmar → jogar. Precisa ver status, local, horário e valor sem navegar por painel administrativo.

### 4.3 Convidado
Entra por link, sem cadastro tradicional. Fornece dados mínimos e confirma (ou entra na lista de espera).

### 4.4 Administrador de Organização
Gerencia membros, jogos, permissões e configurações dentro do seu tenant.

### 4.5 Operador de Arena/Quadra
Controla instalações, quadras, disponibilidade, bloqueios e reservas.

### 4.6 Super-Administrador da Plataforma
Opera o SaaS globalmente, com acesso privilegiado **auditado**.

### 4.7 Árbitro / Mesário *(papel futuro ou configurável)*
Registra eventos de jogo, placar, cartões e encerramento conforme permissão.

**Exercício sugerido:** mapear uma "jornada do organizador" em 5 passos e identificar onde a plataforma reduz esforço manual.

---

## 5. Histórias de Usuário (User Stories)

Formato padrão: *Como [persona], quero [ação], para [benefício].*

**Organizador**
- Como organizador, quero criar uma pelada com regras claras, para não precisar explicar tudo no WhatsApp.
- Como organizador, quero compartilhar um link seguro de convite, para que convidados entrem sem fricção.
- Como organizador, quero que o sistema forme times equilibrados, para reduzir reclamações.
- Como organizador, quero corrigir decisões automáticas, para manter controle quando necessário.

**Jogador**
- Como jogador, quero confirmar presença em poucos toques, para não perder tempo.
- Como jogador, quero ver meu status (confirmado, espera, banco, campo), para saber o que esperar.
- Como jogador, quero acompanhar meu histórico e estatísticas, para ver minha evolução.

**Convidado**
- Como convidado, quero entrar por link sem criar conta, para participar rapidamente.
- Como convidado, quero saber se estou confirmado ou na lista de espera, para me organizar.

**Operador de Arena**
- Como operador, quero visualizar a grade de horários, para evitar conflitos de reserva.
- Como operador, quero bloquear horários com segurança, para manter controle da quadra.

**Administrador SaaS**
- Como admin, quero isolar dados por organização, para garantir privacidade e conformidade.
- Como admin, quero auditar ações críticas, para rastrear decisões e incidentes.

---

## 6. Funcionalidades

Agrupadas por módulo. **Existência no escopo ≠ implementado.**

### 6.1 Núcleo de Partidas
- Criar, editar, abrir, fechar, iniciar, pausar, retomar, finalizar e cancelar peladas.
- Convites compartilháveis com token seguro.
- Entrada simplificada e confirmação de presença.
- Lista de espera com promoção automática.
- Times, posições, goleiros e equilíbrio tático.
- **Pelada Ativa:** placar, cronômetro, gols, cartões, substituições, rodízio.
- Súmula, histórico e resultado.

### 6.2 Comunidade e Identidade Esportiva
- Perfil de jogador e histórico.
- Estatísticas, conquistas, XP, níveis, medalhas.
- Cards de atleta com Overall, ELO e tiers.
- Rankings por escopo (pelada, organização, liga, global).
- Hall da Fama.

### 6.3 Competições
- Torneios, copas, ligas e campeonatos.
- Fase de grupos, pontos corridos, mata-mata, repescagem.
- Sorteio, seeding, classificação e chaveamento.
- Súmula integrada às partidas.
- Premiações, pódio e histórico.

### 6.4 Arenas e Quadras
- Cadastro de arenas, instalações e quadras.
- Grade horária, disponibilidade e bloqueios.
- Reservas com prevenção de conflito.
- Políticas de cancelamento (em aberto).

### 6.5 Financeiro e Monetização
- Valores esperados vs. identificados.
- PIX, Asaas e/ou Mercado Pago (conforme configuração real).
- Inscrições pagas em torneios.
- Assinaturas SaaS por organização.
- Reconciliação, idempotência e auditoria.

### 6.6 Comunicação
- WhatsApp Cloud API quando configurada.
- Templates aprovados, fila, retries, fallback `wa.me`.
- Notificações internas com preferências por categoria.

### 6.7 Administração SaaS
- Organizações, membros, papéis e permissões.
- Isolamento multi-tenant.
- Planos, limites e recursos.
- Auditoria de ações administrativas.

### 6.8 Extensões Futuras
Marketplace, patrocínios, painéis de arena (Screen), analytics avançado, apps nativos.

---

## 7. Requisitos Técnicos

### 7.1 Stack de Referência
- **Frontend:** Next.js + TypeScript + React + Tailwind CSS v4.
- **Backend/Dados:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- **Offline:** Dexie.js / IndexedDB.
- **Deploy:** Vercel (se compatível).
- **Versionamento:** GitHub.
- **Pagamentos:** Asaas e/ou Mercado Pago.
- **Comunicação:** WhatsApp Cloud API.

> ⚠️ A lista **não autoriza migração de stack**. Auditar o repositório antes.

### 7.2 Princípios de Arquitetura
- Backend como fonte de verdade.
- Validação sempre no servidor.
- Operações mutáveis idempotentes.
- Eventos de domínio para auditoria.
- Ambientes separados: dev, preview, produção.
- Contratos de API claros e erros consistentes.

### 7.3 Modelo Conceitual de Dados (referência)
`User/Profile`, `Organization`, `OrganizationMember`, `Player`, `Game`, `GameParticipant`, `Invitation`, `Team`, `MatchPeriod`, `GameEvent`, `RotationState`, `Competition`, `Standing`, `Arena`, `Court`, `Booking`, `Payment`, `Subscription`, `Notification`, `Dispute`, `AuditLog`.

### 7.4 Máquinas de Estado (referência)
- **Pelada:** RASCUNHO → ABERTA → CONFIRMAÇÕES_FECHADAS → EM_ANDAMENTO → FINALIZADA → ENCERRADA.
- **Participante:** CONVIDADO → PENDENTE → CONFIRMADO → EM_CAMPO ↔ BANCO → FINALIZADO (+ DESISTENTE, LESIONADO, LISTA_ESPERA).
- **Pagamento:** PENDENTE → PROCESSANDO → CONFIRMADO (+ DIVERGENTE, FALHOU, PARCIAL, ESTORNADO).

### 7.5 Segurança (transversal)
- Autenticação e sessão seguras.
- Autorização server-side + RLS no Supabase.
- Isolamento multi-tenant testado com casos negativos.
- Proteção contra IDOR, XSS, injeção, CSRF, replay.
- Tokens de convite com entropia, expiração e revogação.
- Segredos fora do frontend e do versionamento.
- Webhooks assinados e idempotentes.
- LGPD avaliada; coleta mínima de dados.

### 7.6 Offline-First
- IndexedDB/Dexie para dados estruturados.
- Service worker para shell e assets.
- Fila de sincronização com retry e backoff.
- Estados visíveis: *salvo local*, *sincronizando*, *sincronizado*.
- Conflitos: **nunca** resolver financeiro por "última gravação vence".

### 7.7 PWA
- Manifest válido, ícones maskable, favicon, theme color.
- Service worker com estratégia de atualização.
- Fallback offline e instalação nos navegadores suportados.

---

## 8. UI/UX

### 8.1 Direção Visual — Liquid Glass
- Superfícies com transparência e desfoque **criteriosos**.
- Profundidade sutil, bordas discretas, tipografia clara.
- **Regra:** Liquid Glass não pode comprometer legibilidade, contraste, performance ou acessibilidade.
- Tabelas, dados financeiros e conteúdos densos → superfícies sólidas.

### 8.2 Princípios de UX
- Uma tela, uma decisão.
- Complexidade progressiva.
- Estados vazios com contexto e ação útil.
- Erros em linguagem humana com retry seguro.
- Feedback claro: salvo local / sincronizando / sincronizado.
- Não depender apenas de cor para status.
- Não ocultar divergências nem decisões automáticas.

### 8.3 Pelada Ativa (tela crítica)
Prioridades:
- Placar sempre visível.
- Cronômetro e estado da partida.
- Times em campo + banco de reservas.
- Próxima entrada sugerida.
- Botões grandes e acessíveis.
- Ações rápidas: gol, cartão, substituição, pausa, encerramento.
- Histórico de eventos e correções.
- Suporte a orientação horizontal.

### 8.4 Responsividade
Mobile-first. Validar formulários com teclado virtual, safe areas, touch targets (~48×48 px), ausência de rolagem horizontal.

### 8.5 Acessibilidade (meta WCAG 2.2 AA)
- Navegação por teclado e foco visível.
- Semântica, labels e nomes acessíveis.
- Contraste e texto redimensionável.
- Suporte a leitores de tela e `reduced motion`.

---

## 9. Métricas

**Metas iniciais (referência — estabelecer linha de base antes):**
- Tempo para criar pelada + compartilhar convite.
- Taxa de convidados que concluem entrada/confirmam.
- Taxa de comparecimento vs. confirmação.
- % de partidas com súmula completa.
- Taxa de sucesso de sincronização offline.
- Operações manuais por partida.
- Divergências de pagamento pendentes e tempo de resolução.
- Diferença de tempo jogado entre elegíveis (justiça do rodízio).
- Falhas de integração por provedor.
- Retenção de organizadores e jogadores.
- Conversão para planos pagos (se ativados).

**Metas técnicas indicativas:**
- Lighthouse Performance/Accessibility/Best Practices > 95 (aspiracional, por rota/dispositivo).
- 166/166 testes reportados aprovados (a verificar).
- Build com 22 rotas estáticas/dinâmicas.

**Observabilidade:**
- Logs estruturados, request/correlation ID.
- Monitoramento frontend/backend.
- Alertas para falhas críticas.
- **Nunca** registrar segredos ou dados pessoais desnecessários.

---

## 10. Cronograma (Roadmap Recomendado)

| Fase | Foco | Entregáveis-chave |
|---|---|---|
| **A — Auditoria** | Linha de base | Ler PRD, mapear arquitetura, rodar testes/build, listar gaps P0–P3 |
| **B — Rebranding JogGol** | Identidade | Logo oficial, metadados, PWA, ícones, mensagens |
| **C — Design System** | UI/UX | Tokens, Liquid Glass, Pelada Ativa, responsividade, acessibilidade |
| **D — PWA e Offline** | Resiliência | Manifest, service worker, sync, conflitos |
| **E — Segurança e Integrações** | Confiabilidade | RLS, autorização, webhooks, pagamentos, WhatsApp |
| **F — Performance e Regressão** | Qualidade | Medições reais, correções, testes, build |
| **G — Produção Controlada** | Go-live | Ambientes, segredos, domínio, backups, rollback, smoke tests |
| **H — Evolução Comercial** | Escala | Analytics, painéis de arena, sponsors, marketplace |

**Estado reportado (a auditar):** Fases 1–13 concluídas, 166/166 testes aprovados, Next.js 16 + Turbopack, 22 rotas.

---

## Anexos Pedagógicos

### A. Decisões em Aberto (não inventar)
- Nº padrão de jogadores por modalidade
- Política de cancelamento de reservas
- Regras de desempate em competições
- Provedor de pagamento padrão por região
- Estratégia de retenção de convidados sem conta