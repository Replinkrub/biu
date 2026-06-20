# ROADMAP — Biu (Intake Operacional)

> **Produto:** Biu — Registro Comercial Assistido  
> **Repo proposto:** `Replinkrub/biu`  
> **Status:** Plano inicial — aguardando criação do repo  
> **Última revisão:** 2026-06-20  
> **Dono:** Toni + Cockpit (Atlas executa técnico quando acionado)

---

## 1) Objetivo do produto

Ser o **intake operacional dos canais reais da ARCO**. Capturar entradas brutas do Toni (texto, áudio transcrito, print descrito, conversa, contexto comercial) e transformar em **Registro Comercial Assistido (RCA)** estruturado, rastreável e acionável.

O Biu **não decide**. Ele estrutura, classifica, recomenda e pede validação. Toni sempre valida antes de virar ação operacional.

---

## 2) Status atual

**Fase:** v0 — Manual assistido  
**Concluído:** 1ª rodada (10 casos: 8 sucessos, 0 falhas, 2 aguardando dado)  
**Autorizado:** 2ª rodada (20+ casos com template v0.2)  
**Template atual:** Markdown (`BIU_V0_TESTE_MANUAL_10_CASOS.md` no cockpit — a migrar para o repo Biu)

---

## 3) Fases e gates

### Fase 0 — v0 Manual (atual)

**Gate:** D-012 ✅ (Biu v0 manual assistido aprovado)  
**Escopo:** Template markdown + preenchimento manual + validação do Toni.  
**Evidência:** 10 casos reais testados (8 sucessos).  
**Limite:** Sem código, sem automação, sem banco, sem integração.

---

### Fase 1 — v1 CRUD (planejado)

**Gate pendente:** A definir por Toni após revisão deste ROADMAP.

**Objetivo:** Substituir o template markdown manual por uma **interface CRUD web** para registro, consulta, edição e arquivamento de RCAs.

**Por que CRUD:**
- Facilitar iteração do Toni com os registros.
- Permitir busca, filtro e histórico.
- Estruturar dados para futura ingestão pelo ARCO-OS.
- Reduzir retrabalho de preenchimento manual de planilha.

**Escopo do CRUD:**

| Operação | Descrição |
|---|---|
| **Create** | Formulário web para criar novo RCA com campos obrigatórios e validação |
| **Read** | Lista, busca, filtro por cliente, status, categoria, data, representada |
| **Update** | Editar RCA existente (status, pendência, checkpoints, observação) |
| **Delete** | Arquivar/descartar RCA (soft delete — nunca apagar permanentemente) |

**Campos do RCA no CRUD:**

| Campo | Tipo | Obrigatório |
|---|---|---|
| ID | UUID automático | Sim |
| Data | Data/hora automática | Sim |
| Origem | Texto (WhatsApp, telefone, email, etc.) | Sim |
| Canal | Texto | Sim |
| Entrada bruta | Texto longo | Sim |
| Cliente | Texto (nome fantasia) | Não — `cliente não identificado` |
| Contato | Texto | Não |
| CNPJ | Texto (placeholder/mascarado) | Não |
| Segmento | Texto | Não |
| Cidade | Texto | Não |
| Resumo | Texto longo | Sim |
| Categoria | Select (prospecção, pedido, logística, etc.) | Sim |
| Produto citado | Texto | Não |
| Representada | Texto | Não |
| Status | Select (rascunho, aguardando, validado, etc.) | Sim |
| Pendência | Texto longo | Não |
| Bloqueio atual | Texto longo | Não |
| Próxima ação | Texto | Sim |
| Responsável | Texto | Sim |
| Prazo | Data | Não |
| Sensibilidade | Select (baixa, média, alta) | Sim |
| Urgência | Select (baixa, média, alta) | Sim |
| Precisa aprovação | Booleano | Sim |
| Tipo | Select (tarefa, decisão, projeto, espera, descarte, demanda técnica) | Sim |
| Destino | Texto | Sim |
| Observação | Texto longo | Não |
| Checkpoints | Lista de texto | Não |
| Caso relacionado | Referência a outro RCA | Não |

**Stack sugerido (mínimo viável):**
- Frontend: HTML + CSS mínimo + JavaScript vanilla (formulário + lista)
- Backend: API REST simples (Node/Express ou Python/Flask)
- Banco: SQLite local (migração para PostgreSQL futura)
- Autenticação: Não necessária no MVP (single user = Toni)
- Deploy: Local ou VPS simples

**Fora de escopo do CRUD v1:**
- Autenticação multi-usuário
- Integração com WhatsApp
- Envio automático de mensagem
- Integração com ARCO-OS (ingestão futura)
- Integração com IPRO
- Mobile app
- IA/ML para classificação automática

---

### Fase 2 — v2 Integração (futuro, condicionado)

**Gate pendente:** Depende de gates ARCO-OS e maturidade do CRUD.

**Possível escopo futuro:**
- Integração com WhatsApp (leitura, não envio automático)
- Classificação automática por IA
- Ingestão no ARCO-OS/Core Layer
- Dashboard de RCAs para C-Level

**Condição:** Só será avaliado após v1 CRUD estável e validado por Toni.

---

## 4) Próximos marcos

| Marco | Gate | Previsão |
|---|---|---|
| Criar repo `Replinkrub/biu` | Toni autorizar | Imediato |
| Migrar template RCA do cockpit para o repo Biu | — | Após criação do repo |
| Escrever plano de evolução do template v0.2 no repo Biu | D-012 seguimento | 1 ciclo |
| Iniciar 2ª rodada manual (20+ casos) | — | Após template v0.2 |
| Especificar CRUD (SPEC.md detalhada) | Toni revisar | 1-2 ciclos |
| Implementar CRUD v1 | Gate de implementação | A definir |
| Validar CRUD com Toni | — | Após implementação |

---

## 5) Fora de escopo permanente

- WhatsApp automático (envia mensagem sozinho)
- Envio automático de email
- Biu autônomo (decide sem Toni)
- Substituir CRM/ERP
- Banco de dados de clientes (cliente mora no ARCO-OS/ERP futuramente)
- Integração completa sem gate

---

## 6) Dependências

| Dependência | Status |
|---|---|
| ARCO-OS Core Layer | Futuro (Fase 2) |
| IPRO | Futuro (inteligência sobre RCAs) |
| Template RCA v0.2 | Em evolução |
| Repo Biu | Aguardando criação |

---

## 7) Decisões pendentes

| ID | Decisão | Urgência |
|---|---|---|
| — | Criar repo `Replinkrub/biu` | Alta |
| — | Aprovar stack CRUD v1 (Node ou Python) | Média |
| — | Autorizar início de implementação do CRUD após SPEC | Futura |

---

## 8) Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| CRUD virar sistema complexo antes de validar schema | Alto | MVP mínimo: formulário + lista + SQLite |
| Dados reais migrarem para o repo sem sanitização | Alto | CRUD opera com dados mock/teste até gate de produção |
| Biu virar CRM paralelo | Médio | Fronteira clara: Biu registra interação; CRM gerencia relação |
| Toni não usar o CRUD | Médio | Validar usabilidade com Toni antes de expandir |

---

## 9) Critério para iniciar implementação

1. Repo Biu criado.
2. ROADMAP.md e SPEC.md aprovados por Toni.
3. Template RCA v0.2 validado em 20+ casos.
4. Gate de implementação do CRUD aprovado.
5. Stack definido e ambiente disponível.
