const express = require('express');
const router = express.Router();
const QuestaoController = require('../controllers/questaoController');

router.get('/', QuestaoController.listarTodas);
router.get('/topico/:topico_id', QuestaoController.listarPorTopico);
router.get('/:id', QuestaoController.buscarPorId);
router.post('/', QuestaoController.criar);
router.post('/:id/verificar', QuestaoController.verificarResposta);
router.put('/:id', QuestaoController.atualizar);
router.delete('/:id', QuestaoController.deletar);

module.exports = router;
