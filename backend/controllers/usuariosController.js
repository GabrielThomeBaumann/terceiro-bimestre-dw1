const { query } = require('../database');
const path = require('path');
const bcrypt = require('bcrypt');

const saltRounds = 10;

exports.abrirCrudUsuarios = (req, res) => {
  console.log('usuariosController - Rota /abrirCrudUsuarios - abrir o crudUsuarios');
  res.sendFile(path.join(__dirname, '../../frontend/usuarios/usuarios.html'));
}

exports.listarUsuarios = async (req, res) => {
  try {
    const result = await query('SELECT usuario_id, email, tipo, data_criacao FROM usuarios ORDER BY usuario_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarUsuario = async (req, res) => {
  try {
    const { email, senha, tipo } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const result = await query(
      'INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, $3) RETURNING usuario_id, email, tipo, data_criacao',
      [email, senhaHash, tipo || 'comum']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await query(
      'SELECT usuario_id, email, tipo, data_criacao FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { email, senha, tipo } = req.body;

    const existingUsuarioResult = await query(
      'SELECT * FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    if (existingUsuarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const currentUsuario = existingUsuarioResult.rows[0];

    let senhaHash = currentUsuario.senha;
    if (senha) {
      senhaHash = await bcrypt.hash(senha, saltRounds);
    }

    const updatedEmail = email || currentUsuario.email;
    const updatedTipo = tipo || currentUsuario.tipo;

    const result = await query(
      'UPDATE usuarios SET email = $1, senha = $2, tipo = $3 WHERE usuario_id = $4 RETURNING usuario_id, email, tipo, data_criacao',
      [updatedEmail, senhaHash, updatedTipo, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingUsuarioResult = await query(
      'SELECT * FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    if (existingUsuarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await query('DELETE FROM usuarios WHERE usuario_id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);

    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar usuário com dependências associadas' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}