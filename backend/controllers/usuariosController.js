const { query } = require('../database');
const path = require('path');
const bcrypt = require('bcrypt'); // Para hash de senha (recomendado)

// Configuração do bcrypt
const saltRounds = 10;

exports.abrirCrudUsuarios = (req, res) => {
  console.log('usuariosController - Rota /abrirCrudUsuarios - abrir o crudUsuarios');
  res.sendFile(path.join(__dirname, '../../frontend/usuarios/usuarios.html'));
}

exports.listarUsuarios = async (req, res) => {
  try {
    const result = await query('SELECT usuario_id, nome, email, tipo_usuario FROM usuarios ORDER BY usuario_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarUsuario = async (req, res) => {
  console.log('Criando usuário com dados:', req.body);
  try {
    const { nome, email, senha, tipo_usuario } = req.body;

    // Validação básica
    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const result = await query(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES ($1, $2, $3, $4) RETURNING usuario_id, nome, email, tipo_usuario',
      [nome, email, senhaHash, tipo_usuario || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    if (error.code === '23505') { // unique_violation (email duplicado)
      return res.status(400).json({
        error: 'Email já cadastrado'
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

exports.obterUsuario = async (req, res) => {
  console.log('Obtendo usuário com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT usuario_id, nome, email, tipo_usuario FROM usuarios WHERE usuario_id = $1',
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
  console.log('Atualizando usuário com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = parseInt(req.params.id);
    const { nome, email, senha, tipo_usuario } = req.body;

    // Verifica se o usuário existe
    const existingUsuarioResult = await query(
      'SELECT * FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    if (existingUsuarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const currentUsuario = existingUsuarioResult.rows[0];

    // Se senha for fornecida, faz hash, senão mantém a atual
    let senhaHash = currentUsuario.senha;
    if (senha !== undefined && senha !== null && senha !== '') {
      senhaHash = await bcrypt.hash(senha, saltRounds);
    }

    // Atualiza o usuário
    const updatedNome = nome !== undefined ? nome : currentUsuario.nome;
    const updatedEmail = email !== undefined ? email : currentUsuario.email;
    const updatedTipoUsuario = tipo_usuario !== undefined ? tipo_usuario : currentUsuario.tipo_usuario;

    const result = await query(
      'UPDATE usuarios SET nome = $1, email = $2, senha = $3, tipo_usuario = $4 WHERE usuario_id = $5 RETURNING usuario_id, nome, email, tipo_usuario',
      [updatedNome, updatedEmail, senhaHash, updatedTipoUsuario, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    if (error.code === '23505') { // unique_violation (email duplicado)
      return res.status(400).json({
        error: 'Email já cadastrado'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarUsuario = async (req, res) => {
  console.log('Deletando usuário com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    // Verifica se o usuário existe
    const existingUsuarioResult = await query(
      'SELECT * FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    if (existingUsuarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Deleta o usuário (constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM usuarios WHERE usuario_id = $1',
      [id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar usuário com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}