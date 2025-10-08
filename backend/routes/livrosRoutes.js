const express = require('express');
const router = express.Router();
const livrosController = require('./../controllers/livrosController'); // Ajuste o caminho se necessário

// CRUD de Livros
router.get('/abrirCrudLivros', livrosController.abrirCrudLivros);
router.get('/', livrosController.listarLivros);
router.post('/', livrosController.criarLivro);
router.get('/:id', livrosController.obterLivro);
router.put('/:id', livrosController.atualizarLivro);
router.delete('/:id', livrosController.deletarLivro);

// Nova rota para listar todos os autores (para preencher selects no frontend)
router.get('/autores/todos', livrosController.listarTodosAutores);

// 2. Rota para listar autores de um livro específico usando o novo controller dedicado
router.get('/:id/autores', livrosController.listarAutoresDoLivro);

module.exports = router;