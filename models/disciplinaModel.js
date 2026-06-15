const pool = require('../config/database');

async function tryQuery(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (erro) {
    if (erro.code === '42P01' || erro.code === '42703') {
      return null;
    }
    throw erro;
  }
}

async function listarTodas() {
  const result = await tryQuery('SELECT * FROM disciplinas ORDER BY nome');
  if (result && result.rows.length > 0) {
    return result.rows;
  }

  const queryTopico = await tryQuery('SELECT idt AS id, nome, descricao FROM topico ORDER BY nome');
  if (queryTopico && queryTopico.rows.length > 0) {
    return queryTopico.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      descricao: row.descricao || '',
      icone: '📘'
    }));
  }

  const queryTopicos = await tryQuery('SELECT id, nome, descricao FROM topicos ORDER BY nome');
  if (queryTopicos) {
    return queryTopicos.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      descricao: row.descricao || '',
      icone: '📘'
    }));
  }

  return [];
}

async function buscarPorId(id) {
  const result = await pool.query('SELECT * FROM disciplinas WHERE id = $1', [id]);
  return result.rows[0];
}

async function criar(dados) {
  const { nome, descricao, icone } = dados;
  const sql = `
    INSERT INTO disciplinas (nome, descricao, icone)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(sql, [nome, descricao, icone]);
  return result.rows[0];
}

async function atualizar(id, dados) {
  const { nome, descricao, icone } = dados;
  const sql = `
    UPDATE disciplinas
    SET nome = $1, descricao = $2, icone = $3
    WHERE id = $4
    RETURNING *
  `;
  const result = await pool.query(sql, [nome, descricao, icone, id]);
  return result.rows[0] || null;
}

async function deletar(id) {
  const result = await pool.query('DELETE FROM disciplinas WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  listarTodas,
  buscarPorId,
  criar,
  atualizar,
  deletar
};
