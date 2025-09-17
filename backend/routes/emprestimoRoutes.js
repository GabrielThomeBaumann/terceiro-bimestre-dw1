const express = require('express');
const router = express.Router();
const emprestimoController = require('./../controllers/emprestimoController'); // Ajuste o caminho se necessário

// CRUD de Empréstimos

// Abrir a página CRUD
router.get('/abrirCrudEmprestimo', emprestimoController.abrirCrudEmprestimo);

// Listar todos os empréstimos
router.get('/', emprestimoController.listarEmprestimos);

// Criar um novo empréstimo
router.post('/', emprestimoController.criarEmprestimo);

// Obter um empréstimo específico por ID
router.get('/:id', emprestimoController.obterEmprestimo);

// Atualizar um empréstimo específico por ID
router.put('/:id', emprestimoController.atualizarEmprestimo);

// Deletar um empréstimo específico por ID
router.delete('/:id', emprestimoController.deletarEmprestimo);

module.exports = router;