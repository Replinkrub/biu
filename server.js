// biu/server.js — v3: Auto-load MERCOS + CRM Dashboard + Output routing
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stmts, importFromMercos, autoLoadMercos } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// MERCOS auto-load path
const MERCOS_PATH = process.env.MERCOS_PATH ||
  '/home/arco/Empresas/REPLINK/REPLINK-CONTROL/context/arco/Arquivo Arco';

// Ensure upload dir
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /\.(jpg|jpeg|png|gif|webp|mp3|wav|ogg|mp4|webm|pdf|txt|csv)$/i.test(path.extname(file.originalname)));
  }
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// ===================================================================
// RCA CRUD (same as before, compacted)
// ===================================================================

function parseRCA(r) {
  return {
    ...r,
    checkpoints: r.checkpoints ? JSON.parse(r.checkpoints) : [],
    arquivos: r.arquivos ? JSON.parse(r.arquivos) : [],
    precisa_aprovacao_toni: !!r.precisa_aprovacao_toni,
  };
}

app.post('/api/rcas', (req, res) => {
  try {
    const id = uuidv4();
    const b = req.body;
    const data = {
      id,
      arquivos: b.arquivos ? JSON.stringify(b.arquivos) : '[]',
      origem: b.origem||'', canal: b.canal||'', formato_entrada: b.formato_entrada||null,
      entrada_bruta: b.entrada_bruta||'', cliente: b.cliente||null, contato: b.contato||null,
      cnpj: b.cnpj||null, segmento: b.segmento||null, cidade: b.cidade||null,
      resumo: b.resumo||'', categoria: b.categoria||'atendimento',
      produto_citado: b.produto_citado||null, representada: b.representada||null,
      status: b.status||'rascunho', pendencia: b.pendencia||null,
      bloqueio_atual: b.bloqueio_atual||null, proxima_acao: b.proxima_acao||'',
      responsavel: b.responsavel||'', prazo: b.prazo||null,
      sensibilidade: b.sensibilidade||'media', urgencia: b.urgencia||'media',
      precisa_aprovacao_toni: b.precisa_aprovacao_toni?1:0, tipo: b.tipo||'tarefa',
      destino: b.destino||'', observacao: b.observacao||null,
      checkpoints: b.checkpoints?JSON.stringify(b.checkpoints):null,
      caso_relacionado_id: b.caso_relacionado_id||null,
      cadeia_responsabilidade: b.cadeia_responsabilidade||null,
      historico_linha_tempo: b.historico_linha_tempo||null,
      prazo_critico_cliente: b.prazo_critico_cliente||null,
      prazo_maximo_parceiro: b.prazo_maximo_parceiro||null,
      financeiro_acerto_pendente: b.financeiro_acerto_pendente||null,
      dependencia_externa: b.dependencia_externa||null,
    };
    stmts.create.run(data);
    res.status(201).json(parseRCA(stmts.getById.get(id)));
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/rcas', (req, res) => {
  try {
    const {q, status, categoria} = req.query;
    let rows;
    if(q) rows = stmts.search.all({q:`%${q}%`});
    else if(status) rows = stmts.filterByStatus.all(status);
    else if(categoria) rows = stmts.filterByCategoria.all(categoria);
    else rows = stmts.getAll.all();
    res.json(rows.map(parseRCA));
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/rcas/:id', (req, res) => {
  try {
    const r = stmts.getById.get(req.params.id);
    if(!r) return res.status(404).json({error:'não encontrado'});
    res.json(parseRCA(r));
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/api/rcas/:id', (req, res) => {
  try {
    const ex = stmts.getById.get(req.params.id);
    if(!ex) return res.status(404).json({error:'não encontrado'});
    const g = (k,d) => req.body[k] !== undefined ? req.body[k] : ex[k];
    const data = {
      id: req.params.id,
      arquivos: req.body.arquivos ? JSON.stringify(req.body.arquivos) : ex.arquivos,
      origem:g('origem'), canal:g('canal'), formato_entrada:g('formato_entrada'),
      entrada_bruta:g('entrada_bruta'), cliente:g('cliente'), contato:g('contato'),
      cnpj:g('cnpj'), segmento:g('segmento'), cidade:g('cidade'), resumo:g('resumo'),
      categoria:g('categoria'), produto_citado:g('produto_citado'), representada:g('representada'),
      status:g('status'), pendencia:g('pendencia'), bloqueio_atual:g('bloqueio_atual'),
      proxima_acao:g('proxima_acao'), responsavel:g('responsavel'), prazo:g('prazo'),
      sensibilidade:g('sensibilidade'), urgencia:g('urgencia'),
      precisa_aprovacao_toni: req.body.precisa_aprovacao_toni !== undefined ? (req.body.precisa_aprovacao_toni?1:0) : ex.precisa_aprovacao_toni,
      tipo:g('tipo'), destino:g('destino'), observacao:g('observacao'),
      checkpoints: req.body.checkpoints?JSON.stringify(req.body.checkpoints):ex.checkpoints,
      caso_relacionado_id:g('caso_relacionado_id'), cadeia_responsabilidade:g('cadeia_responsabilidade'),
      historico_linha_tempo:g('historico_linha_tempo'), prazo_critico_cliente:g('prazo_critico_cliente'),
      prazo_maximo_parceiro:g('prazo_maximo_parceiro'), financeiro_acerto_pendente:g('financeiro_acerto_pendente'),
      dependencia_externa:g('dependencia_externa'),
    };
    stmts.update.run(data);
    res.json(parseRCA(stmts.getById.get(req.params.id)));
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/rcas/:id', (req, res) => {
  try {
    if(!stmts.getById.get(req.params.id)) return res.status(404).json({error:'não encontrado'});
    stmts.softDelete.run(req.params.id);
    res.json({message:'arquivado',id:req.params.id});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ===================================================================
// Upload
// ===================================================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({error:'sem arquivo'});
  res.json({filename:req.file.originalname, path:`/uploads/${req.file.filename}`, mimetype:req.file.mimetype, size:req.file.size});
});

app.post('/api/upload/multiple', upload.array('files',10), (req, res) => {
  if(!req.files?.length) return res.status(400).json({error:'sem arquivos'});
  res.json(req.files.map(f=>({filename:f.originalname, path:`/uploads/${f.filename}`, mimetype:f.mimetype, size:f.size})));
});

// ===================================================================
// Client Base (auto-loaded, search-only)
// ===================================================================
app.get('/api/clientes', (req, res) => {
  try {
    const q = req.query.q || '';
    res.json(stmts.searchClientes.all({ q: `%${q}%` }));
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/clientes/:id', (req, res) => {
  try {
    const r = stmts.getClienteById.get(req.params.id);
    if(!r) return res.status(404).json({error:'não encontrado'});
    res.json(r);
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ===================================================================
// CRM Dashboard (what needs to be done)
// ===================================================================

// GET /api/dashboard — Priorities, deadlines, blocking items
app.get('/api/dashboard', (req, res) => {
  try {
    const pendentes = stmts._dbPendentes ? stmts._dbPendentes.all() : [];
    const criticos = stmts._dbCriticos ? stmts._dbCriticos.all() : [];
    const hoje = stmts._dbHoje ? stmts._dbHoje.all() : [];
    const bloqueados = stmts._dbBloqueados ? stmts._dbBloqueados.all() : [];
    res.json({
      pendentes: pendentes.map(parseRCA),
      criticos: criticos.map(parseRCA),
      hoje: hoje.map(parseRCA),
      bloqueados: bloqueados.map(parseRCA),
      totalRCAs: stmts.getAll.all().length,
      totalClientes: stmts.countClientes.get().total,
    });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// GET /api/output — Items destined for cockpit/action
app.get('/api/output', (req, res) => {
  try {
    const demandasTecnicas = stmts._dbDemandasTecnicas ? stmts._dbDemandasTecnicas.all() : [];
    const decisoes = stmts._dbDecisoes ? stmts._dbDecisoes.all() : [];
    res.json({
      demandas_tecnicas: demandasTecnicas.map(parseRCA),
      decisoes: decisoes.map(parseRCA),
    });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  try {
    const byStatus = stmts.stats.all();
    const totalRCAs = stmts.getAll.all().length;
    const totalClientes = stmts.countClientes.get().total;
    res.json({ totalRCAs, totalClientes, byStatus });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ===================================================================
// Start with auto-load
// ===================================================================
app.listen(PORT, () => {
  console.log(`Biu rodando em http://localhost:${PORT}`);

  // Auto-load MERCOS clientes on startup
  const result = autoLoadMercos(MERCOS_PATH);
  if (result.loaded) {
    if (result.skipped) {
      console.log(`[biu] MERCOS auto-load: pulado — ${result.existing} clientes já na base`);
    } else if (result.files) {
      const total = result.files.reduce((s,f) => s + (f.imported||0), 0);
      console.log(`[biu] MERCOS auto-load: ${result.files.length} arquivos, ${total} clientes importados`);
      result.files.forEach(f => console.log(`  ${f.file}: ${f.imported||f.error||0}`));
    }
  } else {
    console.log(`[biu] MERCOS path não encontrado: ${MERCOS_PATH}`);
  }

  const c = stmts.countClientes.get().total;
  console.log(`[biu] Base: ${c} clientes | API: http://localhost:${PORT}/api/dashboard`);
});
