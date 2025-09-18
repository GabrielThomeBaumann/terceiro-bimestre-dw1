const API_BASE_URL = 'http://localhost:3001';

const searchLivroId = document.getElementById('searchLivroId');
const searchAutorId = document.getElementById('searchAutorId');
const btnBuscarLivro = document.getElementById('btnBuscarLivro');
const btnBuscarAutor = document.getElementById('btnBuscarAutor');
const livroIdInput = document.getElementById('livro_id');
const autorIdInput = document.getElementById('autor_id');
const btnIncluir = document.getElementById('btnIncluir');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const livroAutorTableBody = document.getElementById('livroAutorTableBody');
const livrosTableBody = document.getElementById('livrosTableBody');
const autoresTableBody = document.getElementById('autoresTableBody');
const messageContainer = document.getElementById('messageContainer');

let operacao = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarLivros();
    carregarAutores();
    carregarLivroAutor();
    limparFormulario();
});

// Event listeners
btnBuscarLivro.addEventListener('click', buscarLivroPorId);
btnBuscarAutor.addEventListener('click', buscarAutorPorId);
btnIncluir.addEventListener('click', incluirAssociacao);
btnExcluir.addEventListener('click', excluirAssociacao);
btnCancelar.addEventListener('click', limparFormulario);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// Limpar formulário
function limparFormulario() {
    livroIdInput.value = '';
    autorIdInput.value = '';
    searchLivroId.value = '';
    searchAutorId.value = '';
    operacao = null;
}

// Buscar livro por ID e preencher campo
async function buscarLivroPorId() {
    const id = searchLivroId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID de livro para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/livros/${id}`);
        if (response.ok) {
            const livro = await response.json();
            livroIdInput.value = livro.livro_id;
            mostrarMensagem(`Livro encontrado: ${livro.titulo}`, 'success');
        } else if (response.status === 404) {
            mostrarMensagem('Livro não encontrado', 'warning');
            livroIdInput.value = '';
        } else {
            throw new Error('Erro ao buscar livro');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar livro', 'error');
    }
}

// Buscar autor por ID e preencher campo
async function buscarAutorPorId() {
    const id = searchAutorId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID de autor para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/autores/${id}`);
        if (response.ok) {
            const autor = await response.json();
            autorIdInput.value = autor.autor_id;
            mostrarMensagem(`Autor encontrado: ${autor.nome}`, 'success');
        } else if (response.status === 404) {
            mostrarMensagem('Autor não encontrado', 'warning');
            autorIdInput.value = '';
        } else {
            throw new Error('Erro ao buscar autor');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar autor', 'error');
    }
}

// Incluir associação livro-autor
async function incluirAssociacao() {
    const livro_id = parseInt(livroIdInput.value);
    const autor_id = parseInt(autorIdInput.value);

    if (!livro_id || !autor_id) {
        mostrarMensagem('Informe IDs válidos para livro e autor', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/livroAutor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ livro_id, autor_id })
        });

        if (response.ok) {
            mostrarMensagem('Associação incluída com sucesso', 'success');
            limparFormulario();
            carregarLivroAutor();
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro ao incluir associação', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao incluir associação', 'error');
    }
}

// Excluir associação livro-autor
async function excluirAssociacao() {
    const livro_id = parseInt(livroIdInput.value);
    const autor_id = parseInt(autorIdInput.value);

    if (!livro_id || !autor_id) {
        mostrarMensagem('Informe IDs válidos para livro e autor', 'warning');
        return;
    }

    try {
        // Supondo que a rota DELETE seja /livroAutor/:livro_id/:autor_id
        const response = await fetch(`${API_BASE_URL}/livroAutor/${livro_id}/${autor_id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarMensagem('Associação excluída com sucesso', 'success');
            limparFormulario();
            carregarLivroAutor();
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro ao excluir associação', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao excluir associação', 'error');
    }
}

// Carregar todas as associações livro-autor
async function carregarLivroAutor() {
    try {
        const response = await fetch(`${API_BASE_URL}/livroAutor`);
        if (!response.ok) throw new Error('Erro ao carregar associações');
        const dados = await response.json();

        livroAutorTableBody.innerHTML = '';

        dados.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.livro_id}</td>
                <td>${item.titulo || ''}</td>
                <td>${item.autor_id}</td>
                <td>${item.nome || ''}</td>
            `;
            livroAutorTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar associações', 'error');
    }
}

// Carregar todos os livros
async function carregarLivros() {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (!response.ok) throw new Error('Erro ao carregar livros');
        const livros = await response.json();

        livrosTableBody.innerHTML = '';

        livros.forEach(livro => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${livro.livro_id}</td>
                <td>${livro.titulo}</td>
                <td>${livro.isbn || ''}</td>
                <td>${livro.ano_publicacao || ''}</td>
                <td>${livro.paginas || ''}</td>
                <td>${livro.editora_id || ''}</td>
            `;
            livrosTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar livros', 'error');
    }
}

// Carregar todos os autores
async function carregarAutores() {
    try {
        const response = await fetch(`${API_BASE_URL}/autores`);
        if (!response.ok) throw new Error('Erro ao carregar autores');
        const autores = await response.json();

        autoresTableBody.innerHTML = '';

        autores.forEach(autor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${autor.autor_id}</td>
                <td>${autor.nome}</td>
            `;
            autoresTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar autores', 'error');
    }
}