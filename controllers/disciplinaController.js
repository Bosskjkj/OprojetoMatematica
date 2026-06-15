const DisciplinaModel = require('../models/disciplinaModel');

async function listarTodas(req, res) {
  try {
    const disciplinas = await DisciplinaModel.listarTodas();
    res.status(200).json(disciplinas);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao listar disciplinas', erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const disciplina = await DisciplinaModel.buscarPorId(id);
    if (disciplina) {
      res.status(200).json(disciplina);
    } else {
      res.status(404).json({ mensagem: `Disciplina ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao buscar disciplina', erro: erro.message });
  }
}

async function criar(req, res) {
  try {
    const { nome, descricao, icone } = req.body;
    if (!nome) {
      return res.status(400).json({ mensagem: 'Nome da disciplina é obrigatório' });
    }
    const novaDisciplina = await DisciplinaModel.criar({ nome, descricao, icone });
    res.status(201).json(novaDisciplina);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao criar disciplina', erro: erro.message });
  }
}

async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { nome, descricao, icone } = req.body;
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const disciplinaAtualizada = await DisciplinaModel.atualizar(id, { nome, descricao, icone });
    if (disciplinaAtualizada) {
      res.status(200).json(disciplinaAtualizada);
    } else {
      res.status(404).json({ mensagem: `Disciplina ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao atualizar disciplina', erro: erro.message });
  }
}

async function deletar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const deletado = await DisciplinaModel.deletar(id);
    if (deletado) {
      res.status(200).json({ mensagem: `Disciplina ${id} removida com sucesso` });
    } else {
      res.status(404).json({ mensagem: `Disciplina ${id} não encontrada` });
    }
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao deletar disciplina', erro: erro.message });
  }
}

module.exports = {
  listarTodas,
  buscarPorId,
  criar,
  atualizar,
  deletar
};
