const { query } = require('../database');
const path = require('path');

exports.abrirCrudEmprestimo = (req, res) => {
  console.log('emprestimoController - Rota /abrirCrudEmprestimo - abrir o crudEmprestimo');
  res.sendFile(path.join(__dirname, '../../frontend/emprestimo/emprestimo.html'));
}

exports.listarEmprestimos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM emprestimos ORDER BY emprestimo_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar empréstimos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarEmprestimo = async (req, res) => {
  console.log('Criando empréstimo com dados:', req.body);
  try {
    const { usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status } = req.body;

    // Validação básica
    if (!usuario_id || !data_emprestimo || !data_devolucao_prevista) {
      return res.status(400).json({
        error: 'ID do usuário, data do empréstimo e data de devolução prevista são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO emprestimos (usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real || null, status || 'ativo']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar empréstimo:', error);

    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do usuário inválido'
      });
    }

    if (error.code === '23502') { // not_null_violation
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterEmprestimo = async (req, res) => {
  console.log('Obtendo empréstimo com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM emprestimos WHERE emprestimo_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter empréstimo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarEmprestimo = async (req, res) => {
  console.log('Atualizando empréstimo com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = parseInt(req.params.id);
    const { usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status } = req.body;

    // Verifica se o empréstimo existe
    const existingEmprestimoResult = await query(
      'SELECT * FROM emprestimos WHERE emprestimo_id = $1',
      [id]
    );

    if (existingEmprestimoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
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
        return res.status(400).json({
            error: 'ID do usuário, data do empréstimo e data de devolução prevista são obrigatórios'
        });
    }

    const result = await query(
      'UPDATE emprestimos SET usuario_id = $1, data_emprestimo = $2, data_devolucao_prevista = $3, data_devolucao_real = $4, status = $5 WHERE emprestimo_id = $6 RETURNING *',
      [updatedFields.usuario_id, updatedFields.data_emprestimo, updatedFields.data_devolucao_prevista, updatedFields.data_devolucao_real, updatedFields.status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error);

    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do usuário inválido'
      });
    }
    if (error.code === '23502') { // not_null_violation
        return res.status(400).json({
            error: 'Dados obrigatórios não fornecidos'
        });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarEmprestimo = async (req, res) => {
  console.log('Deletando empréstimo com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    // Verifica se o empréstimo existe
    const existingEmprestimoResult = await query(
      'SELECT * FROM emprestimos WHERE emprestimo_id = $1',
      [id]
    );

    if (existingEmprestimoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    // Deleta o empréstimo (constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM emprestimos WHERE emprestimo_id = $1',
      [id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar empréstimo:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar empréstimo com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}