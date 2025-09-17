const { query } = require('../database');
const path = require('path');

exports.abrirCrudPerfis = (req, res) => {
  console.log('perfisController - Rota /abrirCrudPerfis - abrir o crudPerfis');
  res.sendFile(path.join(__dirname, '../../frontend/perfis/perfis.html'));
}

exports.listarPerfis = async (req, res) => {
  try {
    const result = await query('SELECT * FROM perfis ORDER BY perfil_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPerfil = async (req, res) => {
  console.log('Criando perfil com dados:', req.body);
  try {
    const { nome_perfil, descricao } = req.body;

    if (!nome_perfil) {
      return res.status(400).json({
        error: 'Nome do perfil é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO perfis (nome_perfil, descricao) VALUES ($1, $2) RETURNING *',
      [nome_perfil, descricao || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar perfil:', error);

    if (error.code === '23505') { // unique_violation
      return res.status(400).json({
        error: 'Nome do perfil já existe'
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

exports.obterPerfil = async (req, res) => {
  console.log('Obtendo perfil com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM perfis WHERE perfil_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPerfil = async (req, res) => {
  console.log('Atualizando perfil com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = parseInt(req.params.id);
    const { nome_perfil, descricao } = req.body;

    // Verifica se o perfil existe
    const existingPerfilResult = await query(
      'SELECT * FROM perfis WHERE perfil_id = $1',
      [id]
    );

    if (existingPerfilResult.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const currentPerfil = existingPerfilResult.rows[0];
    const updatedFields = {
      nome_perfil: nome_perfil !== undefined ? nome_perfil : currentPerfil.nome_perfil,
      descricao: descricao !== undefined ? descricao : currentPerfil.descricao
    };

    const result = await query(
      'UPDATE perfis SET nome_perfil = $1, descricao = $2 WHERE perfil_id = $3 RETURNING *',
      [updatedFields.nome_perfil, updatedFields.descricao, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);

    if (error.code === '23505') { // unique_violation
      return res.status(400).json({
        error: 'Nome do perfil já existe'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPerfil = async (req, res) => {
  console.log('Deletando perfil com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    // Verifica se o perfil existe
    const existingPerfilResult = await query(
      'SELECT * FROM perfis WHERE perfil_id = $1',
      [id]
    );

    if (existingPerfilResult.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Deleta o perfil (constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM perfis WHERE perfil_id = $1',
      [id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar perfil:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar perfil com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}