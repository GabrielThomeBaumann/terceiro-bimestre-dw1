const { query } = require('../database');
const path = require('path');

// Função para abrir a página CRUD de livro_autor (se houver uma)
exports.abrirCrudLivroAutor = (req, res) => {
  console.log('livroAutorController - Rota /abrirCrudLivroAutor - abrir o crudLivroAutor');
  res.sendFile(path.join(__dirname, '../../frontend/livroAutor/livroAutor.html'));
}

// Listar todas as associações livro-autor
exports.listarLivroAutor = async (req, res) => {
  try {
    const result = await query('SELECT * FROM livro_autor ORDER BY livro_id, autor_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar associações livro-autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Criar uma nova associação livro-autor
exports.criarLivroAutor = async (req, res) => {
  console.log('Criando associação livro-autor com dados:', req.body);
  try {
    const { livro_id, autor_id } = req.body;

    // Validação básica
    if (!livro_id || !autor_id) {
      return res.status(400).json({
        error: 'ID do livro e ID do autor são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2) RETURNING *',
      [livro_id, autor_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar associação livro-autor:', error);

    // Erro de violação de chave primária (associação já existe)
    if (error.code === '23505') { // unique_violation
      return res.status(409).json({ // 409 Conflict
        error: 'Esta associação livro-autor já existe'
      });
    }
    // Erro de violação de chave estrangeira (livro_id ou autor_id não existe)
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do livro ou ID do autor inválido'
      });
    }
    // Erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Obter uma associação livro-autor específica (usando ambos os IDs como chave primária composta)
exports.obterLivroAutor = async (req, res) => {
  console.log('Obtendo associação livro-autor com livro_id:', req.params.livro_id, 'e autor_id:', req.params.autor_id);
  try {
    const livro_id = parseInt(req.params.livro_id);
    const autor_id = parseInt(req.params.autor_id);

    if (isNaN(livro_id) || isNaN(autor_id)) {
      return res.status(400).json({ error: 'IDs do livro e do autor devem ser números válidos' });
    }

    const result = await query(
      'SELECT * FROM livro_autor WHERE livro_id = $1 AND autor_id = $2',
      [livro_id, autor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação livro-autor não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter associação livro-autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Deletar uma associação livro-autor específica
exports.deletarLivroAutor = async (req, res) => {
  console.log('Deletando associação livro-autor com livro_id:', req.params.livro_id, 'e autor_id:', req.params.autor_id);
  try {
    const livro_id = parseInt(req.params.livro_id);
    const autor_id = parseInt(req.params.autor_id);

    if (isNaN(livro_id) || isNaN(autor_id)) {
      return res.status(400).json({ error: 'IDs do livro e do autor devem ser números válidos' });
    }

    // Verifica se a associação existe
    const existingAssociationResult = await query(
      'SELECT * FROM livro_autor WHERE livro_id = $1 AND autor_id = $2',
      [livro_id, autor_id]
    );

    if (existingAssociationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Associação livro-autor não encontrada' });
    }

    await query(
      'DELETE FROM livro_autor WHERE livro_id = $1 AND autor_id = $2',
      [livro_id, autor_id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar associação livro-autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para listar autores de um livro específico
exports.listarAutoresPorLivro = async (req, res) => {
  try {
    const livro_id = parseInt(req.params.livro_id);

    if (isNaN(livro_id)) {
      return res.status(400).json({ error: 'ID do livro deve ser um número válido' });
    }

    const result = await query(
      `SELECT a.autor_id, a.nome_autor
       FROM autores a
       JOIN livro_autor la ON a.autor_id = la.autor_id
       WHERE la.livro_id = $1
       ORDER BY a.nome_autor`,
      [livro_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum autor encontrado para este livro ou livro não existe' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar autores por livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para listar livros de um autor específico
exports.listarLivrosPorAutor = async (req, res) => {
  try {
    const autor_id = parseInt(req.params.autor_id);

    if (isNaN(autor_id)) {
      return res.status(400).json({ error: 'ID do autor deve ser um número válido' });
    }

    const result = await query(
      `SELECT l.livro_id, l.titulo, l.ano_publicacao
       FROM livros l
       JOIN livro_autor la ON l.livro_id = la.livro_id
       WHERE la.autor_id = $1
       ORDER BY l.titulo`,
      [autor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum livro encontrado para este autor ou autor não existe' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar livros por autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};