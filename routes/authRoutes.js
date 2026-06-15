const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// POST /auth/login - gerar token JWT
router.post('/login', AuthController.login);

// POST /auth/register - criar novo usuário
router.post('/register', AuthController.register);

module.exports = router;
