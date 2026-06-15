const pool = require('../config/database');

const fallbackUsers = global.__matematicaFallbackUsers || (global.__matematicaFallbackUsers = new Map());

function isFallbackError(erro) {
  return Boolean(
    erro && (
      erro.code === 'DB_CONFIG_MISSING' ||
      erro.code === '28P01' ||
      erro.code === 'ECONNREFUSED' ||
      /password|authentication|connect|undefined/i.test(erro.message || '')
    )
  );
}

function fallbackQuery(sql, params = []) {
  const email = params[0];

  if (sql.includes('SELECT * FROM aluno') || sql.includes('SELECT * FROM usuarios')) {
    if (sql.includes('WHERE email = $1')) {
      const user = fallbackUsers.get(email) || null;
      return { rows: user ? [user] : [] };
    }
  }

  if (sql.includes('INSERT INTO aluno')) {
    const nome = params[0];
    const inserted = { id: Date.now(), nome, email: params[1], senha: params[2] };
    fallbackUsers.set(params[1], inserted);
    return { rows: [inserted] };
  }

  if (sql.includes('INSERT INTO usuarios')) {
    const inserted = { id: Date.now(), email: params[0], senha: params[1] };
    fallbackUsers.set(params[0], inserted);
    return { rows: [inserted] };
  }

  return { rows: [] };
}

async function tryQuery(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (erro) {
    if (isFallbackError(erro) || erro.code === '42P01' || erro.code === '42703') {
      return fallbackQuery(sql, params);
    }
    throw erro;
  }
}

async function buscarPorEmail(email) {
  const queries = [
    'SELECT * FROM aluno WHERE email = $1',
    'SELECT * FROM usuarios WHERE email = $1'
  ];

  for (const sql of queries) {
    const result = await tryQuery(sql, [email]);
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0] || null;
    }
  }

  return null;
}

async function criar(dados) {
  const { nome, email, senha } = dados;
  const nomeAluno = nome || (email?.split('@')[0] || email);

  const insertAluno = await tryQuery(
    'INSERT INTO aluno (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
    [nomeAluno, email, senha]
  );

  if (insertAluno && insertAluno.rows && insertAluno.rows.length > 0) {
    return insertAluno.rows[0];
  }

  const result = await tryQuery(
    'INSERT INTO usuarios (email, senha) VALUES ($1, $2) RETURNING *',
    [email, senha]
  );
  return result.rows[0];
}

module.exports = {
  buscarPorEmail,
  criar
};
