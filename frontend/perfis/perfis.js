// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPerfilId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('perfisForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const perfisTableBody = document.getElementById('perfisTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de perfis ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfis();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPerfil);
btnIncluir.addEventListener('click', incluirPerfil);
btnAlterar.addEventListener('click', alterarPerfil);
btnExcluir.addEventListener('click', excluirPerfil);
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

// Função para buscar perfil por ID
async function buscarPerfil() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/perfis/${id}`);

        if (response.ok) {
            const perfil = await response.json();
            preencherFormulario(perfil);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Perfil encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Perfil não encontrado. Você pode incluir um novo perfil.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar perfil');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar perfil', 'error');
    }
}

// Função para preencher formulário com dados do perfil
function preencherFormulario(perfil) {
    currentPerfilId = perfil.perfil_id;
    searchId.value = perfil.perfil_id;
    document.getElementById('nome_perfil').value = perfil.nome_perfil || '';
    document.getElementById('descricao').value = perfil.descricao || '';
}

// Função para iniciar inclusão de perfil
function incluirPerfil() {
    mostrarMensagem('Digite os dados!', 'info');
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_perfil').focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de perfil
function alterarPerfil() {
    mostrarMensagem('Digite os dados para alterar!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_perfil').focus();
    operacao = 'alterar';
}

// Função para iniciar exclusão de perfil
function excluirPerfil() {
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

    const perfil = {
        nome_perfil: document.getElementById('nome_perfil').value.trim(),
        descricao: document.getElementById('descricao').value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && !perfil.nome_perfil) {
        mostrarMensagem('Nome do perfil é obrigatório', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/perfis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(perfil)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/perfis/${currentPerfilId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(perfil)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/perfis/${currentPerfilId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Perfil excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Perfil ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarPerfis();
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

// Função para carregar lista de perfis
async function carregarPerfis() {
    try {
        const response = await fetch(`${API_BASE_URL}/perfis`);
        if (response.ok) {
            const perfis = await response.json();
            renderizarTabelaPerfis(perfis);
        } else {
            throw new Error('Erro ao carregar perfis');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de perfis', 'error');
    }
}

// Função para renderizar tabela de perfis
function renderizarTabelaPerfis(perfis) {
    perfisTableBody.innerHTML = '';

    perfis.forEach(perfil => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPerfil(${perfil.perfil_id})">${perfil.perfil_id}</button>
            </td>
            <td>${perfil.nome_perfil}</td>
            <td>${perfil.descricao || ''}</td>
        `;
        perfisTableBody.appendChild(row);
    });
}

// Função para selecionar perfil da tabela
async function selecionarPerfil(id) {
    searchId.value = id;
    await buscarPerfil();
}