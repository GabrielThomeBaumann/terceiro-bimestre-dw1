const { query, transaction } = require('../database');
const path = require('path');

// Função para abrir o CRUD de livros (frontend)
exports.abrirCrudLivros = (req, res) => {
  console.log('livrosController - Rota /abrirCrudLivros - abrir o crudLivros');
  res.sendFile(path.join(__dirname, '../../frontend/livros/livros.html'));
};

// Listar todos os livros com JOIN para editoras e autores agregados em array JSON
exports.listarLivros = async (req, res) => {
  try {
    // CORRIGIDO: Usa 'a.nome' em vez de 'a.nome_autor' para combinar com o schema do banco (coluna 'nome')
    const result = await query(`
      SELECT
        l.livro_id,
        l.titulo,
        l.ano_publicacao,
        l.editora_id,
        l.isbn,
        l.paginas,
        l.imagem_url,
        e.nome AS nome_editora,
        COALESCE(
          json_agg(
            json_build_object(
              'autor_id', a.autor_id,
              'nome', a.nome  -- MUDANÇA: 'nome' em vez de 'nome_autor'
            )
          ) FILTER (WHERE a.autor_id IS NOT NULL), 
          '[]'
        ) AS autores
      FROM livros l
      LEFT JOIN editoras e ON l.editora_id = e.editora_id
      LEFT JOIN livro_autor la ON l.livro_id = la.livro_id
      LEFT JOIN autores a ON la.autor_id = a.autor_id
      GROUP BY l.livro_id, l.titulo, l.ano_publicacao, l.editora_id, l.isbn, l.paginas, l.imagem_url, e.nome
      ORDER BY l.livro_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar um novo livro (com associação de autores via tabela intermediária)
exports.criarLivro = async (req, res) => {
  try {
    const { titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url, autores_ids } = req.body;

    if (!titulo || !ano_publicacao || !editora_id || !isbn) {
      return res.status(400).json({
        error: 'Título, ano de publicação, ID da editora e ISBN são obrigatórios'
      });
    }

    // Usa transação para garantir atomicidade (inserir livro + associações de autores)
    const newLivro = await transaction(async (client) => {
      const result = await client.query(
        'INSERT INTO livros (titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [titulo, ano_publicacao, editora_id, isbn, paginas || null, imagem_url || null]
      );
      const livro = result.rows[0];

      // Associa autores se fornecidos (array de IDs) – isso é usado no frontend para envio de autores_ids
      if (autores_ids && autores_ids.length > 0) {
        for (const autor_id of autores_ids) {
          await client.query(
            'INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)',
            [livro.livro_id, autor_id]
          );
        }
      }

      return livro;
    });

    res.status(201).json(newLivro);
  } catch (error) {
    console.error('Erro ao criar livro:', error);

    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Editora_id ou Autor_id fornecido não existe' });
    }
    if (error.code === '23505' && error.constraint === 'livros_isbn_key') {
      return res.status(400).json({ error: 'ISBN já cadastrado' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter um livro específico por ID (com JOIN para editora e autores) – Inclui autores associados para o frontend
exports.obterLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // CORRIGIDO: Usa 'a.nome' em vez de 'a.nome_autor'
    const result = await query(`
      SELECT
        l.livro_id,
        l.titulo,
        l.ano_publicacao,
        l.editora_id,
        l.isbn,
        l.paginas,
        l.imagem_url,
        e.nome AS nome_editora,
        COALESCE(
          json_agg(
            json_build_object(
              'autor_id', a.autor_id,
              'nome', a.nome  -- MUDANÇA: 'nome' em vez de 'nome_autor'
            )
          ) FILTER (WHERE a.autor_id IS NOT NULL), 
          '[]'
        ) AS autores
      FROM livros l
      LEFT JOIN editoras e ON l.editora_id = e.editora_id
      LEFT JOIN livro_autor la ON l.livro_id = la.livro_id
      LEFT JOIN autores a ON la.autor_id = a.autor_id
      WHERE l.livro_id = $1
      GROUP BY l.livro_id, l.titulo, l.ano_publicacao, l.editora_id, l.isbn, l.paginas, l.imagem_url, e.nome
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar um livro existente (com redefinição de associações de autores) – Recebe autores_ids do frontend
exports.atualizarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, ano_publicacao, editora_id, isbn, paginas, imagem_url, autores_ids } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // Usa transação para atomicidade
    const updatedLivro = await transaction(async (client) => {
      // Verifica se o livro existe
      const existingLivroResult = await client.query('SELECT * FROM livros WHERE livro_id = $1', [id]);
      if (existingLivroResult.rows.length === 0) {
        throw new Error('Livro não encontrado');
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

      // Atualiza o livro
      const updateResult = await client.query(
        'UPDATE livros SET titulo = $1, ano_publicacao = $2, editora_id = $3, isbn = $4, paginas = $5, imagem_url = $6 WHERE livro_id = $7 RETURNING *',
        [
          updatedFields.titulo,
          updatedFields.ano_publicacao,
          updatedFields.editora_id,
          updatedFields.isbn,
          updatedFields.paginas,
          updatedFields.imagem_url,
          id
        ]
      );
      const livro = updateResult.rows[0];

      // Remove associações antigas de autores e adiciona novas (recebe autores_ids do frontend)
      await client.query('DELETE FROM livro_autor WHERE livro_id = $1', [id]);

      if (autores_ids && autores_ids.length > 0) {
        for (const autor_id of autores_ids) {
          await client.query(
            'INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)',
            [livro.livro_id, autor_id]
          );
        }
      }

      return livro;
    });

    res.json(updatedLivro);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    if (error.message === 'Livro não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Editora_id ou Autor_id fornecido não existe' });
    }
    if (error.code === '23505' && error.constraint === 'livros_isbn_key') {
      return res.status(400).json({ error: 'ISBN já cadastrado' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar um livro (remove associações primeiro)
exports.deletarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // Usa transação para atomicidade
    await transaction(async (client) => {
      // Verifica se o livro existe
      const existingLivroResult = await client.query('SELECT * FROM livros WHERE livro_id = $1', [id]);
      if (existingLivroResult.rows.length === 0) {
        throw new Error('Livro não encontrado');
      }

      // Remove associações de autores primeiro
      await client.query('DELETE FROM livro_autor WHERE livro_id = $1', [id]);

      // Deleta o livro
      await client.query('DELETE FROM livros WHERE livro_id = $1', [id]);
    });

    res.status(204).send();  // No Content
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    if (error.message === 'Livro não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar livro com dependências associadas' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todos os autores (para o frontend de livros, ex: select múltiplo ou tabela de disponíveis)
exports.listarTodosAutores = async (req, res) => {
  try {
    // CORRIGIDO: Seleciona 'nome' em vez de 'nome_autor'
    const result = await query('SELECT autor_id, nome FROM autores ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar todos os autores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 1. Controller dedicado para listar autores de um livro
exports.listarAutoresDoLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }
    const result = await query(`
      SELECT a.autor_id, a.nome
      FROM livro_autor la
      JOIN autores a ON la.autor_id = a.autor_id
      WHERE la.livro_id = $1
      ORDER BY a.nome
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar autores do livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};