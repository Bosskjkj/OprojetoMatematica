// ============================================================
// CONFIGURAÇÃO DO BANCO DE DADOS PostgreSQL COM DOTENV
// ============================================================

// Importar dotenv e carregar variáveis do arquivo .env
require('dotenv').config();

// Importar o Pool do PostgreSQL
const { Pool } = require('pg');

// ============================================================
// CONFIGURAR O POOL DE CONEXÕES
// Agora usando variáveis de ambiente do arquivo .env
// ============================================================

const hasDbConfig = Boolean(
  process.env.DB_USER &&
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_PASSWORD &&
  process.env.DB_PORT
);

let pool;

if (hasDbConfig) {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  });
} else {
  pool = {
    async query() {
      const error = new Error('PostgreSQL não configurado. Configure o arquivo .env para usar o banco real.');
      error.code = 'DB_CONFIG_MISSING';
      throw error;
    },
    async connect() {
      const error = new Error('PostgreSQL não configurado. Configure o arquivo .env para usar o banco real.');
      error.code = 'DB_CONFIG_MISSING';
      throw error;
    },
  };
}

// ============================================================
// TESTAR CONEXÃO
// ============================================================

if (hasDbConfig) {
  pool.connect((erro, client, release) => {
    if (erro) {
      console.error('❌ Erro ao conectar ao PostgreSQL:', erro.message);
      console.error('💡 Verifique suas credenciais no arquivo .env');
    } else {
      console.log('✅ Conectado ao PostgreSQL!');
      console.log(`📊 Banco: ${process.env.DB_NAME}`);
      console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      release();
    }
  });
} else {
  console.warn('⚠️ Variáveis de banco não configuradas. O servidor iniciará, mas o PostgreSQL precisa ser configurado no arquivo .env.');
}

// ============================================================
// CRIAR TABELA AUTOMATICAMENTE
// ============================================================

const criarTabela = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS materiais (
      id          SERIAL PRIMARY KEY,
      titulo      VARCHAR(255)   NOT NULL,
      horas       DECIMAL(10,2)  NOT NULL,
      questoes    INTEGER        NOT NULL,
      disciplina  VARCHAR(100)   NOT NULL
    )
  `;
  
  try {
    await pool.query(sql);
    console.log('✅ Tabela materiais verificada/criada');
  } catch (erro) {
    console.error('❌ Erro ao criar tabela de materiais:', erro.message);
  }

  const sqlUsers = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id       SERIAL PRIMARY KEY,
      email    VARCHAR(255) UNIQUE NOT NULL,
      senha    TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(sqlUsers);
    console.log('✅ Tabela usuarios verificada/criada');
  } catch (erro) {
    console.error('❌ Erro ao criar tabela de usuários:', erro.message);
  }

  const sqlDisciplinas = `
    CREATE TABLE IF NOT EXISTS disciplinas (
      id       SERIAL PRIMARY KEY,
      nome     VARCHAR(255) UNIQUE NOT NULL,
      descricao TEXT,
      icone    VARCHAR(50)
    )
  `;

  try {
    await pool.query(sqlDisciplinas);
    console.log('✅ Tabela disciplinas verificada/criada');
  } catch (erro) {
    console.error('❌ Erro ao criar tabela de disciplinas:', erro.message);
  }

  const sqlTopicos = `
    CREATE TABLE IF NOT EXISTS topicos (
      id             SERIAL PRIMARY KEY,
      disciplina_id  INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
      nome           VARCHAR(255) NOT NULL,
      descricao      TEXT
    )
  `;

  try {
    await pool.query(sqlTopicos);
    console.log('✅ Tabela topicos verificada/criada');
  } catch (erro) {
    console.error('❌ Erro ao criar tabela de tópicos:', erro.message);
  }

  const sqlQuestoes = `
    CREATE TABLE IF NOT EXISTS questoes (
      id        SERIAL PRIMARY KEY,
      topico_id INTEGER NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
      titulo    VARCHAR(255) NOT NULL,
      enunciado TEXT NOT NULL,
      opcao_a   TEXT NOT NULL,
      opcao_b   TEXT NOT NULL,
      opcao_c   TEXT NOT NULL,
      opcao_d   TEXT NOT NULL,
      opcao_e   TEXT,
      resposta  VARCHAR(1) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(sqlQuestoes);
    console.log('✅ Tabela questoes verificada/criada');
  } catch (erro) {
    console.error('❌ Erro ao criar tabela de questões:', erro.message);
  }
};

if (hasDbConfig) {
  criarTabela();
}

// ============================================================
// CRIAR USUÁRIO PADRÃO DE TESTE
// ============================================================

const crypto = require('crypto');

function gerarHashPadrao(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

const criarUsuarioPadrao = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM usuarios');
    if (result.rows[0].count === 0) {
      const senhaHash = gerarHashPadrao('123456');
      await pool.query(
        'INSERT INTO usuarios (email, senha) VALUES ($1, $2)',
        ['teste@teste.com', senhaHash]
      );
      console.log('✅ Usuário padrão criado: teste@teste.com / 123456');
    }
  } catch (erro) {
    // Ignorar se já existe
  }
};

if (hasDbConfig) {
  criarUsuarioPadrao();
}

// ============================================================
// EXPORTAR O POOL
// ============================================================

module.exports = pool;
