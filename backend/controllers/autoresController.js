const { query } = require('../database');
const path = require('path');

exports.abrirCrudAutores = (req, res) => {
  console.log('autoresController - Rota /abrirCrudAutores - abrir o crudAutores');
  res.sendFile(path.join(__dirname, '../../frontend/autores/autores.html'));
}

exports.listarAutores = async (req, res) => {
  try {
    const result = await query('SELECT * FROM autores ORDER BY autor_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar autores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarAutor = async (req, res) => {
  console.log('Criando autor com dados:', req.body);
  try {
    // Assumindo que autor_id é SERIAL e o banco de dados o gerencia.
    const { nome_autor, nacionalidade } = req.body;

    // Validação básica
    if (!nome_autor) {
      return res.status(400).json({
        error: 'Nome do autor é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO autores (nome_autor, nacionalidade) VALUES ($1, $2) RETURNING *',
      [nome_autor, nacionalidade]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar autor:', error);

    // Erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }
    // Se houver uma UNIQUE constraint em 'nome_autor', você pode adicionar:
    // if (error.code === '23505' && error.constraint === 'autores_nome_autor_key') {
    //   return res.status(400).json({ error: 'Nome do autor já existe' });
    // }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterAutor = async (req, res) => {
  console.log('Obtendo autor com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM autores WHERE autor_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarAutor = async (req, res) => {
  console.log('Atualizando autor com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = parseInt(req.params.id);
    const { nome_autor, nacionalidade } = req.body;

    // Verifica se o autor existe
    const existingAutorResult = await query(
      'SELECT * FROM autores WHERE autor_id = $1',
      [id]
    );

    if (existingAutorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentAutor = existingAutorResult.rows[0];
    const updatedFields = {
      nome_autor: nome_autor !== undefined ? nome_autor : currentAutor.nome_autor,
      nacionalidade: nacionalidade !== undefined ? nacionalidade : currentAutor.nacionalidade
    };

    // Atualiza o autor
    const updateResult = await query(
      'UPDATE autores SET nome_autor = $1, nacionalidade = $2 WHERE autor_id = $3 RETURNING *',
      [updatedFields.nome_autor, updatedFields.nacionalidade, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarAutor = async (req, res) => {
  console.log('Deletando autor com ID:', req.params.id);
  try {
    const id = parseInt(req.params.id);
    // Verifica se o autor existe
    const existingAutorResult = await query(
      'SELECT * FROM autores WHERE autor_id = $1',
      [id]
    );

    if (existingAutorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrado' });
    }

    // Deleta o autor (as constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM autores WHERE autor_id = $1',
      [id]
    );

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Erro ao deletar autor:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar autor com dependências associadas (ex: livros)'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}