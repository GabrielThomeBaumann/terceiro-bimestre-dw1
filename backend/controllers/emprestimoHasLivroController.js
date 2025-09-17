const { query } = require('../database');
const path = require('path');

// Função para abrir a página CRUD de emprestimo_has_livro (se houver uma)
exports.abrirCrudEmprestimoHasLivro = (req, res) => {
  console.log('emprestimoHasLivroController - Rota /abrirCrudEmprestimoHasLivro - abrir o crudEmprestimoHasLivro');
  res.sendFile(path.join(__dirname, '../../frontend/emprestimoHasLivro/emprestimoHasLivro.html'));
}

// Listar todas as associações emprestimo-livro
exports.listarEmprestimoHasLivro = async (req, res) => {
  try {
    const result = await query('SELECT * FROM emprestimo_has_livro ORDER BY emprestimo_id, livro_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar associações emprestimo-livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Criar uma nova associação emprestimo-livro
exports.criarEmprestimoHasLivro = async (req, res) => {
  console.log('Criando associação emprestimo-livro com dados:', req.body);
  try {
    const { emprestimo_id, livro_id, data_devolucao_prevista } = req.body;

    // Validação básica
    if (!emprestimo_id || !livro_id || !data_devolucao_prevista) {
      return res.status(400).json({
        error: 'ID do empréstimo, ID do livro e data de devolução prevista são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO emprestimo_has_livro (emprestimo_id, livro_id, data_devolucao_prevista) VALUES ($1, $2, $3) RETURNING *',
      [emprestimo_id, livro_id, data_devolucao_prevista]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar associação emprestimo-livro:', error);

    // Erro de violação de chave primária (associação já existe)
    if (error.code === '23505') { // unique_violation
      return res.status(409).json({ // 409 Conflict
        error: 'Este livro já está associado a este empréstimo'
      });
    }
    // Erro de violação de chave estrangeira (emprestimo_id ou livro_id não existe)
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do empréstimo ou ID do livro inválido'
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

// Obter uma associação emprestimo-livro específica (usando ambos os IDs como chave primária composta)
exports.obterEmprestimoHasLivro = async (req, res) => {
  console.log('Obtendo associação emprestimo-livro com emprestimo_id:', req.params.emprestimo_id, 'e livro_id:', req.params.livro_id);
  try {
    const emprestimo_id = parseInt(req.params.emprestimo_id);
    const livro_id = parseInt(req.params.livro_id);

    if (isNaN(emprestimo_id) || isNaN(livro_id)) {
      return res.status(400).json({ error: 'IDs do empréstimo e do livro devem ser números válidos' });
    }

    const result = await query(
      'SELECT * FROM emprestimo_has_livro WHERE emprestimo_id = $1 AND livro_id = $2',
      [emprestimo_id, livro_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação emprestimo-livro não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter associação emprestimo-livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Atualizar uma associação emprestimo-livro específica
exports.atualizarEmprestimoHasLivro = async (req, res) => {
  console.log('Atualizando associação emprestimo-livro com emprestimo_id:', req.params.emprestimo_id, 'e livro_id:', req.params.livro_id, 'e dados:', req.body);
  try {
    const emprestimo_id = parseInt(req.params.emprestimo_id);
    const livro_id = parseInt(req.params.livro_id);
    const { data_devolucao_prevista, data_devolucao_realizada } = req.body;

    if (isNaN(emprestimo_id) || isNaN(livro_id)) {
      return res.status(400).json({ error: 'IDs do empréstimo e do livro devem ser números válidos' });
    }

    // Verifica se a associação existe
    const existingAssociationResult = await query(
      'SELECT * FROM emprestimo_has_livro WHERE emprestimo_id = $1 AND livro_id = $2',
      [emprestimo_id, livro_id]
    );

    if (existingAssociationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Associação emprestimo-livro não encontrada' });
    }

    const currentAssociation = existingAssociationResult.rows[0];
    const updatedFields = {
      data_devolucao_prevista: data_devolucao_prevista !== undefined ? data_devolucao_prevista : currentAssociation.data_devolucao_prevista,
      data_devolucao_realizada: data_devolucao_realizada !== undefined ? data_devolucao_realizada : currentAssociation.data_devolucao_realizada
    };

    const result = await query(
      'UPDATE emprestimo_has_livro SET data_devolucao_prevista = $1, data_devolucao_realizada = $2 WHERE emprestimo_id = $3 AND livro_id = $4 RETURNING *',
      [updatedFields.data_devolucao_prevista, updatedFields.data_devolucao_realizada, emprestimo_id, livro_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar associação emprestimo-livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Deletar uma associação emprestimo-livro específica
exports.deletarEmprestimoHasLivro = async (req, res) => {
  console.log('Deletando associação emprestimo-livro com emprestimo_id:', req.params.emprestimo_id, 'e livro_id:', req.params.livro_id);
  try {
    const emprestimo_id = parseInt(req.params.emprestimo_id);
    const livro_id = parseInt(req.params.livro_id);

    if (isNaN(emprestimo_id) || isNaN(livro_id)) {
      return res.status(400).json({ error: 'IDs do empréstimo e do livro devem ser números válidos' });
    }

    // Verifica se a associação existe
    const existingAssociationResult = await query(
      'SELECT * FROM emprestimo_has_livro WHERE emprestimo_id = $1 AND livro_id = $2',
      [emprestimo_id, livro_id]
    );

    if (existingAssociationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Associação emprestimo-livro não encontrada' });
    }

    await query(
      'DELETE FROM emprestimo_has_livro WHERE emprestimo_id = $1 AND livro_id = $2',
      [emprestimo_id, livro_id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar associação emprestimo-livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para listar livros de um empréstimo específico
exports.listarLivrosPorEmprestimo = async (req, res) => {
  try {
    const emprestimo_id = parseInt(req.params.emprestimo_id);

    if (isNaN(emprestimo_id)) {
      return res.status(400).json({ error: 'ID do empréstimo deve ser um número válido' });
    }

    const result = await query(
      `SELECT l.livro_id, l.titulo, ehl.data_devolucao_prevista, ehl.data_devolucao_realizada
       FROM livros l
       JOIN emprestimo_has_livro ehl ON l.livro_id = ehl.livro_id
       WHERE ehl.emprestimo_id = $1
       ORDER BY l.titulo`,
      [emprestimo_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum livro encontrado para este empréstimo ou empréstimo não existe' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar livros por empréstimo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para listar empréstimos de um livro específico
exports.listarEmprestimosPorLivro = async (req, res) => {
  try {
    const livro_id = parseInt(req.params.livro_id);

    if (isNaN(livro_id)) {
      return res.status(400).json({ error: 'ID do livro deve ser um número válido' });
    }

    const result = await query(
      `SELECT e.emprestimo_id, e.data_emprestimo, ehl.data_devolucao_prevista, ehl.data_devolucao_realizada
       FROM emprestimos e
       JOIN emprestimo_has_livro ehl ON e.emprestimo_id = ehl.emprestimo_id
       WHERE ehl.livro_id = $1
       ORDER BY e.data_emprestimo DESC`,
      [livro_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum empréstimo encontrado para este livro ou livro não existe' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar empréstimos por livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};