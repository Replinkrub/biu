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
    deleted INTEGER NOT NULL DEFAULT 0
  );
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_rcas_status ON rcas(status);
  CREATE INDEX IF NOT EXISTS idx_rcas_categoria ON rcas(categoria);
  CREATE INDEX IF NOT EXISTS idx_rcas_data ON rcas(data_criacao);
  CREATE INDEX IF NOT EXISTS idx_rcas_cliente ON rcas(cliente);
  CREATE INDEX IF NOT EXISTS idx_rcas_deleted ON rcas(deleted);
`);

const stmts = {
  create: db.prepare(`
    INSERT INTO rcas (id, origem, canal, formato_entrada, entrada_bruta, cliente, contato, cnpj,
      segmento, cidade, resumo, categoria, produto_citado, representada, status, pendencia,
      bloqueio_atual, proxima_acao, responsavel, prazo, sensibilidade, urgencia,
      precisa_aprovacao_toni, tipo, destino, observacao, checkpoints, caso_relacionado_id,
      cadeia_responsabilidade, historico_linha_tempo, prazo_critico_cliente,
      prazo_maximo_parceiro, financeiro_acerto_pendente, dependencia_externa)
    VALUES (@id, @origem, @canal, @formato_entrada, @entrada_bruta, @cliente, @contato, @cnpj,
      @segmento, @cidade, @resumo, @categoria, @produto_citado, @representada, @status, @pendencia,
      @bloqueio_atual, @proxima_acao, @responsavel, @prazo, @sensibilidade, @urgencia,
      @precisa_aprovacao_toni, @tipo, @destino, @observacao, @checkpoints, @caso_relacionado_id,
      @cadeia_responsabilidade, @historico_linha_tempo, @prazo_critico_cliente,
      @prazo_maximo_parceiro, @financeiro_acerto_pendente, @dependencia_externa)
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
      dependencia_externa = @dependencia_externa
    WHERE id = @id AND deleted = 0
  `),

  softDelete: db.prepare("UPDATE rcas SET deleted = 1, data_atualizacao = datetime('now','localtime') WHERE id = ?"),

  stats: db.prepare(`
    SELECT status, COUNT(*) as count FROM rcas WHERE deleted = 0 GROUP BY status
  `),
};

module.exports = { db, stmts };
