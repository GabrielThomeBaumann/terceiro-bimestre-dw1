//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudLivros = (req, res) => {
  console.log('livrosController - Rota /abrirCrudLivros - abrir o crudLivros');
  res.sendFile(path.join(__dirname, '../../frontend/livros/livros.html'));
}

exports.listarLivros = async (req, res) => {
  try {
    const result = await query('SELECT * FROM livros ORDER BY livro_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarLivro = async (req, res) => {
  try {
    const { titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url } = req.body;

    if (!titulo || !ano_publicacao || !editora_id || !isbn) {
      return res.status(400).json({
        error: 'Título, ano de publicação, ID da editora e ISBN são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO livros (titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [titulo, ano_publicacao, editora_id, isbn, paginas || null, imagem_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar livro:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Editora_id fornecido não existe'
      });
    }
    if (error.code === '23505' && error.constraint === 'livros_isbn_key') {
      return res.status(400).json({
        error: 'ISBN já cadastrado'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM livros WHERE livro_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url } = req.body;

    const existingLivroResult = await query(
      'SELECT * FROM livros WHERE livro_id = $1',
      [id]
    );

    if (existingLivroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    const currentLivro = existingLivroResult.rows[0];
    const updatedFields = {
      titulo: titulo !== undefined ? titulo : currentLivro.titulo,
      ano_publicacao: ano_publicacao !== undefined ? ano_publicacao : currentLivro.ano_publicacao,
      editora_id: editora_id !== undefined ? editora_id : currentLivro.editora_id,
      isbn: isbn !== undefined ? isbn : currentLivro.isbn,
      paginas: paginas !== undefined ? paginas : currentLivro.paginas,
      imagem_url: imagem_url !== undefined ? imagem_url : currentLivro.imagem_url
    };

    const updateResult = await query(
      'UPDATE livros SET titulo = $1, ano_publicacao = $2, editora_id = $3, isbn = $4, paginas = $5, imagem_url = $6 WHERE livro_id = $7 RETURNING *',
      [updatedFields.titulo, updatedFields.ano_publicacao, updatedFields.editora_id, updatedFields.isbn, updatedFields.paginas, updatedFields.imagem_url, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Editora_id fornecido não existe'
      });
    }
    if (error.code === '23505' && error.constraint === 'livros_isbn_key') {
      return res.status(400).json({
        error: 'ISBN já cadastrado'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingLivroResult = await query(
      'SELECT * FROM livros WHERE livro_id = $1',
      [id]
    );

    if (existingLivroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    await query(
      'DELETE FROM livros WHERE livro_id = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar livro:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar livro com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}