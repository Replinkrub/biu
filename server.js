// biu/server.js
// Biu CRUD API — Express + SQLite
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { stmts } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ===================================================================
// API Routes
// ===================================================================

// POST /api/rcas — Create
app.post('/api/rcas', (req, res) => {
  try {
    const id = uuidv4();
    const data = {
      id,
      origem: req.body.origem || '',
      canal: req.body.canal || '',
      formato_entrada: req.body.formato_entrada || null,
      entrada_bruta: req.body.entrada_bruta || '',
      cliente: req.body.cliente || null,
      contato: req.body.contato || null,
      cnpj: req.body.cnpj || null,
      segmento: req.body.segmento || null,
      cidade: req.body.cidade || null,
      resumo: req.body.resumo || '',
      categoria: req.body.categoria || 'atendimento',
      produto_citado: req.body.produto_citado || null,
      representada: req.body.representada || null,
      status: req.body.status || 'rascunho',
      pendencia: req.body.pendencia || null,
      bloqueio_atual: req.body.bloqueio_atual || null,
      proxima_acao: req.body.proxima_acao || '',
      responsavel: req.body.responsavel || '',
      prazo: req.body.prazo || null,
      sensibilidade: req.body.sensibilidade || 'media',
      urgencia: req.body.urgencia || 'media',
      precisa_aprovacao_toni: req.body.precisa_aprovacao_toni ? 1 : 0,
      tipo: req.body.tipo || 'tarefa',
      destino: req.body.destino || '',
      observacao: req.body.observacao || null,
      checkpoints: req.body.checkpoints ? JSON.stringify(req.body.checkpoints) : null,
      caso_relacionado_id: req.body.caso_relacionado_id || null,
      cadeia_responsabilidade: req.body.cadeia_responsabilidade || null,
      historico_linha_tempo: req.body.historico_linha_tempo || null,
      prazo_critico_cliente: req.body.prazo_critico_cliente || null,
      prazo_maximo_parceiro: req.body.prazo_maximo_parceiro || null,
      financeiro_acerto_pendente: req.body.financeiro_acerto_pendente || null,
      dependencia_externa: req.body.dependencia_externa || null,
    };

    // Validate required fields
    if (!data.entrada_bruta || !data.resumo || !data.proxima_acao || !data.responsavel || !data.tipo || !data.destino) {
      return res.status(400).json({ error: 'Campos obrigatórios: entrada_bruta, resumo, proxima_acao, responsavel, tipo, destino' });
    }

    stmts.create.run(data);
    const created = stmts.getById.get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rcas — Read all / search / filter
app.get('/api/rcas', (req, res) => {
  try {
    const { q, status, categoria } = req.query;

    let rows;
    if (q) {
      rows = stmts.search.all({ q: `%${q}%` });
    } else if (status) {
      rows = stmts.filterByStatus.all(status);
    } else if (categoria) {
      rows = stmts.filterByCategoria.all(categoria);
    } else {
      rows = stmts.getAll.all();
    }

    // Parse checkpoints JSON for each row
    rows = rows.map(r => ({
      ...r,
      checkpoints: r.checkpoints ? JSON.parse(r.checkpoints) : [],
      precisa_aprovacao_toni: !!r.precisa_aprovacao_toni,
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rcas/:id — Read single
app.get('/api/rcas/:id', (req, res) => {
  try {
    const row = stmts.getById.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'RCA não encontrado' });

    row.checkpoints = row.checkpoints ? JSON.parse(row.checkpoints) : [];
    row.precisa_aprovacao_toni = !!row.precisa_aprovacao_toni;
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rcas/:id — Update
app.put('/api/rcas/:id', (req, res) => {
  try {
    const existing = stmts.getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'RCA não encontrado' });

    const data = {
      id: req.params.id,
      origem: req.body.origem ?? existing.origem,
      canal: req.body.canal ?? existing.canal,
      formato_entrada: req.body.formato_entrada ?? existing.formato_entrada,
      entrada_bruta: req.body.entrada_bruta ?? existing.entrada_bruta,
      cliente: req.body.cliente !== undefined ? req.body.cliente : existing.cliente,
      contato: req.body.contato !== undefined ? req.body.contato : existing.contato,
      cnpj: req.body.cnpj !== undefined ? req.body.cnpj : existing.cnpj,
      segmento: req.body.segmento !== undefined ? req.body.segmento : existing.segmento,
      cidade: req.body.cidade !== undefined ? req.body.cidade : existing.cidade,
      resumo: req.body.resumo ?? existing.resumo,
      categoria: req.body.categoria ?? existing.categoria,
      produto_citado: req.body.produto_citado !== undefined ? req.body.produto_citado : existing.produto_citado,
      representada: req.body.representada !== undefined ? req.body.representada : existing.representada,
      status: req.body.status ?? existing.status,
      pendencia: req.body.pendencia !== undefined ? req.body.pendencia : existing.pendencia,
      bloqueio_atual: req.body.bloqueio_atual !== undefined ? req.body.bloqueio_atual : existing.bloqueio_atual,
      proxima_acao: req.body.proxima_acao ?? existing.proxima_acao,
      responsavel: req.body.responsavel ?? existing.responsavel,
      prazo: req.body.prazo !== undefined ? req.body.prazo : existing.prazo,
      sensibilidade: req.body.sensibilidade ?? existing.sensibilidade,
      urgencia: req.body.urgencia ?? existing.urgencia,
      precisa_aprovacao_toni: req.body.precisa_aprovacao_toni !== undefined ? (req.body.precisa_aprovacao_toni ? 1 : 0) : existing.precisa_aprovacao_toni,
      tipo: req.body.tipo ?? existing.tipo,
      destino: req.body.destino ?? existing.destino,
      observacao: req.body.observacao !== undefined ? req.body.observacao : existing.observacao,
      checkpoints: req.body.checkpoints ? JSON.stringify(req.body.checkpoints) : existing.checkpoints,
      caso_relacionado_id: req.body.caso_relacionado_id !== undefined ? req.body.caso_relacionado_id : existing.caso_relacionado_id,
      cadeia_responsabilidade: req.body.cadeia_responsabilidade !== undefined ? req.body.cadeia_responsabilidade : existing.cadeia_responsabilidade,
      historico_linha_tempo: req.body.historico_linha_tempo !== undefined ? req.body.historico_linha_tempo : existing.historico_linha_tempo,
      prazo_critico_cliente: req.body.prazo_critico_cliente !== undefined ? req.body.prazo_critico_cliente : existing.prazo_critico_cliente,
      prazo_maximo_parceiro: req.body.prazo_maximo_parceiro !== undefined ? req.body.prazo_maximo_parceiro : existing.prazo_maximo_parceiro,
      financeiro_acerto_pendente: req.body.financeiro_acerto_pendente !== undefined ? req.body.financeiro_acerto_pendente : existing.financeiro_acerto_pendente,
      dependencia_externa: req.body.dependencia_externa !== undefined ? req.body.dependencia_externa : existing.dependencia_externa,
    };

    stmts.update.run(data);
    const updated = stmts.getById.get(req.params.id);
    updated.checkpoints = updated.checkpoints ? JSON.parse(updated.checkpoints) : [];
    updated.precisa_aprovacao_toni = !!updated.precisa_aprovacao_toni;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rcas/:id — Soft delete
app.delete('/api/rcas/:id', (req, res) => {
  try {
    const existing = stmts.getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'RCA não encontrado' });

    stmts.softDelete.run(req.params.id);
    res.json({ message: 'RCA arquivado', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — Dashboard
app.get('/api/stats', (req, res) => {
  try {
    const byStatus = stmts.stats.all();
    const total = stmts.getAll.all().length;
    res.json({ total, byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// Start server
// ===================================================================
app.listen(PORT, () => {
  console.log(`Biu CRUD rodando em http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/rcas`);
});
