const { query, transaction } = require('../database');
const path = require('path');

exports.abrirCrudEmprestimoUnificado = (req, res) => {
  console.log('emprestimoUnificadoController - Rota /abrirCrudEmprestimoUnificado - abrir o crudEmprestimoUnificado');
  res.sendFile(path.join(__dirname, '../../frontend/emprestimoUnificado/emprestimoUnificado.html'));
};

// Listar todos os empréstimos com seus livros associados
exports.listarEmprestimosUnificados = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        e.emprestimo_id,
        e.usuario_id,
        e.data_emprestimo,
        e.data_devolucao_prevista,
        e.data_devolucao_real,
        e.status,
        json_agg(
          json_build_object(
            'livro_id', l.livro_id,
            'titulo', l.titulo,
            'data_devolucao_prevista_livro', ehl.data_devolucao_prevista,
            'data_devolucao_realizada_livro', ehl.data_devolucao_realizada
          )
        ) AS livros_associados
      FROM emprestimos e
      LEFT JOIN emprestimo_has_livro ehl ON e.emprestimo_id = ehl.emprestimo_id
      LEFT JOIN livros l ON ehl.livro_id = l.livro_id
      GROUP BY e.emprestimo_id
      ORDER BY e.emprestimo_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar empréstimos unificados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar um novo empréstimo e suas associações com livros
exports.criarEmprestimoUnificado = async (req, res) => {
  console.log('Criando empréstimo unificado com dados:', req.body);
  const { usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status, livros } = req.body;

  // Validação básica do empréstimo
  if (!usuario_id || !data_emprestimo || !data_devolucao_prevista) {
    return res.status(400).json({
      error: 'ID do usuário, data do empréstimo e data de devolução prevista são obrigatórios para o empréstimo'
    });
  }

  try {
    const newEmprestimo = await transaction(async (client) => {
      // 1. Criar o empréstimo principal
      const emprestimoResult = await client.query(
        'INSERT INTO emprestimos (usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real || null, status || 'ativo']
      );
      const emprestimo = emprestimoResult.rows[0];

      // 2. Associar os livros, se houver
      if (livros && livros.length > 0) {
        for (const livro of livros) {
          if (!livro.livro_id || !livro.data_devolucao_prevista_livro) {
            throw new Error('ID do livro e data de devolução prevista são obrigatórios para cada livro associado.');
          }
          await client.query(
            'INSERT INTO emprestimo_has_livro (emprestimo_id, livro_id, data_devolucao_prevista) VALUES ($1, $2, $3)',
            [emprestimo.emprestimo_id, livro.livro_id, livro.data_devolucao_prevista_livro]
          );
        }
      }
      return emprestimo;
    });

    res.status(201).json(newEmprestimo);
  } catch (error) {
    console.error('Erro ao criar empréstimo unificado:', error);
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'ID do usuário ou ID do livro inválido' });
    }
    if (error.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

// Obter um empréstimo específico com seus livros associados
exports.obterEmprestimoUnificado = async (req, res) => {
  console.log('Obtendo empréstimo unificado com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(`
      SELECT
        e.emprestimo_id,
        e.usuario_id,
        e.data_emprestimo,
        e.data_devolucao_prevista,
        e.data_devolucao_real,
        e.status,
        json_agg(
          json_build_object(
            'livro_id', l.livro_id,
            'titulo', l.titulo,
            'data_devolucao_prevista_livro', ehl.data_devolucao_prevista,
            'data_devolucao_realizada_livro', ehl.data_devolucao_realizada
          )
        ) AS livros_associados
      FROM emprestimos e
      LEFT JOIN emprestimo_has_livro ehl ON e.emprestimo_id = ehl.emprestimo_id
      LEFT JOIN livros l ON ehl.livro_id = l.livro_id
      WHERE e.emprestimo_id = $1
      GROUP BY e.emprestimo_id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    // Se não houver livros associados, json_agg retorna um array com um objeto nulo.
    // Ajustamos isso para retornar um array vazio.
    const emprestimo = result.rows[0];
    if (emprestimo.livros_associados && emprestimo.livros_associados.length === 1 && emprestimo.livros_associados[0].livro_id === null) {
      emprestimo.livros_associados = [];
    }

    res.json(emprestimo);
  } catch (error) {
    console.error('Erro ao obter empréstimo unificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar um empréstimo e suas associações com livros
exports.atualizarEmprestimoUnificado = async (req, res) => {
  console.log('Atualizando empréstimo unificado com ID:', req.params.id, 'e dados:', req.body);
  const id = parseInt(req.params.id);
  const { usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status, livros } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID deve ser um número válido' });
  }

  try {
    const updatedEmprestimo = await transaction(async (client) => {
      // 1. Verificar se o empréstimo existe
      const existingEmprestimoResult = await client.query(
        'SELECT * FROM emprestimos WHERE emprestimo_id = $1',
        [id]
      );

      if (existingEmprestimoResult.rows.length === 0) {
        throw new Error('Empréstimo não encontrado');
      }

      const currentEmprestimo = existingEmprestimoResult.rows[0];
      const updatedFields = {
        usuario_id: usuario_id !== undefined ? usuario_id : currentEmprestimo.usuario_id,
        data_emprestimo: data_emprestimo !== undefined ? data_emprestimo : currentEmprestimo.data_emprestimo,
        data_devolucao_prevista: data_devolucao_prevista !== undefined ? data_devolucao_prevista : currentEmprestimo.data_devolucao_prevista,
        data_devolucao_real: data_devolucao_real !== undefined ? data_devolucao_real : currentEmprestimo.data_devolucao_real,
        status: status !== undefined ? status : currentEmprestimo.status
      };

      // Validação para campos NOT NULL
      if (!updatedFields.usuario_id || !updatedFields.data_emprestimo || !updatedFields.data_devolucao_prevista) {
        throw new Error('ID do usuário, data do empréstimo e data de devolução prevista são obrigatórios');
      }

      // 2. Atualizar o empréstimo principal
      const emprestimoUpdateResult = await client.query(
        'UPDATE emprestimos SET usuario_id = $1, data_emprestimo = $2, data_devolucao_prevista = $3, data_devolucao_real = $4, status = $5 WHERE emprestimo_id = $6 RETURNING *',
        [updatedFields.usuario_id, updatedFields.data_emprestimo, updatedFields.data_devolucao_prevista, updatedFields.data_devolucao_real, updatedFields.status, id]
      );
      const emprestimo = emprestimoUpdateResult.rows[0];

      // 3. Atualizar as associações de livros
      // Primeiro, remove todas as associações existentes para este empréstimo
      await client.query('DELETE FROM emprestimo_has_livro WHERE emprestimo_id = $1', [id]);

      // Em seguida, insere as novas associações
      if (livros && livros.length > 0) {
        for (const livro of livros) {
          if (!livro.livro_id || !livro.data_devolucao_prevista_livro) {
            throw new Error('ID do livro e data de devolução prevista são obrigatórios para cada livro associado.');
          }
          await client.query(
            'INSERT INTO emprestimo_has_livro (emprestimo_id, livro_id, data_devolucao_prevista, data_devolucao_realizada) VALUES ($1, $2, $3, $4)',
            [emprestimo.emprestimo_id, livro.livro_id, livro.data_devolucao_prevista_livro, livro.data_devolucao_realizada_livro || null]
          );
        }
      }
      return emprestimo;
    });

    res.json(updatedEmprestimo);
  } catch (error) {
    console.error('Erro ao atualizar empréstimo unificado:', error);
    if (error.message === 'Empréstimo não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'ID do usuário ou ID do livro inválido' });
    }
    if (error.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

// Deletar um empréstimo e suas associações
exports.deletarEmprestimoUnificado = async (req, res) => {
  console.log('Deletando empréstimo unificado com ID:', req.params.id);
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID deve ser um número válido' });
  }

  try {
    await transaction(async (client) => {
      // 1. Verificar se o empréstimo existe
      const existingEmprestimoResult = await client.query(
        'SELECT * FROM emprestimos WHERE emprestimo_id = $1',
        [id]
      );

      if (existingEmprestimoResult.rows.length === 0) {
        throw new Error('Empréstimo não encontrado');
      }

      // 2. Deletar as associações de livros (se houver CASCADE na FK, isso é automático)
      await client.query('DELETE FROM emprestimo_has_livro WHERE emprestimo_id = $1', [id]);

      // 3. Deletar o empréstimo principal
      await client.query('DELETE FROM emprestimos WHERE emprestimo_id = $1', [id]);
    });

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar empréstimo unificado:', error);
    if (error.message === 'Empréstimo não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

// Função auxiliar para listar todos os livros (para o frontend)
exports.listarTodosLivros = async (req, res) => {
  try {
    const result = await query('SELECT livro_id, titulo FROM livros ORDER BY titulo');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar todos os livros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};