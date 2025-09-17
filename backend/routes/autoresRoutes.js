const express = require('express');
const router = express.Router();
const autoresController = require('./../controllers/autoresController'); // Ajuste o caminho se necessário

// CRUD de Autores

// Abrir a página CRUD
router.get('/abrirCrudAutores', autoresController.abrirCrudAutores);

// Listar todos os autores
router.get('/', autoresController.listarAutores);

// Criar um novo autor
router.post('/', autoresController.criarAutor);

// Obter um autor específico por ID
router.get('/:id', autoresController.obterAutor);

// Atualizar um autor específico por ID
router.put('/:id', autoresController.atualizarAutor);

// Deletar um autor específico por ID
router.delete('/:id', autoresController.deletarAutor);

module.exports = router;