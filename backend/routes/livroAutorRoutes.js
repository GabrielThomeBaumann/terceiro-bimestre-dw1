const express = require('express');
const router = express.Router();
const livroAutorController = require('./../controllers/livroAutorController'); // Ajuste o caminho se necessário

// Rotas para a tabela de associação livro_autor

// Abrir a página CRUD (se houver)
router.get('/abrirCrudLivroAutor', livroAutorController.abrirCrudLivroAutor);

// Listar todas as associações
router.get('/', livroAutorController.listarLivroAutor);

// Criar uma nova associação
router.post('/', livroAutorController.criarLivroAutor);

// Obter uma associação específica (requer ambos os IDs na URL)
// Ex: GET /livroautor/1/2 (livro_id = 1, autor_id = 2)
router.get('/:livro_id/:autor_id', livroAutorController.obterLivroAutor);

// Deletar uma associação específica (requer ambos os IDs na URL)
// Ex: DELETE /livroautor/1/2
router.delete('/:livro_id/:autor_id', livroAutorController.deletarLivroAutor);

// Rotas adicionais para listar autores de um livro ou livros de um autor
// Ex: GET /livroautor/livro/1/autores
router.get('/livro/:livro_id/autores', livroAutorController.listarAutoresPorLivro);
// Ex: GET /livroautor/autor/1/livros
router.get('/autor/:autor_id/livros', livroAutorController.listarLivrosPorAutor);


module.exports = router;