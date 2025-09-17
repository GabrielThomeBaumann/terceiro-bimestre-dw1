const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// Importar a configuração do banco PostgreSQL
const db = require('./database'); // Ajuste o caminho conforme necessário

// Configurações do servidor
const HOST = 'localhost'; // Para desenvolvimento local
const PORT_FIXA = 3001; // Porta fixa

// Serve a pasta frontend como arquivos estáticos
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));

app.use(cookieParser());

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // responde ao preflight
  }

  next();
});

// Middleware para adicionar a instância do banco de dados às requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middlewares
app.use(express.json());

// Middleware de tratamento de erros JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// Importando as rotas
const loginRoutes = require('./routes/loginRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pessoaRoutes = require('./routes/pessoaRoutes');
const questaoRoutes = require('./routes/questaoRoutes');
const professorRoutes = require('./routes/professorRoutes');
const avaliadorRoutes = require('./routes/avaliadorRoutes');
const avaliadoRoutes = require('./routes/avaliadoRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const avaliacaoHasQuestaoRoutes = require('./routes/avaliacaoHasQuestaoRoutes');
const editorasRoutes = require('./routes/editorasRoutes');
const livrosRoutes = require('./routes/livrosRoutes');
const livroAutorRoutes = require('./routes/livroAutorRoutes');
const autoresRoutes = require('./routes/autoresRoutes');
const emprestimoHasLivroRoutes = require('./routes/emprestimoHasLivroRoutes');
const emprestimoRoutes = require('./routes/emprestimoRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const perfisRoutes = require('./routes/perfisRoutes');

// Usando as rotas
app.use('/login', loginRoutes);
app.use('/menu', menuRoutes);
app.use('/pessoa', pessoaRoutes);
app.use('/questao', questaoRoutes);
app.use('/professor', professorRoutes);
app.use('/avaliador', avaliadorRoutes);
app.use('/avaliado', avaliadoRoutes);
app.use('/avaliacao', avaliacaoRoutes);
app.use('/avaliacaoHasQuestao', avaliacaoHasQuestaoRoutes);
app.use('/editoras', editorasRoutes);
app.use('/livros', livrosRoutes);
app.use('/livroautor', livroAutorRoutes);
app.use('/autores', autoresRoutes);
app.use('/emprestimohaslivro', emprestimoHasLivroRoutes);
app.use('/emprestimo', emprestimoRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/perfis', perfisRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar a conexão com o banco
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();

    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas (404) - Express 5 seguro
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ PostgreSQL conectado com sucesso');

    const PORT = process.env.PORT || PORT_FIXA;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais para encerramento graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();


