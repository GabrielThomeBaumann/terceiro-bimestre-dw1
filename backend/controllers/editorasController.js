//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudEditoras = (req, res) => {
  console.log('editorasController - Rota /abrirCrudEditoras - abrir o crudEditoras');
  res.sendFile(path.join(__dirname, '../../frontend/editoras/editoras.html'));
}

exports.listarEditoras = async (req, res) => {
  try {
    const result = await query('SELECT * FROM editoras ORDER BY editora_id');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar editoras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarEditoras = async (req, res) => {
  //  console.log('Criando editoras com dados:', req.body);
  try {
    // Se editora_id é SERIAL, não deve ser fornecido no INSERT.
    // Se for fornecido, o banco de dados pode gerar um erro de chave primária duplicada.
    // Para um campo SERIAL, geralmente você não o inclui na lista de colunas do INSERT.
    // Vamos assumir que editora_id é SERIAL e o banco de dados o gerencia.
    const { nome, cidade, ano_fundacao} = req.body; // Removido editora_id do destructuring

    // Validação básica
    if (!nome || !cidade || !ano_fundacao) {
      return res.status(400).json({
        error: 'Nome, cidade e ano de fundação são obrigatórios' // CORRIGIDO: Mensagem de erro
      });
    }

    /*
-- EDITORAS
CREATE TABLE editoras (
    editora_id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(50),
    ano_fundacao INT
);
    */

    const result = await query(
      // Removido editora_id da lista de colunas e parâmetros, pois é SERIAL
      'INSERT INTO editoras (nome, cidade, ano_fundacao) VALUES ($1, $2, $3) RETURNING *',
      [nome, cidade, ano_fundacao]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar editoras:', error);

    // Verifica se é erro de violação de chave única (se houver alguma outra UNIQUE constraint)
    // A restrição 'editoras_cidade_key' e a mensagem 'Email já está em uso' não se aplicam.
    // Se houver uma UNIQUE constraint em 'nome', por exemplo, você poderia adicionar:
    // if (error.code === '23505' && error.constraint === 'editoras_nome_key') {
    //   return res.status(400).json({ error: 'Nome da editora já existe' });
    // }
    // Por enquanto, removemos a verificação específica de cidade/email.

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterEditoras = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM editoras WHERE editora_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editoras não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter editoras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarEditoras = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, cidade, ano_fundacao } = req.body; /* X */


    // Verifica se a editoras existe
    const existingPersonResult = await query(
      'SELECT * FROM editoras WHERE editora_id = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Editoras não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nome: nome !== undefined ? nome : currentPerson.nome,
      cidade: cidade !== undefined ? cidade : currentPerson.cidade,
      ano_fundacao: ano_fundacao !== undefined ? ano_fundacao : currentPerson.ano_fundacao
    };

    // Atualiza a editoras
    const updateResult = await query(
      'UPDATE editoras SET nome = $1, cidade = $2, ano_fundacao = $3  WHERE editora_id = $4 RETURNING *',
      [updatedFields.nome, updatedFields.cidade, updatedFields.ano_fundacao, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar editoras:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarEditoras = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a editoras existe
    const existingPersonResult = await query(
      'SELECT * FROM editoras WHERE editora_id = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Editoras não encontrada' });
    }

    // Deleta a editoras (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM editoras WHERE editora_id = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar editoras:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar editoras com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}