// biu/database.js
// SQLite setup and schema for RCA (Registro Comercial Assistido)
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'biu.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create RCA table
db.exec(`
  CREATE TABLE IF NOT EXISTS rcas (
    id TEXT PRIMARY KEY,
    data_criacao TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    data_atualizacao TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    origem TEXT NOT NULL,
    canal TEXT NOT NULL,
    formato_entrada TEXT,
    entrada_bruta TEXT NOT NULL,
    cliente TEXT,
    contato TEXT,
    cnpj TEXT,
    segmento TEXT,
    cidade TEXT,
    resumo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    produto_citado TEXT,
    representada TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho',
    pendencia TEXT,
    bloqueio_atual TEXT,
    proxima_acao TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    prazo TEXT,
    sensibilidade TEXT NOT NULL DEFAULT 'media',
    urgencia TEXT NOT NULL DEFAULT 'media',
    precisa_aprovacao_toni INTEGER NOT NULL DEFAULT 0,
    tipo TEXT NOT NULL,
    destino TEXT NOT NULL,
    observacao TEXT,
    checkpoints TEXT,
    caso_relacionado_id TEXT,
    cadeia_responsabilidade TEXT,
    historico_linha_tempo TEXT,
    prazo_critico_cliente TEXT,
    prazo_maximo_parceiro TEXT,
    financeiro_acerto_pendente TEXT,
    dependencia_externa TEXT,
    arquivos TEXT DEFAULT '[]',
    deleted INTEGER NOT NULL DEFAULT 0
  );
`);

// Create clientes table
db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT,
    segmento TEXT,
    cidade TEXT,
    contato TEXT,
    telefone TEXT,
    status TEXT DEFAULT 'ativo',
    origem TEXT DEFAULT 'MERCOS',
    data_importacao TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(cnpj, nome)
  );
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_rcas_status ON rcas(status);
  CREATE INDEX IF NOT EXISTS idx_rcas_categoria ON rcas(categoria);
  CREATE INDEX IF NOT EXISTS idx_rcas_data ON rcas(data_criacao);
  CREATE INDEX IF NOT EXISTS idx_rcas_cliente ON rcas(cliente);
  CREATE INDEX IF NOT EXISTS idx_rcas_deleted ON rcas(deleted);
  CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
  CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON clientes(cidade);
`);

const stmts = {
  create: db.prepare(`
    INSERT INTO rcas (id, origem, canal, formato_entrada, entrada_bruta, cliente, contato, cnpj,
      segmento, cidade, resumo, categoria, produto_citado, representada, status, pendencia,
      bloqueio_atual, proxima_acao, responsavel, prazo, sensibilidade, urgencia,
      precisa_aprovacao_toni, tipo, destino, observacao, checkpoints, caso_relacionado_id,
      cadeia_responsabilidade, historico_linha_tempo, prazo_critico_cliente,
      prazo_maximo_parceiro, financeiro_acerto_pendente, dependencia_externa, arquivos)
    VALUES (@id, @origem, @canal, @formato_entrada, @entrada_bruta, @cliente, @contato, @cnpj,
      @segmento, @cidade, @resumo, @categoria, @produto_citado, @representada, @status, @pendencia,
      @bloqueio_atual, @proxima_acao, @responsavel, @prazo, @sensibilidade, @urgencia,
      @precisa_aprovacao_toni, @tipo, @destino, @observacao, @checkpoints, @caso_relacionado_id,
      @cadeia_responsabilidade, @historico_linha_tempo, @prazo_critico_cliente,
      @prazo_maximo_parceiro, @financeiro_acerto_pendente, @dependencia_externa, @arquivos)
  `),

  getAll: db.prepare('SELECT * FROM rcas WHERE deleted = 0 ORDER BY data_criacao DESC'),

  getById: db.prepare('SELECT * FROM rcas WHERE id = ? AND deleted = 0'),

  search: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0
    AND (cliente LIKE @q OR resumo LIKE @q OR observacao LIKE @q OR entrada_bruta LIKE @q)
    ORDER BY data_criacao DESC
  `),

  filterByStatus: db.prepare('SELECT * FROM rcas WHERE deleted = 0 AND status = ? ORDER BY data_criacao DESC'),

  filterByCategoria: db.prepare('SELECT * FROM rcas WHERE deleted = 0 AND categoria = ? ORDER BY data_criacao DESC'),

  update: db.prepare(`
    UPDATE rcas SET
      data_atualizacao = datetime('now','localtime'),
      origem = @origem, canal = @canal, formato_entrada = @formato_entrada,
      entrada_bruta = @entrada_bruta, cliente = @cliente, contato = @contato,
      cnpj = @cnpj, segmento = @segmento, cidade = @cidade, resumo = @resumo,
      categoria = @categoria, produto_citado = @produto_citado, representada = @representada,
      status = @status, pendencia = @pendencia, bloqueio_atual = @bloqueio_atual,
      proxima_acao = @proxima_acao, responsavel = @responsavel, prazo = @prazo,
      sensibilidade = @sensibilidade, urgencia = @urgencia,
      precisa_aprovacao_toni = @precisa_aprovacao_toni, tipo = @tipo, destino = @destino,
      observacao = @observacao, checkpoints = @checkpoints,
      caso_relacionado_id = @caso_relacionado_id, cadeia_responsabilidade = @cadeia_responsabilidade,
      historico_linha_tempo = @historico_linha_tempo, prazo_critico_cliente = @prazo_critico_cliente,
      prazo_maximo_parceiro = @prazo_maximo_parceiro,
      financeiro_acerto_pendente = @financeiro_acerto_pendente,
      dependencia_externa = @dependencia_externa,
      arquivos = @arquivos
    WHERE id = @id AND deleted = 0
  `),

  softDelete: db.prepare("UPDATE rcas SET deleted = 1, data_atualizacao = datetime('now','localtime') WHERE id = ?"),

  stats: db.prepare(`
    SELECT status, COUNT(*) as count FROM rcas WHERE deleted = 0 GROUP BY status
  `),

  // Client statements
  searchClientes: db.prepare(`
    SELECT * FROM clientes WHERE nome LIKE @q OR cidade LIKE @q OR cnpj LIKE @q
    ORDER BY nome LIMIT 20
  `),

  getClienteById: db.prepare('SELECT * FROM clientes WHERE id = ?'),

  countClientes: db.prepare('SELECT COUNT(*) as total FROM clientes'),

  // Dashboard queries
  _dbPendentes: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND status NOT IN ('registrado','descartado')
    ORDER BY CASE urgencia WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END, data_criacao DESC LIMIT 20
  `),

  _dbCriticos: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND (urgencia = 'alta' OR sensibilidade = 'alta')
    AND status NOT IN ('registrado','descartado')
    ORDER BY data_criacao DESC LIMIT 10
  `),

  _dbHoje: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND prazo = date('now','localtime')
    AND status NOT IN ('registrado','descartado')
    ORDER BY urgencia DESC
  `),

  _dbBloqueados: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND bloqueio_atual IS NOT NULL AND bloqueio_atual != ''
    AND status NOT IN ('registrado','descartado')
    ORDER BY data_criacao DESC LIMIT 10
  `),

  _dbDemandasTecnicas: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND tipo = 'demanda_tecnica'
    AND status NOT IN ('registrado','descartado')
    ORDER BY data_criacao DESC
  `),

  _dbDecisoes: db.prepare(`
    SELECT * FROM rcas WHERE deleted = 0 AND (tipo = 'decisao' OR precisa_aprovacao_toni = 1)
    AND status NOT IN ('registrado','descartado')
    ORDER BY data_criacao DESC
  `),

  upsertCliente: db.prepare(`
    INSERT INTO clientes (nome, cnpj, segmento, cidade, contato, telefone, status)
    VALUES (@nome, @cnpj, @segmento, @cidade, @contato, @telefone, 'ativo')
    ON CONFLICT DO NOTHING
  `),
};

// ===================================================================
// MERCOS import
// ===================================================================
function importFromMercos(filepath) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filepath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // MERCOS "Carteira detalhada de clientes" format:
  // Row 7 = headers: [Razão Social, Nome fantasia, CNPJ/CPF, IE, Email, Telefone, Cidade, UF, ..., Segmento]
  // Data starts at row 8
  const headers = rows[7];
  if (!headers) return { imported: 0, total: 0, error: 'Header row (7) not found' };

  const colIndex = {};
  headers.forEach((h, i) => { if (h) colIndex[h.trim()] = i; });

  let imported = 0;
  const insert = db.prepare(`
    INSERT OR IGNORE INTO clientes (nome, cnpj, segmento, cidade, contato, telefone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (let i = 8; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.length) continue;

      const nome     = (r[colIndex['Nome fantasia']] || '').toString().trim();
      const cnpj     = (r[colIndex['CNPJ/CPF']] || '').toString().trim();
      const segmento = (r[colIndex['Segmento']] || '').toString().trim();
      const cidade   = (r[colIndex['Cidade']] || '').toString().trim();
      const uf       = (r[colIndex['Estado']] || '').toString().trim();
      const email    = (r[colIndex['E-mail']] || '').toString().trim();
      const telefone = (r[colIndex['Telefone']] || '').toString().trim();

      if (nome) {
        const cidadeFull = uf ? `${cidade}/${uf}` : cidade;
        const contato = email || '';
        insert.run(nome, cnpj, segmento, cidadeFull, contato, telefone);
        imported++;
      }
    }
  });

  tx();
  return { imported, total: rows.length - 8, headers: headers.filter(h => h) };
}

// ===================================================================
// Auto-load MERCOS on startup
// ===================================================================
function autoLoadMercos(mercospath) {
  const fs = require('fs');
  const path = require('path');
  if (!mercospath || !fs.existsSync(mercospath)) {
    console.log('[biu] MERCOS path not found:', mercospath);
    return { loaded: false, reason: 'path not found' };
  }
  // Skip if already have clients (avoid duplicates on restart)
  const existing = db.prepare('SELECT COUNT(*) as c FROM clientes').get();
  if (existing.c > 0) {
    console.log(`[biu] Base já possui ${existing.c} clientes — pulando auto-load`);
    return { loaded: true, path: mercospath, skipped: true, existing: existing.c };
  }
  const files = fs.readdirSync(mercospath).filter(f => /\.xlsx?$/i.test(f));
  const results = [];
  for (const file of files) {
    const filepath = path.join(mercospath, file);
    try {
      const r = importFromMercos(filepath);
      results.push({ file, ...r });
    } catch (e) {
      results.push({ file, error: e.message });
    }
  }
  return { loaded: true, path: mercospath, files: results };
}

module.exports = { db, stmts, importFromMercos, autoLoadMercos };
