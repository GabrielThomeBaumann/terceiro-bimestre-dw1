const express = require('express');
const router = express.Router();
const usuariosController = require('./../controllers/usuariosController'); // Ajuste o caminho se necessário

// CRUD de Usuários

// Abrir a página CRUD
router.get('/abrirCrudUsuarios', usuariosController.abrirCrudUsuarios);

// Listar todos os usuários
router.get('/', usuariosController.listarUsuarios);

// Criar um novo usuário
router.post('/', usuariosController.criarUsuario);

// Obter um usuário específico por ID
router.get('/:id', usuariosController.obterUsuario);

// Atualizar um usuário específico por ID
router.put('/:id', usuariosController.atualizarUsuario);

// Deletar um usuário específico por ID
router.delete('/:id', usuariosController.deletarUsuario);

module.exports = router;