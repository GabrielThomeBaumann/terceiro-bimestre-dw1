-- ======================================
-- CRIAÇÃO DO BANCO DE DADOS
-- ======================================

DROP DATABASE IF EXISTS biblioteca;
CREATE DATABASE biblioteca;
\c biblioteca;

-- Habilitar extensão para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- TIPOS ENUM
CREATE TYPE tipo_usuario AS ENUM ('comum','admin');
CREATE TYPE status_emprestimo AS ENUM ('ativo','devolvido','atrasado');

-- ======================================
-- TABELAS
-- ======================================

-- EDITORAS
CREATE TABLE editoras (
    editora_id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(50),
    ano_fundacao INT
);

-- LIVROS
CREATE TABLE livros (
    livro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    ano_publicacao INT,
    paginas INT,
    editora_id INT REFERENCES editoras(editora_id) ON DELETE SET NULL,
    imagem_url VARCHAR(255)
);

-- AUTORES
CREATE TABLE autores (
    autor_id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nacionalidade VARCHAR(50),
    data_nascimento DATE
);

-- LIVRO_AUTOR (N:M)
CREATE TABLE livro_autor (
    livro_id INT REFERENCES livros(livro_id) ON DELETE CASCADE,
    autor_id INT REFERENCES autores(autor_id) ON DELETE CASCADE,
    PRIMARY KEY (livro_id, autor_id)
);

-- USUÁRIOS
CREATE TABLE usuarios (
    usuario_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'comum',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PERFIS (1:1 USUÁRIO)
CREATE TABLE perfis (
    usuario_id INT PRIMARY KEY REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    nome_completo VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    data_nascimento DATE
);

-- EMPRÉSTIMOS
CREATE TABLE emprestimos (
    emprestimo_id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(usuario_id),
    data_emprestimo DATE NOT NULL,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real DATE,
    status status_emprestimo DEFAULT 'ativo'
);

-- EMPRÉSTIMO ↔ LIVROS (N:M)
CREATE TABLE emprestimo_has_livro (
    emprestimo_id INT REFERENCES emprestimos(emprestimo_id) ON DELETE CASCADE,
    livro_id INT REFERENCES livros(livro_id) ON DELETE CASCADE,
    PRIMARY KEY (emprestimo_id, livro_id)
);

-- ======================================
-- POPULAÇÃO DAS TABELAS
-- ======================================

-- EDITORAS
INSERT INTO editoras (nome, cidade, ano_fundacao) VALUES
('Companhia das Letras', 'São Paulo', 1986),
('Editora Abril', 'Rio de Janeiro', 1950),
('Martin Claret', 'São Paulo', 2001),
('HarperCollins Brasil', 'São Paulo', 2015),
('Rocco', 'Rio de Janeiro', 1975),
('Intrínseca', 'Rio de Janeiro', 2003),
('Globo Livros', 'São Paulo', 2001),
('Planeta do Brasil', 'São Paulo', 2003),
('Editora Sextante', 'Rio de Janeiro', 1998); 

-- LIVROS
INSERT INTO livros (titulo, isbn, ano_publicacao, paginas, editora_id, imagem_url) VALUES
('Dom Casmurro', '978-85-359-0275-5', 1899, 256, 1, NULL),
('O Cortiço', '978-85-7232-232-6', 1890, 312, 2, NULL),
('Iracema', '978-85-7232-515-0', 1865, 198, 3, NULL),
('Memórias Póstumas de Brás Cubas', '978-85-359-0312-7', 1881, 368, 1, NULL),
('Senhora', '978-85-7232-510-5', 1875, 256, 3, NULL),
('Harry Potter e a Pedra Filosofal', '978-85-325-1234-5', 1997, 264, 5, NULL),
('Harry Potter e a Câmara Secreta', '978-85-325-1235-2', 1998, 320, 5, NULL),
('Harry Potter e o Prisioneiro de Azkaban', '978-85-325-1236-9', 1999, 348, 5, NULL),
('O Senhor dos Anéis: A Sociedade do Anel', '978-85-359-0270-0', 1954, 576, 4, NULL),
('O Senhor dos Anéis: As Duas Torres', '978-85-359-0271-7', 1954, 464, 4, NULL),
('O Senhor dos Anéis: O Retorno do Rei', '978-85-359-0272-4', 1955, 528, 4, NULL),
('O Pequeno Príncipe', '978-85-250-4567-8', 1943, 96, 6, NULL),
('A Culpa é das Estrelas', '978-85-8057-346-6', 2012, 288, 7, NULL),
('Cem Anos de Solidão', '978-85-250-1234-0', 1967, 448, 8, NULL),
('A Revolução dos Bichos', '978-85-422-0450-3', 1945, 152, 9, NULL);

-- AUTORES
INSERT INTO autores (nome, nacionalidade, data_nascimento) VALUES
('Machado de Assis', 'Brasileiro', '1839-06-21'),
('Aluísio Azevedo', 'Brasileiro', '1857-04-14'),
('José de Alencar', 'Brasileiro', '1829-05-01'),
('J.K. Rowling', 'Britânica', '1965-07-31'),
('J.R.R. Tolkien', 'Britânica', '1892-01-03'),
('Antoine de Saint-Exupéry', 'Francesa', '1900-06-29'),
('John Green', 'Americano', '1977-08-24'),
('Gabriel García Márquez', 'Colombiano', '1927-03-06'),
('George Orwell', 'Britânico', '1903-06-25');

-- LIVRO_AUTOR
INSERT INTO livro_autor (livro_id, autor_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(5, 3),
(6, 4), (7, 4), (8, 4),
(9, 5), (10, 5), (11, 5),
(12, 6),
(13, 7),
(14, 8),
(15, 9);

-- USUÁRIOS
INSERT INTO usuarios (email, senha, tipo) VALUES
('joao.silva@email.com', ENCODE(DIGEST('senha123','sha256'),'hex'), 'comum'),
('maria.santos@email.com', ENCODE(DIGEST('senha456','sha256'),'hex'), 'admin'),
('carlos.pereira@email.com', ENCODE(DIGEST('senha789','sha256'),'hex'), 'comum'),
('ana.costa@email.com', ENCODE(DIGEST('senha321','sha256'),'hex'), 'comum'),
('paulo.oliveira@email.com', ENCODE(DIGEST('senha654','sha256'),'hex'), 'admin');

-- PERFIS
INSERT INTO perfis (usuario_id, nome_completo, telefone, endereco, data_nascimento) VALUES
(1, 'João Silva', '(11) 99999-9999', 'Rua A, 123 - São Paulo', '1990-05-15'),
(2, 'Maria Santos', '(21) 98888-8888', 'Av. B, 456 - Rio de Janeiro', '1985-08-22'),
(3, 'Carlos Pereira', '(31) 97777-7777', 'Rua C, 789 - Belo Horizonte', '1992-12-01'),
(4, 'Ana Costa', '(41) 96666-6666', 'Rua D, 321 - Curitiba', '1995-03-10'),
(5, 'Paulo Oliveira', '(71) 95555-5555', 'Av. E, 654 - Salvador', '1988-11-20');

-- EMPRÉSTIMOS
INSERT INTO emprestimos (usuario_id, data_emprestimo, data_devolucao_prevista) VALUES
(1, '2025-09-01', '2025-09-15'),
(2, '2025-09-05', '2025-09-20'),
(3, '2025-09-07', '2025-09-21');

-- EMPRÉSTIMO_HAS_LIVRO
INSERT INTO emprestimo_has_livro (emprestimo_id, livro_id) VALUES
(1, 1), (1, 3),
(2, 9), (2, 12),
(3, 13), (3, 15);
