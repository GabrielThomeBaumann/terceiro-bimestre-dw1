const express = require('express');
const router = express.Router();
const editorasController = require('./../controllers/editorasController');
// CRUD de Editorass
router.get('/abrirCrudEditoras', editorasController.abrirCrudEditoras);
router.get('/', editorasController.listarEditoras); // CORRIGIDO: Era listarQuestoes
router.post('/', editorasController.criarEditoras);
router.get('/:id', editorasController.obterEditoras);
router.put('/:id', editorasController.atualizarEditoras);
router.delete('/:id', editorasController.deletarEditoras);
module.exports = router;

