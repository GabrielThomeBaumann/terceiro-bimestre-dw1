// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentLivroId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('livrosForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const livrosTableBody = document.getElementById('livrosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de livros ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarLivros();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarLivro);
btnIncluir.addEventListener('click', incluirLivro);
btnAlterar.addEventListener('click', alterarLivro);
btnExcluir.addEventListener('click', excluirLivro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// Função para bloquear/desbloquear campos do formulário
function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro; // ID bloqueado se true
        } else {
            input.disabled = !bloquearPrimeiro; // Outros campos liberados se bloquearPrimeiro true
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    searchId.disabled = false;
    currentLivroId = null;
}

// Função para mostrar/ocultar botões
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para buscar livro por ID
async function buscarLivro() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/livros/${id}`);

        if (response.ok) {
            const livro = await response.json();
            preencherFormulario(livro);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Livro encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Livro não encontrado. Você pode incluir um novo livro.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar livro');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar livro', 'error');
    }
}

// Função para preencher formulário com dados do livro
function preencherFormulario(livro) {
    currentLivroId = livro.livro_id;
    searchId.value = livro.livro_id;
    document.getElementById('titulo').value = livro.titulo || '';
    document.getElementById('isbn').value = livro.isbn || '';
    document.getElementById('ano_publicacao').value = livro.ano_publicacao || '';
    document.getElementById('paginas').value = livro.paginas || '';
    document.getElementById('editora_id').value = livro.editora_id || '';
    document.getElementById('imagem_url').value = livro.imagem_url || '';
}

// Função para iniciar inclusão de livro
function incluirLivro() {
    mostrarMensagem('Digite os dados!', 'info');
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('titulo').focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de livro
function alterarLivro() {
    mostrarMensagem('Digite os dados para alterar!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('titulo').focus();
    operacao = 'alterar';
}

// Função para iniciar exclusão de livro
function excluirLivro() {
    mostrarMensagem('Confirme a exclusão!', 'warning');
    bloquearCampos(false);
    searchId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para salvar inclusão, alteração ou exclusão
async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const livro = {
        titulo: document.getElementById('titulo').value.trim(),
        isbn: document.getElementById('isbn').value.trim(),
        ano_publicacao: parseInt(document.getElementById('ano_publicacao').value) || null,
        paginas: parseInt(document.getElementById('paginas').value) || null,
        editora_id: parseInt(document.getElementById('editora_id').value) || null,
        imagem_url: document.getElementById('imagem_url').value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!livro.titulo || !livro.ano_publicacao || !livro.editora_id || !livro.isbn)) {
        mostrarMensagem('Título, ano de publicação, ID da editora e ISBN são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livro)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livro)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Livro excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Livro ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarLivros();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            searchId.disabled = false;
            operacao = null;
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

// Função para carregar lista de livros
async function carregarLivros() {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (!response.ok) {
            throw new Error('Erro ao carregar livros');
        }
        const livros = await response.json();
        renderizarTabelaLivros(livros);
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de livros', 'error');
    }
}

// Função para renderizar tabela de livros
function renderizarTabelaLivros(livros) {
    livrosTableBody.innerHTML = '';

    livros.forEach(livro => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarLivro(${livro.livro_id})">${livro.livro_id}</button>
            </td>
            <td>${livro.titulo}</td>
            <td>${livro.isbn || ''}</td>
            <td>${livro.ano_publicacao || ''}</td>
            <td>${livro.paginas || ''}</td>
            <td>${livro.editora_id || ''}</td>
            <td>${livro.imagem_url ? `<img src="${livro.imagem_url}" alt="Capa" style="width: 50px; height: auto;">` : ''}</td>
        `;
        livrosTableBody.appendChild(row);
    });
}

// Função para selecionar livro da tabela
async function selecionarLivro(id) {
    searchId.value = id;
    await buscarLivro();
}