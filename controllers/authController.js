const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/userModel');

// ============================================================
// FUNÇÃO: gerarHash
// DESCRIÇÃO: Cria hash seguro para senha usando salt
// ============================================================
function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

// ============================================================
// FUNÇÃO: verificarHash
// DESCRIÇÃO: Compara senha em texto com hash armazenado
// ============================================================
function verificarHash(senha, hash) {
  if (!hash) {
    return false;
  }

  if (!hash.includes(':')) {
    return senha === hash;
  }

  const [salt, key] = hash.split(':');
  const derivedKey = crypto.scryptSync(senha, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
}

// ============================================================
// FUNÇÃO: login
// ROTA: POST /auth/login
// DESCRIÇÃO: Gera um token JWT para autenticação
// ============================================================
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios' });
  }

  try {
    const user = await UserModel.buscarPorEmail(email);
    if (!user || !verificarHash(password, user.senha)) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas' });
    }

    const payload = { email };
    const secret = process.env.JWT_SECRET || 'secret_jwt_default';
    const token = jwt.sign(payload, secret, { expiresIn: '2h' });

    res.status(200).json({ token });
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao fazer login', erro: erro.message });
  }
}

// ============================================================
// FUNÇÃO: register
// ROTA: POST /auth/register
// DESCRIÇÃO: Cria um novo usuário no banco
// ============================================================
async function register(req, res) {
  const { email, password, passwordConfirm } = req.body;

  if (!email || !password || !passwordConfirm) {
    return res.status(400).json({ mensagem: 'E-mail, senha e confirmação são obrigatórios' });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ mensagem: 'As senhas não coincidem' });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensagem: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const existingUser = await UserModel.buscarPorEmail(email);
    if (existingUser) {
      return res.status(409).json({ mensagem: 'Já existe um usuário com este e-mail' });
    }

    const senhaHash = gerarHash(password);
    const nome = email.split('@')[0] || email;
    await UserModel.criar({ nome, email, senha: senhaHash });

    res.status(201).json({ mensagem: 'Cadastro realizado com sucesso' });
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário', erro: erro.message });
  }
}

module.exports = {
  login,
  register
};
