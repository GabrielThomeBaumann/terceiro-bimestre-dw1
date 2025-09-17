const express = require('express');
const router = express.Router();
const emprestimoHasLivroController = require('./../controllers/emprestimoHasLivroController'); // Ajuste o caminho se necessário

// Rotas para a tabela de associação emprestimo_has_livro

// Abrir a página CRUD (se houver)
router.get('/abrirCrudEmprestimoHasLivro', emprestimoHasLivroController.abrirCrudEmprestimoHasLivro);

// Listar todas as associações
router.get('/', emprestimoHasLivroController.listarEmprestimoHasLivro);

// Criar uma nova associação
router.post('/', emprestimoHasLivroController.criarEmprestimoHasLivro);

// Obter uma associação específica (requer ambos os IDs na URL)
// Ex: GET /emprestimohaslivro/1/2 (emprestimo_id = 1, livro_id = 2)
router.get('/:emprestimo_id/:livro_id', emprestimoHasLivroController.obterEmprestimoHasLivro);

// Atualizar uma associação específica (requer ambos os IDs na URL)
// Ex: PUT /emprestimohaslivro/1/2
router.put('/:emprestimo_id/:livro_id', emprestimoHasLivroController.atualizarEmprestimoHasLivro);

// Deletar uma associação específica (requer ambos os IDs na URL)
// Ex: DELETE /emprestimohaslivro/1/2
router.delete('/:emprestimo_id/:livro_id', emprestimoHasLivroController.deletarEmprestimoHasLivro);

// Rotas adicionais para listar livros de um empréstimo ou empréstimos de um livro
// Ex: GET /emprestimohaslivro/emprestimo/1/livros
router.get('/emprestimo/:emprestimo_id/livros', emprestimoHasLivroController.listarLivrosPorEmprestimo);
// Ex: GET /emprestimohaslivro/livro/1/emprestimos
router.get('/livro/:livro_id/emprestimos', emprestimoHasLivroController.listarEmprestimosPorLivro);

module.exports = router;