// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentAutorId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('autoresForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const autoresTableBody = document.getElementById('autoresTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de autores ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarAutores();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarAutor);
btnIncluir.addEventListener('click', incluirAutor);
btnAlterar.addEventListener('click', alterarAutor);
btnExcluir.addEventListener('click', excluirAutor);
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

// Função para buscar autor por ID
async function buscarAutor() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/autores/${id}`);

        if (response.ok) {
            const autor = await response.json();
            preencherFormulario(autor);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Autor encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Autor não encontrado. Você pode incluir um novo autor.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar autor');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar autor', 'error');
    }
}

// Função para preencher formulário com dados do autor
function preencherFormulario(autor) {
    currentAutorId = autor.autor_id;
    searchId.value = autor.autor_id;
    document.getElementById('nome_autor').value = autor.nome_autor || '';
    document.getElementById('nacionalidade').value = autor.nacionalidade || '';
}

// Função para iniciar inclusão de autor
function incluirAutor() {
    mostrarMensagem('Digite os dados!', 'info');
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_autor').focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de autor
function alterarAutor() {
    mostrarMensagem('Digite os dados para alterar!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_autor').focus();
    operacao = 'alterar';
}

// Função para iniciar exclusão de autor
function excluirAutor() {
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

    const autor = {
        nome_autor: document.getElementById('nome_autor').value.trim(),
        nacionalidade: document.getElementById('nacionalidade').value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && !autor.nome_autor) {
        mostrarMensagem('Nome do autor é obrigatório', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/autores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(autor)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/autores/${currentAutorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(autor)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/autores/${currentAutorId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Autor excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Autor ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarAutores();
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

// Função para carregar lista de autores
async function carregarAutores() {
    try {
        const response = await fetch(`${API_BASE_URL}/autores`);
        if (response.ok) {
            const autores = await response.json();
            renderizarTabelaAutores(autores);
        } else {
            throw new Error('Erro ao carregar autores');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de autores', 'error');
    }
}

// Função para renderizar tabela de autores
function renderizarTabelaAutores(autores) {
    autoresTableBody.innerHTML = '';

    autores.forEach(autor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarAutor(${autor.autor_id})">${autor.autor_id}</button>
            </td>
            <td>${autor.nome_autor}</td>
            <td>${autor.nacionalidade || ''}</td>
        `;
        autoresTableBody.appendChild(row);
    });
}

// Função para selecionar autor da tabela
async function selecionarAutor(id) {
    searchId.value = id;
    await buscarAutor();
}