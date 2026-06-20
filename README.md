# Biu — Intake Operacional da ARCO

**Registro Comercial Assistido (RCA)** — CRUD v1.

## O que é

O Biu captura entradas brutas dos canais reais da ARCO (WhatsApp, telefone, email, conversa) e as transforma em registros estruturados, rastreáveis e acionáveis.

**Biu não decide.** Estrutura, classifica e pede validação. Toni sempre valida antes de virar ação.

## Stack

- **Backend:** Node.js + Express
- **Banco:** SQLite (better-sqlite3)
- **Frontend:** HTML + CSS + JavaScript vanilla (SPA)

## Rodar

```bash
npm install
node server.js
```

Acessar: http://localhost:3000

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/rcas` | Listar (com ?q=, ?status=, ?categoria=) |
| POST | `/api/rcas` | Criar RCA |
| GET | `/api/rcas/:id` | Ler RCA |
| PUT | `/api/rcas/:id` | Atualizar RCA |
| DELETE | `/api/rcas/:id` | Arquivar (soft delete) |
| GET | `/api/stats` | Estatísticas |

## Estrutura

```
biu/
├── server.js          # Express API
├── database.js        # SQLite schema + prepared statements
├── public/
│   └── index.html     # Frontend SPA
├── templates/         # Templates RCA markdown
├── ROADMAP.md
├── SPEC.md
└── README.md
```
