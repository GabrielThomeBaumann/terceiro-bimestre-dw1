const { query } = require('../database');
const path = require('path');

exports.abrirCrudPerfis = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/perfis/perfis.html'));
}

exports.listarPerfis = async (req, res) => {
  try {
    const result = await query('SELECT usuario_id, nome_completo, telefone, endereco, data_nascimento FROM perfis ORDER BY usuario_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPerfil = async (req, res) => {
  try {
    const { usuario_id, nome_completo, telefone, endereco, data_nascimento } = req.body;

    if (!usuario_id || !nome_completo) {
      return res.status(400).json({ error: 'ID do usuário e Nome completo são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO perfis (usuario_id, nome_completo, telefone, endereco, data_nascimento) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [usuario_id, nome_completo, telefone || null, endereco || null, data_nascimento || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Perfil para este usuário já existe' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterPerfil = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT usuario_id, nome_completo, telefone, endereco, data_nascimento FROM perfis WHERE usuario_id = $1',
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
  try {
    const id = parseInt(req.params.id);
    const { nome_completo, telefone, endereco, data_nascimento } = req.body;

    const existingPerfilResult = await query('SELECT * FROM perfis WHERE usuario_id = $1', [id]);
    if (existingPerfilResult.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const currentPerfil = existingPerfilResult.rows[0];
    const updatedFields = {
      nome_completo: nome_completo !== undefined ? nome_completo : currentPerfil.nome_completo,
      telefone: telefone !== undefined ? telefone : currentPerfil.telefone,
      endereco: endereco !== undefined ? endereco : currentPerfil.endereco,
      data_nascimento: data_nascimento !== undefined ? data_nascimento : currentPerfil.data_nascimento
    };

    const result = await query(
      'UPDATE perfis SET nome_completo = $1, telefone = $2, endereco = $3, data_nascimento = $4 WHERE usuario_id = $5 RETURNING *',
      [updatedFields.nome_completo, updatedFields.telefone, updatedFields.endereco, updatedFields.data_nascimento, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPerfil = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingPerfilResult = await query('SELECT * FROM perfis WHERE usuario_id = $1', [id]);
    if (existingPerfilResult.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    await query('DELETE FROM perfis WHERE usuario_id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}