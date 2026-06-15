const QuestaoModel = require('../models/questaoModel');

async function listarTodas(req, res) {
  try {
    const limite = Math.min(parseInt(req.query.limite, 10) || 30, 30);
    const questoes = await QuestaoModel.listarTodas(limite);
    res.status(200).json(questoes);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao listar questoes', erro: erro.message });
  }
}

async function listarPorTopico(req, res) {
  try {
    const topico_id = parseInt(req.params.topico_id);
    if (isNaN(topico_id)) {
      return res.status(400).json({ mensagem: 'ID de tópico inválido' });
    }
    const questoes = await QuestaoModel.listarPorTopico(topico_id);
    res.status(200).json(questoes);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao listar questões', erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const questao = await QuestaoModel.buscarPorId(id);
    if (questao) {
      res.status(200).json(questao);
    } else {
      res.status(404).json({ mensagem: `Questão ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao buscar questão', erro: erro.message });
  }
}

async function verificarResposta(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { resposta } = req.body;
    if (isNaN(id) || !resposta) {
      return res.status(400).json({ mensagem: 'ID e resposta são obrigatórios' });
    }
    const respostaCorreta = await QuestaoModel.buscarRespostaCorreta(id);
    const acertou = resposta.toUpperCase() === respostaCorreta;
    res.status(200).json({ acertou, resposta: respostaCorreta });
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao verificar resposta', erro: erro.message });
  }
}

async function criar(req, res) {
  try {
    const { topico_id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta } = req.body;
    if (!topico_id || !titulo || !enunciado || !opcao_a || !opcao_b || !opcao_c || !opcao_d || !resposta) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios faltando' });
    }
    const novaQuestao = await QuestaoModel.criar({ topico_id, titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta });
    res.status(201).json(novaQuestao);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao criar questão', erro: erro.message });
  }
}

async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta } = req.body;
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const questaoAtualizada = await QuestaoModel.atualizar(id, { titulo, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta });
    if (questaoAtualizada) {
      res.status(200).json(questaoAtualizada);
    } else {
      res.status(404).json({ mensagem: `Questão ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao atualizar questão', erro: erro.message });
  }
}

async function deletar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const deletado = await QuestaoModel.deletar(id);
    if (deletado) {
      res.status(200).json({ mensagem: `Questão ${id} removida com sucesso` });
    } else {
      res.status(404).json({ mensagem: `Questão ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao deletar questão', erro: erro.message });
  }
}

module.exports = {
  listarTodas,
  listarPorTopico,
  buscarPorId,
  verificarResposta,
  criar,
  atualizar,
  deletar
};
