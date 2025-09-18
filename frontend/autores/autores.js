const API_BASE_URL = 'http://localhost:3001';

const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const nomeInput = document.getElementById('nome');
const dataNascimentoInput = document.getElementById('data_nascimento');
const nacionalidadeInput = document.getElementById('nacionalidade');

const autoresTableBody = document.getElementById('autoresTableBody');
const messageContainer = document.getElementById('messageContainer');

let currentAutorId = null;
let operacao = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarAutores();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

// Event listeners
btnBuscar.addEventListener('click', buscarAutor);
btnIncluir.addEventListener('click', incluirAutor);
btnAlterar.addEventListener('click', alterarAutor);
btnExcluir.addEventListener('click', excluirAutor);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    nomeInput.disabled = bloquear;
    dataNascimentoInput.disabled = bloquear;
    nacionalidadeInput.disabled = bloquear;
}

function limparFormulario() {
    currentAutorId = null;
    searchId.value = '';
    nomeInput.value = '';
    dataNascimentoInput.value = '';
    nacionalidadeInput.value = '';
    bloquearCampos(false);
}

function mostrarBotoes(buscar, incluir, alterar, excluir, salvar, cancelar) {
    btnBuscar.style.display = buscar ? 'inline-block' : 'none';
    btnIncluir.style.display = incluir ? 'inline-block' : 'none';
    btnAlterar.style.display = alterar ? 'inline-block' : 'none';
    btnExcluir.style.display = excluir ? 'inline-block' : 'none';
    btnSalvar.style.display = salvar ? 'inline-block' : 'none';
    btnCancelar.style.display = cancelar ? 'inline-block' : 'none';
}

async function buscarAutor() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/autores/${id}`);
        if (response.ok) {
            const autor = await response.json();
            preencherFormulario(autor);
            mostrarMensagem('Autor encontrado!', 'success');
            mostrarBotoes(true, false, true, true, false, false);
            bloquearCampos(true);
            currentAutorId = autor.autor_id;
        } else if (response.status === 404) {
            mostrarMensagem('Autor não encontrado. Você pode incluir um novo autor.', 'info');
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar autor');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar autor', 'error');
    }
}

function preencherFormulario(autor) {
    currentAutorId = autor.autor_id;
    searchId.value = autor.autor_id;
    nomeInput.value = autor.nome || '';
    dataNascimentoInput.value = autor.data_nascimento ? autor.data_nascimento.split('T')[0] : '';
    nacionalidadeInput.value = autor.nacionalidade || '';
}

function incluirAutor() {
    limparFormulario();
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    nomeInput.focus();
    operacao = 'incluir';
}

function alterarAutor() {
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    nomeInput.focus();
    operacao = 'alterar';
}

function excluirAutor() {
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(true);
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    operacao = null;
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const autor = {
        nome: nomeInput.value.trim(),
        data_nascimento: dataNascimentoInput.value || null,
        nacionalidade: nacionalidadeInput.value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && !autor.nome) {
        mostrarMensagem('O nome do autor é obrigatório', 'warning');
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
            mostrarMensagem(`Autor ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarAutores();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            operacao = null;
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

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
                <td>${autor.data_nascimento ? autor.data_nascimento.split('T')[0] : ''}</td>
                <td>${autor.nacionalidade || ''}</td>
            `;
            autoresTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar autores', 'error');
    }
}