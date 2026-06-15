const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secret_jwt_default';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado' });
  }
}

module.exports = {
  verificarToken
};
