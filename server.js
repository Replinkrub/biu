// biu/server.js
// Biu CRUD API — Express + SQLite + File Upload + Client Base
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stmts, importFromMercos } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload dir exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config — accept images, audio, pdf
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp3|wav|ogg|mp4|webm|pdf|txt|csv)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// ===================================================================
// RCA Routes
// ===================================================================

// POST /api/rcas — Create
app.post('/api/rcas', (req, res) => {
  try {
    const id = uuidv4();
    const arquivos = req.body.arquivos ? JSON.stringify(req.body.arquivos) : '[]';
    const data = {
      id, arquivos,
      origem: req.body.origem || '', canal: req.body.canal || '',
      formato_entrada: req.body.formato_entrada || null,
      entrada_bruta: req.body.entrada_bruta || '',
      cliente: req.body.cliente || null, contato: req.body.contato || null,
      cnpj: req.body.cnpj || null, segmento: req.body.segmento || null,
      cidade: req.body.cidade || null, resumo: req.body.resumo || '',
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
      tipo: req.body.tipo || 'tarefa', destino: req.body.destino || '',
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

    if (!data.entrada_bruta || !data.resumo || !data.proxima_acao || !data.responsavel || !data.tipo || !data.destino) {
      return res.status(400).json({ error: 'Campos obrigatórios: entrada_bruta, resumo, proxima_acao, responsavel, tipo, destino' });
    }

    stmts.create.run(data);
    const created = stmts.getById.get(id);
    created.checkpoints = created.checkpoints ? JSON.parse(created.checkpoints) : [];
    created.arquivos = created.arquivos ? JSON.parse(created.arquivos) : [];
    created.precisa_aprovacao_toni = !!created.precisa_aprovacao_toni;
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
    if (q) rows = stmts.search.all({ q: `%${q}%` });
    else if (status) rows = stmts.filterByStatus.all(status);
    else if (categoria) rows = stmts.filterByCategoria.all(categoria);
    else rows = stmts.getAll.all();

    rows = rows.map(r => ({
      ...r,
      checkpoints: r.checkpoints ? JSON.parse(r.checkpoints) : [],
      arquivos: r.arquivos ? JSON.parse(r.arquivos) : [],
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
    row.arquivos = row.arquivos ? JSON.parse(row.arquivos) : [];
    row.precisa_aprovacao_toni = !!row.precisa_aprovacao_toni;
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/rcas/:id — Update
app.put('/api/rcas/:id', (req, res) => {
  try {
    const existing = stmts.getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'RCA não encontrado' });
    const g = (key, fallback) => req.body[key] !== undefined ? req.body[key] : existing[key];
    const data = {
      id: req.params.id,
      origem: g('origem'), canal: g('canal'), formato_entrada: g('formato_entrada'),
      entrada_bruta: g('entrada_bruta'), cliente: g('cliente'), contato: g('contato'),
      cnpj: g('cnpj'), segmento: g('segmento'), cidade: g('cidade'), resumo: g('resumo'),
      categoria: g('categoria'), produto_citado: g('produto_citado'), representada: g('representada'),
      status: g('status'), pendencia: g('pendencia'), bloqueio_atual: g('bloqueio_atual'),
      proxima_acao: g('proxima_acao'), responsavel: g('responsavel'), prazo: g('prazo'),
      sensibilidade: g('sensibilidade'), urgencia: g('urgencia'),
      precisa_aprovacao_toni: req.body.precisa_aprovacao_toni !== undefined ? (req.body.precisa_aprovacao_toni ? 1 : 0) : existing.precisa_aprovacao_toni,
      tipo: g('tipo'), destino: g('destino'), observacao: g('observacao'),
      checkpoints: req.body.checkpoints ? JSON.stringify(req.body.checkpoints) : existing.checkpoints,
      caso_relacionado_id: g('caso_relacionado_id'), cadeia_responsabilidade: g('cadeia_responsabilidade'),
      historico_linha_tempo: g('historico_linha_tempo'), prazo_critico_cliente: g('prazo_critico_cliente'),
      prazo_maximo_parceiro: g('prazo_maximo_parceiro'), financeiro_acerto_pendente: g('financeiro_acerto_pendente'),
      dependencia_externa: g('dependencia_externa'),
      arquivos: req.body.arquivos ? JSON.stringify(req.body.arquivos) : existing.arquivos,
    };
    stmts.update.run(data);
    const updated = stmts.getById.get(req.params.id);
    updated.checkpoints = updated.checkpoints ? JSON.parse(updated.checkpoints) : [];
    updated.arquivos = updated.arquivos ? JSON.parse(updated.arquivos) : [];
    updated.precisa_aprovacao_toni = !!updated.precisa_aprovacao_toni;
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/rcas/:id — Soft delete
app.delete('/api/rcas/:id', (req, res) => {
  try {
    const existing = stmts.getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'RCA não encontrado' });
    stmts.softDelete.run(req.params.id);
    res.json({ message: 'RCA arquivado', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================================================================
// File Upload
// ===================================================================

// POST /api/upload — Upload single file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({
    filename: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// POST /api/upload/multiple — Upload multiple files
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const files = req.files.map(f => ({
    filename: f.originalname, path: `/uploads/${f.filename}`, mimetype: f.mimetype, size: f.size,
  }));
  res.json(files);
});

// ===================================================================
// Client Base
// ===================================================================

// GET /api/clientes — Search/autocomplete
app.get('/api/clientes', (req, res) => {
  try {
    const q = req.query.q || '';
    const rows = stmts.searchClientes.all({ q: `%${q}%` });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/clientes/:id — Get single client
app.get('/api/clientes/:id', (req, res) => {
  try {
    const row = stmts.getClienteById.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/clientes/import — Import from MERCOS spreadsheet
app.post('/api/clientes/import', (req, res) => {
  try {
    const filepath = req.body.filepath;
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(400).json({
        error: 'Arquivo não encontrado',
        hint: 'Informe o caminho completo da planilha MERCOS. Ex: /home/arco/Empresas/REPLINK/REPLINK-CONTROL/context/arco/Arquivo Arco/Carteira detalhada de clientes.xlsx'
      });
    }
    const result = importFromMercos(filepath);
    const total = stmts.countClientes.get().total;
    res.json({ ...result, totalBase: total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/clientes/stats — Client base stats
app.get('/api/clientes/stats', (req, res) => {
  try {
    const total = stmts.countClientes.get().total;
    res.json({ total, origem: 'MERCOS' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================================================================
// Stats
// ===================================================================

app.get('/api/stats', (req, res) => {
  try {
    const byStatus = stmts.stats.all();
    const totalRCAs = stmts.getAll.all().length;
    const totalClientes = stmts.countClientes.get().total;
    res.json({ totalRCAs, totalClientes, byStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================================================================
// Start
// ===================================================================
app.listen(PORT, () => {
  console.log(`Biu CRUD rodando em http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/rcas`);
  console.log(`Clientes: http://localhost:${PORT}/api/clientes`);
});
