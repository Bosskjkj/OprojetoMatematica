const express = require('express');
const router = express.Router();
const TopicoController = require('../controllers/topicoController');

router.get('/', TopicoController.listarTodos);
router.get('/disciplina/:disciplina_id', TopicoController.listarPorDisciplina);
router.get('/:id', TopicoController.buscarPorId);
router.post('/', TopicoController.criar);
router.put('/:id', TopicoController.atualizar);
router.delete('/:id', TopicoController.deletar);

module.exports = router;
