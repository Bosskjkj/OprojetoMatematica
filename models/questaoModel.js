const pool = require('../config/database');

async function tryQuery(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (erro) {
    if (erro.code === '42P01' || erro.code === '42703' || erro.code === '42P10') {
      return null;
    }
    throw erro;
  }
}

async function listarTodas(limite = 30) {
  const queryQuestoes = await tryQuery(
    `SELECT
       q.id,
       q.topico_id,
       q.titulo,
       q.enunciado,
       q.opcao_a,
       q.opcao_b,
       q.opcao_c,
       q.opcao_d,
       q.opcao_e,
       q.resposta,
       t.nome AS topico
     FROM questoes q
     LEFT JOIN topicos t ON q.topico_id = t.id
     ORDER BY t.nome, q.id
     LIMIT $1`,
    [limite]
  );
  if (queryQuestoes && queryQuestoes.rows.length > 0) {
    return queryQuestoes.rows;
  }

  const queryQuestaoCompleta = await tryQuery(
    `SELECT
       q.idq AS id,
       q.enunciado,
       q.referencias,
       q.imagem,
       q.nivel_de_dificuldade AS nivel_de_dificuldade,
       q.vestibular AS vestibular_id,
       r.resposta_correta,
       r.explicacao,
       t.idt AS topico_id,
       t.nome AS topico,
       v.nome AS vestibular_nome,
       v.ano AS vestibular_ano
     FROM questao q
     LEFT JOIN resposta r ON q.idresposta = r.idr
     LEFT JOIN topico t ON q.idtopico = t.idt
     LEFT JOIN vestibular v ON q.vestibular = v.idv
     ORDER BY t.nome, q.idq
     LIMIT $1`,
    [limite]
  );
  if (queryQuestaoCompleta && queryQuestaoCompleta.rows.length > 0) {
    return queryQuestaoCompleta.rows;
  }

  const queryQuestaoSimples = await tryQuery(
    `SELECT
       q.idq AS id,
       q.enunciado,
       q.referencias,
       q.imagem,
       q.idtopico AS topico_id
     FROM questao q
     ORDER BY q.idq
     LIMIT $1`,
    [limite]
  );
  return queryQuestaoSimples ? queryQuestaoSimples.rows : [];
}

async function listarPorTopico(topico_id) {
  const queryQuestoes = await tryQuery(
    `SELECT
       q.id,
       q.topico_id,
       q.titulo,
       q.enunciado,
       q.opcao_a,
       q.opcao_b,
       q.opcao_c,
       q.opcao_d,
       q.opcao_e,
       q.resposta,
       t.nome AS topico
     FROM questoes q
     LEFT JOIN topicos t ON q.topico_id = t.id
     WHERE q.topico_id = $1
     ORDER BY q.id`,
    [topico_id]
  );
  if (queryQuestoes && queryQuestoes.rows.length > 0) {
    return queryQuestoes.rows;
  }

  const queryQuestaoCompleta = await tryQuery(
    `SELECT
       q.idq AS id,
       q.enunciado,
       q.referencias,
       q.imagem,
       q.nivel_de_dificuldade AS nivel_de_dificuldade,
       q.vestibular AS vestibular_id,
       r.resposta_correta,
       r.explicacao,
       t.idt AS topico_id,
       t.nome AS topico,
       v.nome AS vestibular_nome,
       v.ano AS vestibular_ano
     FROM questao q
     LEFT JOIN resposta r ON q.idresposta = r.idr
     LEFT JOIN topico t ON q.idtopico = t.idt
     LEFT JOIN vestibular v ON q.vestibular = v.idv
     WHERE q.idtopico = $1
     ORDER BY q.idq`,
    [topico_id]
  );

  if (queryQuestaoCompleta && queryQuestaoCompleta.rows.length > 0) {
    return queryQuestaoCompleta.rows;
  }

  const queryQuestaoSimples = await tryQuery(
    `SELECT
       q.idq AS id,
       q.enunciado,
       q.referencias,
       q.imagem,
       q.idtopico AS topico_id
     FROM questao q
     WHERE q.idtopico = $1
     ORDER BY q.idq`,
    [topico_id]
  );
  return queryQuestaoSimples ? queryQuestaoSimples.rows : [];
}

async function buscarPorId(id) {
  const queryQuestao = await tryQuery(
    `SELECT
       q.idq AS id,
       q.enunciado,
       q.referencias,
       q.imagem,
       q.nivel_de_dificuldade AS nivel_de_dificuldade,
       q.vestibular AS vestibular_id,
       r.resposta_correta,
       r.explicacao,
       t.nome AS topico,
       v.nome AS vestibular_nome,
       v.ano AS vestibular_ano
     FROM questao q
     LEFT JOIN resposta r ON q.idresposta = r.idr
     LEFT JOIN topico t ON q.idtopico = t.idt
     LEFT JOIN vestibular v ON q.vestibular = v.idv
     WHERE q.idq = $1`,
    [id]
  );

  if (queryQuestao && queryQuestao.rows.length > 0) {
    return queryQuestao.rows[0] || null;
  }

  const queryQuestoes = await tryQuery(
    'SELECT id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e FROM questoes WHERE id = $1',
    [id]
  );
  return queryQuestoes ? queryQuestoes.rows[0] : null;
}

async function buscarRespostaCorreta(id) {
  const queryResposta = await tryQuery(
    `SELECT r.resposta_correta AS resposta
     FROM questao q
     LEFT JOIN resposta r ON q.idresposta = r.idr
     WHERE q.idq = $1`,
    [id]
  );

  if (queryResposta && queryResposta.rows[0]) {
    return queryResposta.rows[0].resposta;
  }

  const queryQuestoes = await tryQuery('SELECT resposta FROM questoes WHERE id = $1', [id]);
  return queryQuestoes ? queryQuestoes.rows[0]?.resposta || null : null;
}

async function criar(dados) {
  const { topico_id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta } = dados;
  const queryQuestoes = await tryQuery(
    `INSERT INTO questoes (topico_id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [topico_id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta]
  );
  if (queryQuestoes) {
    return queryQuestoes.rows[0];
  }

  const queryQuestao = await tryQuery(
    `INSERT INTO questao (idtopico, enunciado, referencias, vestibular)
     VALUES ($1, $2, $3, $4)
     RETURNING idq AS id, enunciado, referencias, vestibular`,
    [topico_id, enunciado, '', null]
  );
  return queryQuestao ? queryQuestao.rows[0] : null;
}

async function atualizar(id, dados) {
  const { titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta } = dados;
  const queryQuestoes = await tryQuery(
    `UPDATE questoes
     SET titulo = $1, enunciado = $2, opcao_a = $3, opcao_b = $4, opcao_c = $5, opcao_d = $6, opcao_e = $7, resposta = $8
     WHERE id = $9
     RETURNING *`,
    [titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta, id]
  );
  if (queryQuestoes) {
    return queryQuestoes.rows[0] || null;
  }

  return null;
}

async function deletar(id) {
  const result = await tryQuery('DELETE FROM questoes WHERE id = $1', [id]);
  if (result) {
    return result.rowCount > 0;
  }

  const resultQuestao = await tryQuery('DELETE FROM questao WHERE idq = $1', [id]);
  return resultQuestao ? resultQuestao.rowCount > 0 : false;
}

module.exports = {
  listarTodas,
  listarPorTopico,
  buscarPorId,
  buscarRespostaCorreta,
  criar,
  atualizar,
  deletar
};
