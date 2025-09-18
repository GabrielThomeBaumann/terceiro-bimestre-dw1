const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

const form = document.getElementById('emprestimoHasLivroForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('emprestimoHasLivroTableBody');
const messageContainer = document.getElementById('messageContainer');

const emprestimoIdInput = document.getElementById('emprestimo_id');
const livroIdInput = document.getElementById('livro_id');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarRegistros();
});

btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnAlterar.addEventListener('click', alterarRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    searchId.disabled = bloquear;
    emprestimoIdInput.disabled = !bloquear;
    livroIdInput.disabled = !bloquear;
}

function limparFormulario() {
    form.reset();
    searchId.disabled = false;
    currentId = null;
}

function mostrarBotoes(buscar, incluir, alterar, excluir, salvar, cancelar) {
    btnBuscar.style.display = buscar ? 'inline-block' : 'none';
    btnIncluir.style.display = incluir ? 'inline-block' : 'none';
    btnAlterar.style.display = alterar ? 'inline-block' : 'none';
    btnExcluir.style.display = excluir ? 'inline-block' : 'none';
    btnSalvar.style.display = salvar ? 'inline-block' : 'none';
    btnCancelar.style.display = cancelar ? 'inline-block' : 'none';
}

async function buscarRegistro() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    limparFormulario();
    searchId.value = id;
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${id}`);
        if (response.ok) {
            const registro = await response.json();
            preencherFormulario(registro);
            mostrarBotoes(true, false, true, true, false, true);
            mostrarMensagem('Registro encontrado!', 'success');
            bloquearCampos(true);
            searchId.disabled = false;
            currentId = registro.id;
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, true);
            mostrarMensagem('Registro não encontrado. Você pode incluir um novo.', 'info');
            bloquearCampos(false);
            searchId.disabled = false;
            emprestimoIdInput.focus();
        } else {
            throw new Error('Erro ao buscar registro');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar registro', 'error');
    }
}

function preencherFormulario(registro) {
    currentId = registro.id;
    searchId.value = registro.id;
    emprestimoIdInput.value = registro.emprestimo_id || '';
    livroIdInput.value = registro.livro_id || '';
    // Removidos campos de data
}

function incluirRegistro() {
    mostrarMensagem('Digite os dados para o novo registro!', 'info');
    limparFormulario();
    bloquearCampos(true);
    searchId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    emprestimoIdInput.focus();
    operacao = 'incluir';
}

function alterarRegistro() {
    if (!currentId) {
        mostrarMensagem('Selecione um registro para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e salve!', 'info');
    bloquearCampos(true);
    searchId.disabled = true;
    emprestimoIdInput.focus();
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'alterar';
}

function excluirRegistro() {
    if (!currentId) {
        mostrarMensagem('Selecione um registro para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(false);
    searchId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
    searchId.focus();
    operacao = null;
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const registroData = {
        emprestimo_id: parseInt(emprestimoIdInput.value),
        livro_id: parseInt(livroIdInput.value)
        // Removidos campos de data
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!registroData.emprestimo_id || !registroData.livro_id)) {
        mostrarMensagem('ID do Empréstimo e ID do Livro são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/emprestimoHasLivro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroData)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${currentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${currentId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Registro excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Registro ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarRegistros();
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

async function carregarRegistros() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoHasLivro`);
        if (response.ok) {
            const registros = await response.json();
            renderizarTabela(registros);
        } else {
            throw new Error('Erro ao carregar registros');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista', 'error');
    }
}

function renderizarTabela(registros) {
    tableBody.innerHTML = '';

    registros.forEach(registro => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarRegistro(${registro.id})">${registro.id}</button>
            </td>
            <td>${registro.emprestimo_id}</td>
            <td>${registro.livro_id}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function selecionarRegistro(id) {
    searchId.value = id;
    await buscarRegistro();
}