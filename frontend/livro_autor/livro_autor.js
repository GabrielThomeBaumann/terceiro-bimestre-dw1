// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';

let currentLivroId = null;
let currentAutorId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('livro_autorForm');
const searchLivroId = document.getElementById('searchLivroId');
const searchAutorId = document.getElementById('searchAutorId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const livro_autorTableBody = document.getElementById('livro_autorTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de associações ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarLivroAutor();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarLivroAutor);
btnIncluir.addEventListener('click', incluirLivroAutor);
btnExcluir.addEventListener('click', excluirLivroAutor);
btnCancelar.addEventListener('click', cancelarOperacao);

mostrarBotoes(true, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.disabled = bloquear;
    });
}

function limparFormulario() {
    form.reset();
    searchLivroId.value = '';
    searchAutorId.value = '';
}

function mostrarBotoes(btBuscar, btIncluir, btExcluir, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para buscar associação por livro_id e autor_id
async function buscarLivroAutor() {
    const livroId = searchLivroId.value.trim();
    const autorId = searchAutorId.value.trim();

    if (!livroId || !autorId) {
        mostrarMensagem('Digite os IDs livro_id e autor_id para buscar', 'warning');
        return;
    }

    bloquearCampos(true);
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor/${livroId}/${autorId}`);

        if (response.ok) {
            const assoc = await response.json();
            preencherFormulario(assoc);

            mostrarBotoes(true, false, true, true);
            mostrarMensagem('Associação encontrada!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchLivroId.value = livroId;
            searchAutorId.value = autorId;
            mostrarBotoes(true, true, false, true);
            mostrarMensagem('Associação não encontrada. Você pode incluir uma nova.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar associação');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar associação', 'error');
    }
}

// Função para preencher formulário com dados da associação
function preencherFormulario(assoc) {
    currentLivroId = assoc.livro_id;
    currentAutorId = assoc.autor_id;
    searchLivroId.value = assoc.livro_id;
    searchAutorId.value = assoc.autor_id;
}

// Função para incluir associação
async function incluirLivroAutor() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    bloquearCampos(false);
    mostrarBotoes(false, true, false, true);
    operacao = 'incluir';
}

// Função para excluir associação
async function excluirLivroAutor() {
    mostrarMensagem('Excluindo associação...', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, true, true);
    operacao = 'excluir';
}

// Função para salvar operação (incluir ou excluir)
async function salvarOperacao() {
    const livroId = searchLivroId.value.trim();
    const autorId = searchAutorId.value.trim();

    if (!livroId || !autorId) {
        mostrarMensagem('IDs livro_id e autor_id são obrigatórios', 'warning');
        return;
    }

    let response = null;
    try {
        if (operacao === 'incluir') {
            const body = { livro_id: parseInt(livroId), autor_id: parseInt(autorId) };
            response = await fetch(`${API_BASE_URL}/livroautor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livroautor/${livroId}/${autorId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarLivroAutor();
            mostrarBotoes(true, false, false, false);
            bloquearCampos(false);
        } else {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false);
    bloquearCampos(false);
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de associações
async function carregarLivroAutor() {
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor`);
        if (response.ok) {
            const lista = await response.json();
            renderizarTabelaLivroAutor(lista);
        } else {
            throw new Error('Erro ao carregar lista');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista', 'error');
    }
}

// Função para renderizar tabela de associações
function renderizarTabelaLivroAutor(lista) {
    livro_autorTableBody.innerHTML = '';

    lista.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarLivroAutor(${item.livro_id}, ${item.autor_id})">
                    ${item.livro_id}
                </button>
            </td>
            <td>${item.autor_id}</td>
        `;
        livro_autorTableBody.appendChild(row);
    });
}

// Função para selecionar associação da tabela
function selecionarLivroAutor(livroId, autorId) {
    searchLivroId.value = livroId;
    searchAutorId.value = autorId;
    buscarLivroAutor();
}