const express = require('express');
const router = express.Router();
const DisciplinaController = require('../controllers/disciplinaController');

router.get('/', DisciplinaController.listarTodas);
router.get('/:id', DisciplinaController.buscarPorId);
router.post('/', DisciplinaController.criar);
router.put('/:id', DisciplinaController.atualizar);
router.delete('/:id', DisciplinaController.deletar);

module.exports = router;
