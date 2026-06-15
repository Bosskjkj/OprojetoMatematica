require('dotenv').config();

const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');

const DEFAULT_PORT = Number(process.env.PORT) || 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log('='.repeat(50));
    console.log('🚀 Servidor rodando!');
    console.log(`📍 URL: http://localhost:${port}`);
    console.log(`💾 Banco: PostgreSQL (${process.env.DB_NAME})`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === DEFAULT_PORT) {
      const fallbackPort = port + 1;
      console.warn(`⚠️ Porta ${port} em uso. Tentando ${fallbackPort}...`);
      startServer(fallbackPort);
      return;
    }

    console.error('❌ Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
}

const frontendDistIndex = path.join(__dirname, 'frontend', 'dist', 'index.html');
const frontendIndex = path.join(__dirname, 'frontend', 'index.html');

function sendFrontendIndex(res) {
  const fileToSend = fs.existsSync(frontendDistIndex) ? frontendDistIndex : frontendIndex;
  res.sendFile(fileToSend);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const { verificarToken } = require('./middleware/authMiddleware');

const disciplinaRoutes = require('./routes/disciplinaRoutes');
const topicoRoutes = require('./routes/topicoRoutes');
const questaoRoutes = require('./routes/questaoRoutes');

app.use('/auth', authRoutes);
app.use('/api/disciplinas', disciplinaRoutes);
app.use('/api/topicos', topicoRoutes);
app.use('/api/questoes', questaoRoutes);

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/home', (req, res) => sendFrontendIndex(res));
app.get('/simulado', (req, res) => sendFrontendIndex(res));
app.get('/resultado', (req, res) => sendFrontendIndex(res));
app.get('/estudos', (req, res) => sendFrontendIndex(res));
app.get('/dashboard', (req, res) => sendFrontendIndex(res));
app.get('/grupo', (req, res) => sendFrontendIndex(res));
app.get('/topicos', (req, res) => sendFrontendIndex(res));
app.get('/questoes', (req, res) => sendFrontendIndex(res));
app.get('/cadastro-sucesso', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro-sucesso.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

startServer(DEFAULT_PORT);
