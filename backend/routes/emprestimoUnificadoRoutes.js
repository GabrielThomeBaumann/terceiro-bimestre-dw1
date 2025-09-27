const express = require('express');
const router = express.Router();
const emprestimoUnificadoController = require('./../controllers/emprestimoUnificadoController');

// Rota para abrir a página CRUD unificada
router.get('/abrirCrudEmprestimoUnificado', emprestimoUnificadoController.abrirCrudEmprestimoUnificado);

// Listar todos os empréstimos unificados
router.get('/', emprestimoUnificadoController.listarEmprestimosUnificados);

// Criar um novo empréstimo unificado
router.post('/', emprestimoUnificadoController.criarEmprestimoUnificado);

// Obter um empréstimo unificado específico por ID
router.get('/:id', emprestimoUnificadoController.obterEmprestimoUnificado);

// Atualizar um empréstimo unificado específico por ID
router.put('/:id', emprestimoUnificadoController.atualizarEmprestimoUnificado);

// Deletar um empréstimo unificado específico por ID
router.delete('/:id', emprestimoUnificadoController.deletarEmprestimoUnificado);

// Rota auxiliar para listar todos os livros (para o frontend)
router.get('/livros/todos', emprestimoUnificadoController.listarTodosLivros);

module.exports = router;