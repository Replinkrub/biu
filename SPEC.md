# SPEC — Biu (Intake Operacional da ARCO)

> **Produto:** Biu — Registro Comercial Assistido  
> **Repo proposto:** `Replinkrub/biu`  
> **Versão da SPEC:** 1.0 — Plano inicial  
> **Última revisão:** 2026-06-20  
> **Dono do produto:** Toni  
> **Executor técnico (quando acionado):** Atlas / AI Workflow

---

## 1) Identidade do produto

**Nome:** Biu  
**Papel:** Intake operacional dos canais reais da ARCO.  
**Frase canônica:** *Biu captura, estrutura, classifica e pede validação. Toni decide.*

**O que é:**
- Uma ferramenta de registro comercial assistido.
- A porta de entrada para demandas operacionais da ARCO.
- Um estruturador de contexto bruto em registro acionável.

**O que não é:**
- Um CRM.
- Um ERP.
- Um bot de WhatsApp.
- Um sistema de decisão automática.
- Um banco de dados de clientes.

---

## 2) Contrato do produto

### Pode

- Receber entrada bruta do Toni (texto, áudio transcrito, print descrito, conversa).
- Preencher template RCA com campos obrigatórios e opcionais.
- Marcar `dado faltante` quando informação não estiver disponível.
- Classificar cada registro em um tipo (tarefa, decisão, projeto, espera, descarte, demanda técnica).
- Recomendar aprovação do Toni quando o registro envolver preço, prazo, desconto, cliente sensível, reclamação ou condição comercial.
- Registrar checkpoints de fluxo pós-registro.
- Permitir busca, filtro e histórico de RCAs (v1 CRUD).
- Vincular RCAs relacionados (mesmo cliente, mesma linha do tempo).

### Não pode

- Enviar mensagem (WhatsApp, email, etc.) sem ação explícita do Toni.
- Decidir preço, prazo, frete, desconto ou condição comercial.
- Agir sem validação do Toni.
- Registrar verdade final sem aprovação.
- Acionar AI Workflow diretamente — `demanda técnica` é apenas classificação; o cockpit decide se vira execução.
- Criar, alterar ou remover dados de cliente no ARCO-OS/ERP.
- Virar banco de verdade canônica de cliente, produto ou pedido.

---

## 3) Entidades e schema conceitual

### RCA (Registro Comercial Assistido)

Entidade central do Biu. Um RCA representa uma interação comercial capturada, estruturada e pronta para ação.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `data_criacao` | DateTime | Sim | Data/hora de criação |
| `data_atualizacao` | DateTime | Sim | Data/hora da última edição |
| `origem` | String | Sim | De onde veio (WhatsApp, telefone, email, etc.) |
| `canal` | String | Sim | Canal específico |
| `entrada_bruta` | Text | Sim | Transcrição ou descrição da entrada original |
| `formato_entrada` | String | Não | Texto, áudio, imagem, print |
| `cliente` | String | Não | Nome fantasia ou `cliente não identificado` |
| `contato` | String | Não | Nome e telefone do contato |
| `cnpj` | String | Não | Placeholder — dado real não versionado |
| `segmento` | String | Não | Ramo de atividade |
| `cidade` | String | Não | Cidade/UF |
| `resumo` | Text | Sim | Síntese do caso em linguagem natural |
| `categoria` | Enum | Sim | prospecção, pedido, logística, cobrança, financeiro, etc. |
| `produto_citado` | String | Não | Produto mencionado |
| `representada` | String | Não | Representada vinculada |
| `status` | Enum | Sim | rascunho, aguardando_toni, validado, registrado, em_espera, descartado, convertido |
| `pendencia` | Text | Não | O que está pendente |
| `bloqueio_atual` | Text | Não | O que impede o avanço agora |
| `proxima_acao` | Text | Sim | Menor próximo passo |
| `responsavel` | String | Sim | Quem executa a próxima ação |
| `prazo` | Date | Não | Data limite |
| `sensibilidade` | Enum | Sim | baixa, media, alta |
| `urgencia` | Enum | Sim | baixa, media, alta |
| `precisa_aprovacao_toni` | Boolean | Sim | Se requer validação do Toni |
| `tipo` | Enum | Sim | tarefa, decisao, projeto, espera, descarte, demanda_tecnica |
| `destino` | String | Sim | Para onde vai (CRM, operação, etc.) |
| `observacao` | Text | Não | Notas adicionais |
| `checkpoints` | List<String> | Não | Marcos objetivos pós-registro |
| `caso_relacionado_id` | UUID | Não | Vínculo com RCA anterior do mesmo cliente |
| `cadeia_responsabilidade` | Text | Não | Quem contrata → quem executa → cliente final |
| `historico_linha_tempo` | Text | Não | Datas e eventos anteriores (para pendências arrastadas) |
| `prazo_critico_cliente` | String | Não | Expectativa não contratual do cliente |
| `prazo_maximo_parceiro` | String | Não | Prazo que depende de terceiro |
| `financeiro_acerto_pendente` | Text | Não | Valores, parcelas, bonificações |
| `dependencia_externa` | Text | Não | O que não depende da ARCO |

### Tipos permitidos (enum)

- `tarefa` — ação operacional com responsável e prazo.
- `decisao` — requer escolha do Toni.
- `projeto` — demanda multi-etapa.
- `espera` — aguardando evento externo.
- `descarte` — entrada que não gera ação.
- `demanda_tecnica` — candidata a execução pelo AI Workflow (não aciona automaticamente).

### Status permitidos (enum)

- `rascunho` — recém-criado, não revisado.
- `aguardando_toni` — requer validação do Toni.
- `validado` — Toni revisou e aprovou.
- `corrigido` — Toni ajustou e devolveu.
- `registrado` — finalizado e arquivado.
- `em_espera` — pausado por dependência externa.
- `descartado` — entrada arquivada sem ação.
- `convertido_em_tarefa` — virou ação operacional.
- `convertido_em_decisao` — virou D-0XX.
- `convertido_em_projeto` — virou projeto.
- `convertido_em_demanda_tecnica` — encaminhado ao cockpit para avaliação.

---

## 4) Fases do produto

### Fase 0 — v0 Manual (ATUAL)

**Interface:** Template Markdown preenchido manualmente.  
**Armazenamento:** Arquivo `.md` no repo Biu (a migrar do cockpit).  
**Validação:** Toni revisa e aprova cada RCA manualmente.  
**Gate:** D-012 ✅

### Fase 1 — v1 CRUD (PLANEJADO)

**Interface:** Aplicação web com formulário CRUD.  
**Armazenamento:** SQLite local (single user).  
**Funcionalidades:**
- **Create:** Formulário web para novo RCA com validação de campos obrigatórios.
- **Read:** Lista paginada, busca textual, filtro por status/categoria/cliente/representada/data.
- **Update:** Edição de RCA existente com registro de alterações.
- **Delete:** Soft delete (arquivar — nunca apagar permanentemente).
- **Export:** Exportar RCA individual ou lista como Markdown (compatível com formato atual).

**Stack (definido — Node.js, alinhado ao ecossistema REPLINK):**
- Frontend: HTML + CSS + JavaScript vanilla (SPA no mesmo servidor)
- Backend: Node.js + Express (REST API)
- Banco: SQLite via better-sqlite3 (arquivo local, sem servidor)
- Deploy: `node server.js` na porta 3000

**Gate:** Implementação iniciada (2026-06-20). CRUD v1 funcional.

### Fase 2 — v2 Integração (FUTURO)

**Condição:** v1 CRUD estável e validado + gates ARCO-OS aprovados.  
**Possível escopo:** Integração com WhatsApp (leitura), classificação por IA, ingestão no ARCO-OS.  
**Gate:** A definir.

---

## 5) Fronteira com outros produtos

| Produto | Relação com Biu | O que Biu NÃO faz |
|---|---|---|
| **REPLINK-CONTROL** | Cockpit recebe handoff do Biu quando RCA vira demanda técnica ou decisão | Biu não governa, não prioriza, não cria D-0XX |
| **ARCO-OS** | Futuro: RCA alimenta Core Layer após curadoria | Biu não escreve no ARCO-OS sem gate |
| **ARCO-ERP** | RCA de pedido pode virar pedido no ERP | Biu não cria pedido diretamente |
| **IPRO** | RCA histórico pode alimentar inteligência comercial | Biu não faz análise de dados |
| **CRM Arco** | RCA registra interação; CRM gerencia relacionamento | Biu não substitui CRM |
| **C-Level Squad** | RCA fornece contexto operacional para análise estratégica | Biu não recomenda estratégia |

---

## 6) Regras de segurança e dados

1. **Dados reais de cliente NUNCA versionados.** CNPJ, telefone, nome de contato — placeholders ou mascarados.
2. **Banco SQLite local.** Sem exposição em rede no MVP.
3. **Sem autenticação no MVP.** Single user (Toni). Autenticação só se houver multi-usuário.
4. **Soft delete.** Nenhum RCA é apagado permanentemente sem autorização.
5. **Backup manual.** SQLite é arquivo; backup é cópia do arquivo.

---

## 7) Critérios de aceite

### v0 Manual (já atendido)
- [x] Template RCA estruturado com campos obrigatórios.
- [x] 10 casos reais testados (8 sucessos).
- [x] Toni consegue validar, corrigir ou descartar.

### v1 CRUD
- [ ] Formulário web funcional com todos os campos do RCA.
- [ ] Validação de campos obrigatórios (não salva sem resumo, próxima ação, responsável, tipo).
- [ ] Lista de RCAs com busca e filtro.
- [ ] Edição de RCA preserva histórico de alterações.
- [ ] Soft delete funcional.
- [ ] Toni consegue usar sem depender de markdown manual.
- [ ] Nenhum dado real de cliente versionado no repo.

---

## 8) O que NÃO está nesta SPEC

- Implementação de código (requer gate separado).
- Automação de WhatsApp.
- Integração com sistemas externos.
- Banco de dados de produção.
- Migração de dados do MERCOS.
- Interface mobile.
- Dashboard analítico.

---

## 9) Próximos passos

1. Criar repo `Replinkrub/biu`.
2. Migrar ROADMAP.md e SPEC.md para o repo.
3. Migrar template RCA do cockpit para `biu/templates/`.
4. Toni revisar e aprovar plano CRUD.
5. Se aprovado, abrir gate de implementação do CRUD v1.
