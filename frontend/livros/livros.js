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

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

function limparFormulario() {
    form.reset();
}

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
    document.getElementById('titulo_livro').value = livro.titulo || '';
    document.getElementById('autor_livro').value = livro.autor || '';
    document.getElementById('ano_publicacao_livro').value = livro.ano_publicacao || '';
    document.getElementById('editora_id_livro').value = livro.editora_id || '';
}

// Função para incluir livro
async function incluirLivro() {
    mostrarMensagem('Digite os dados!', 'success');
    currentLivroId = searchId.value;
    limparFormulario();
    searchId.value = currentLivroId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('titulo_livro').focus();
    operacao = 'incluir';
}

// Função para alterar livro
async function alterarLivro() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('titulo_livro').focus();
    operacao = 'alterar';
}

// Função para excluir livro
async function excluirLivro() {
    mostrarMensagem('Excluindo livro...', 'info');
    currentLivroId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentLivroId: ' + currentLivroId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const livro = {
        livro_id: searchId.value,
        titulo: formData.get('titulo_livro'),
        autor: formData.get('autor_livro'),
        ano_publicacao: formData.get('ano_publicacao_livro'),
        editora_id: formData.get('editora_id_livro')
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livros`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'DELETE'
            });
            console.log('Livro excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novoLivro = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarLivros();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir livro', 'error');
        } else {
            mostrarMensagem('Livro excluído com sucesso!', 'success');
            limparFormulario();
            carregarLivros();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar o livro', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de livros
async function carregarLivros() {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (response.ok) {
            const livros = await response.json();
            renderizarTabelaLivros(livros);
        } else {
            throw new Error('Erro ao carregar livros');
        }
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
                        <button class="btn-id" onclick="selecionarLivro(${livro.livro_id})">
                            ${livro.livro_id}
                        </button>
                    </td>
                    <td>${livro.titulo}</td>
                    <td>${livro.autor}</td>
                    <td>${livro.ano_publicacao}</td>
                    <td>${livro.editora_id}</td>
                `;
        livrosTableBody.appendChild(row);
    });
}

// Função para selecionar livro da tabela
async function selecionarLivro(id) {
    searchId.value = id;
    await buscarLivro();
}