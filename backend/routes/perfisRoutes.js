const express = require('express');
const router = express.Router();
const perfisController = require('./../controllers/perfisController'); // Ajuste o caminho se necessário

// CRUD de Perfis

// Abrir a página CRUD
router.get('/abrirCrudPerfis', perfisController.abrirCrudPerfis);

// Listar todos os perfis
router.get('/', perfisController.listarPerfis);

// Criar um novo perfil
router.post('/', perfisController.criarPerfil);

// Obter um perfil específico por ID
router.get('/:id', perfisController.obterPerfil);

// Atualizar um perfil específico por ID
router.put('/:id', perfisController.atualizarPerfil);

// Deletar um perfil específico por ID
router.delete('/:id', perfisController.deletarPerfil);

module.exports = router;