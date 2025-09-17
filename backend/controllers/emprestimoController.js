const { query } = require('../database');
const path = require('path');

exports.abrirCrudEmprestimo = (req, res) => {
  console.log('emprestimoController - Rota /abrirCrudEmprestimo - abrir o crudEmprestimo');
  res.sendFile(path.join(__dirname, '../../frontend/emprestimo/emprestimo.html'));
}

exports.listarEmprestimos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM emprestimo ORDER BY emprestimo_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar empréstimos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarEmprestimo = async (req, res) => {
  console.log('Criando empréstimo com dados:', req.body);
  try {
    const { cliente_id, data_emprestimo, data_devolucao, status } = req.body;

    // Validação básica
    if (!cliente_id || !data_emprestimo) {
      return res.status(400).json({
        error: 'ID do cliente e data do empréstimo são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO emprestimo (cliente_id, data_emprestimo, data_devolucao, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [cliente_id, data_emprestimo, data_devolucao || null, status || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar empréstimo:', error);

    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do cliente inválido'
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
      'SELECT * FROM emprestimo WHERE emprestimo_id = $1',
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
    const { cliente_id, data_emprestimo, data_devolucao, status } = req.body;

    // Verifica se o empréstimo existe
    const existingEmprestimoResult = await query(
      'SELECT * FROM emprestimo WHERE emprestimo_id = $1',
      [id]
    );

    if (existingEmprestimoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    const currentEmprestimo = existingEmprestimoResult.rows[0];
    const updatedFields = {
      cliente_id: cliente_id !== undefined ? cliente_id : currentEmprestimo.cliente_id,
      data_emprestimo: data_emprestimo !== undefined ? data_emprestimo : currentEmprestimo.data_emprestimo,
      data_devolucao: data_devolucao !== undefined ? data_devolucao : currentEmprestimo.data_devolucao,
      status: status !== undefined ? status : currentEmprestimo.status
    };

    const result = await query(
      'UPDATE emprestimo SET cliente_id = $1, data_emprestimo = $2, data_devolucao = $3, status = $4 WHERE emprestimo_id = $5 RETURNING *',
      [updatedFields.cliente_id, updatedFields.data_emprestimo, updatedFields.data_devolucao, updatedFields.status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error);

    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'ID do cliente inválido'
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
      'SELECT * FROM emprestimo WHERE emprestimo_id = $1',
      [id]
    );

    if (existingEmprestimoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    // Deleta o empréstimo (constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM emprestimo WHERE emprestimo_id = $1',
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