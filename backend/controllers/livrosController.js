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
    // Assumindo que livro_id é SERIAL e o banco de dados o gerencia.
    // Adicione os campos da sua tabela 'livros' aqui. Exemplo:
    const { titulo, autor, ano_publicacao, editora_id } = req.body;

    // Validação básica
    if (!titulo || !autor || !ano_publicacao || !editora_id) {
      return res.status(400).json({
        error: 'Título, autor, ano de publicação e ID da editora são obrigatórios'
      });
    }

    /*
    Exemplo de estrutura da tabela livros:
    CREATE TABLE livros (
        livro_id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NOT NULL,
        ano_publicacao INT,
        editora_id INT REFERENCES editoras(editora_id)
    );
    */

    const result = await query(
      'INSERT INTO livros (titulo, autor, ano_publicacao, editora_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo, autor, ano_publicacao, editora_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar livro:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }
    // Adicione outras verificações de erro específicas, como violação de chave estrangeira
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'Editora_id fornecido não existe'
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
    // Adicione os campos da sua tabela 'livros' aqui. Exemplo:
    const { titulo, autor, ano_publicacao, editora_id } = req.body;

    // Verifica se o livro existe
    const existingLivroResult = await query(
      'SELECT * FROM livros WHERE livro_id = $1',
      [id]
    );

    if (existingLivroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentLivro = existingLivroResult.rows[0];
    const updatedFields = {
      titulo: titulo !== undefined ? titulo : currentLivro.titulo,
      autor: autor !== undefined ? autor : currentLivro.autor,
      ano_publicacao: ano_publicacao !== undefined ? ano_publicacao : currentLivro.ano_publicacao,
      editora_id: editora_id !== undefined ? editora_id : currentLivro.editora_id
    };

    // Atualiza o livro
    const updateResult = await query(
      'UPDATE livros SET titulo = $1, autor = $2, ano_publicacao = $3, editora_id = $4 WHERE livro_id = $5 RETURNING *',
      [updatedFields.titulo, updatedFields.autor, updatedFields.ano_publicacao, updatedFields.editora_id, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    // Adicione outras verificações de erro específicas, como violação de chave estrangeira
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({
        error: 'Editora_id fornecido não existe'
      });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se o livro existe
    const existingLivroResult = await query(
      'SELECT * FROM livros WHERE livro_id = $1',
      [id]
    );

    if (existingLivroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // Deleta o livro (as constraints CASCADE cuidarão das dependências, se configuradas)
    await query(
      'DELETE FROM livros WHERE livro_id = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar livro:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar livro com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}