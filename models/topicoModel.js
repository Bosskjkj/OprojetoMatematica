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

async function listarPorDisciplina(disciplina_id) {
  const queryTopico = await tryQuery(
    'SELECT idt AS id, nome, descricao FROM topico WHERE disciplina_id = $1 ORDER BY nome',
    [disciplina_id]
  );
  if (queryTopico) return queryTopico.rows;

  const queryTopicoAll = await tryQuery(
    'SELECT idt AS id, nome, descricao FROM topico ORDER BY nome'
  );
  if (queryTopicoAll) return queryTopicoAll.rows;

  const queryTopicos = await tryQuery(
    'SELECT id, nome, descricao FROM topicos WHERE disciplina_id = $1 ORDER BY nome',
    [disciplina_id]
  );
  if (queryTopicos) return queryTopicos.rows;

  const queryTopicosAll = await tryQuery(
    'SELECT id, nome, descricao FROM topicos ORDER BY nome'
  );
  return queryTopicosAll ? queryTopicosAll.rows : [];
}

async function listarTodos() {
  const queryTopicoAll = await tryQuery(
    'SELECT idt AS id, nome, descricao FROM topico ORDER BY nome'
  );
  if (queryTopicoAll) return queryTopicoAll.rows;

  const queryTopicosAll = await tryQuery(
    'SELECT id, nome, descricao FROM topicos ORDER BY nome'
  );
  return queryTopicosAll ? queryTopicosAll.rows : [];
}

async function buscarPorId(id) {
  const queryTopico = await tryQuery('SELECT idt AS id, nome, descricao FROM topico WHERE idt = $1', [id]);
  if (queryTopico) return queryTopico.rows[0] || null;

  const queryTopicos = await tryQuery('SELECT id, nome, descricao FROM topicos WHERE id = $1', [id]);
  return queryTopicos ? queryTopicos.rows[0] || null : null;
}

async function criar(dados) {
  const { disciplina_id, nome, descricao } = dados;
  const insertTopico = await tryQuery(
    'INSERT INTO topico (disciplina_id, nome, descricao) VALUES ($1, $2, $3) RETURNING idt AS id, nome, descricao',
    [disciplina_id, nome, descricao]
  );
  if (insertTopico) return insertTopico.rows[0];

  const result = await pool.query(
    'INSERT INTO topicos (disciplina_id, nome, descricao) VALUES ($1, $2, $3) RETURNING *',
    [disciplina_id, nome, descricao]
  );
  return result.rows[0];
}

async function atualizar(id, dados) {
  const { nome, descricao } = dados;
  const updateTopico = await tryQuery(
    'UPDATE topico SET nome = $1, descricao = $2 WHERE idt = $3 RETURNING idt AS id, nome, descricao',
    [nome, descricao, id]
  );
  if (updateTopico) return updateTopico.rows[0] || null;

  const result = await pool.query(
    'UPDATE topicos SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
    [nome, descricao, id]
  );
  return result.rows[0] || null;
}

async function deletar(id) {
  const deleteTopico = await tryQuery('DELETE FROM topico WHERE idt = $1', [id]);
  if (deleteTopico) return deleteTopico.rowCount > 0;

  const result = await pool.query('DELETE FROM topicos WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  listarPorDisciplina,
  buscarPorId,
  criar,
  atualizar,
  deletar
};
