const API_BASE_URL = 'http://localhost:3001';

const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const usuarioIdInput = document.getElementById('usuario_id');
const nomeCompletoInput = document.getElementById('nome_completo');
const telefoneInput = document.getElementById('telefone');
const enderecoInput = document.getElementById('endereco');
const dataNascimentoInput = document.getElementById('data_nascimento');

const perfisTableBody = document.getElementById('perfisTableBody');
const messageContainer = document.getElementById('messageContainer');

let currentUsuarioId = null;
let operacao = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfis();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

btnBuscar.addEventListener('click', buscarPerfil);
btnIncluir.addEventListener('click', incluirPerfil);
btnAlterar.addEventListener('click', alterarPerfil);
btnExcluir.addEventListener('click', excluirPerfil);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    usuarioIdInput.disabled = bloquear;
    nomeCompletoInput.disabled = bloquear;
    telefoneInput.disabled = bloquear;
    enderecoInput.disabled = bloquear;
    dataNascimentoInput.disabled = bloquear;
}

function limparFormulario() {
    currentUsuarioId = null;
    searchId.value = '';
    usuarioIdInput.value = '';
    nomeCompletoInput.value = '';
    telefoneInput.value = '';
    enderecoInput.value = '';
    dataNascimentoInput.value = '';
    bloquearCampos(false);
    usuarioIdInput.disabled = false;
}

function mostrarBotoes(buscar, incluir, alterar, excluir, salvar, cancelar) {
    btnBuscar.style.display = buscar ? 'inline-block' : 'none';
    btnIncluir.style.display = incluir ? 'inline-block' : 'none';
    btnAlterar.style.display = alterar ? 'inline-block' : 'none';
    btnExcluir.style.display = excluir ? 'inline-block' : 'none';
    btnSalvar.style.display = salvar ? 'inline-block' : 'none';
    btnCancelar.style.display = cancelar ? 'inline-block' : 'none';
}

async function carregarPerfis() {
    try {
        const response = await fetch(`${API_BASE_URL}/perfis`);
        if (!response.ok) throw new Error('Erro ao carregar perfis');
        const perfis = await response.json();

        perfisTableBody.innerHTML = '';

        perfis.forEach(perfil => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="btn-id" onclick="selecionarPerfil(${perfil.usuario_id})">
                        ${perfil.usuario_id}
                    </button>
                </td>
                <td>${perfil.nome_completo || ''}</td>
                <td>${perfil.telefone || ''}</td>
                <td>${perfil.endereco || ''}</td>
                <td>${perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : ''}</td>
            `;
            perfisTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar perfis', 'error');
    }
}

async function selecionarPerfil(id) {
    searchId.value = id;
    await buscarPerfil();
}

async function buscarPerfil() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID de Usuário para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/perfis/${id}`);
        if (response.ok) {
            const perfil = await response.json();
            preencherFormulario(perfil);
            mostrarMensagem('Perfil encontrado!', 'success');
            mostrarBotoes(true, false, true, true, false, true);
            bloquearCampos(true);
            usuarioIdInput.disabled = true;
            currentUsuarioId = perfil.usuario_id;
        } else if (response.status === 404) {
            mostrarMensagem('Perfil não encontrado. Você pode incluir um novo perfil para este usuário.', 'info');
            limparFormulario();
            searchId.value = id;
            usuarioIdInput.value = id;
            mostrarBotoes(true, true, false, false, false, true);
            bloquearCampos(false);
            usuarioIdInput.disabled = true;
        } else {
            throw new Error('Erro ao buscar perfil');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar perfil', 'error');
    }
}

function preencherFormulario(perfil) {
    currentUsuarioId = perfil.usuario_id;
    searchId.value = perfil.usuario_id;
    usuarioIdInput.value = perfil.usuario_id;
    nomeCompletoInput.value = perfil.nome_completo || '';
    telefoneInput.value = perfil.telefone || '';
    enderecoInput.value = perfil.endereco || '';
    dataNascimentoInput.value = perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : '';
}

function incluirPerfil() {
    limparFormulario();
    if (searchId.value.trim()) {
        usuarioIdInput.value = searchId.value.trim();
        usuarioIdInput.disabled = true;
    } else {
        usuarioIdInput.disabled = false;
    }
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    nomeCompletoInput.focus();
    operacao = 'incluir';
}

function alterarPerfil() {
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    usuarioIdInput.disabled = true;
    nomeCompletoInput.focus();
    operacao = 'alterar';
}

function excluirPerfil() {
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(true);
    usuarioIdInput.disabled = true;
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    usuarioIdInput.disabled = false;
    operacao = null;
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const perfil = {
        usuario_id: parseInt(usuarioIdInput.value),
        nome_completo: nomeCompletoInput.value.trim(),
        telefone: telefoneInput.value.trim() || null,
        endereco: enderecoInput.value.trim() || null,
        data_nascimento: dataNascimentoInput.value || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!perfil.usuario_id || !perfil.nome_completo)) {
        mostrarMensagem('ID do Usuário e Nome Completo são obrigatórios', 'warning');
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
            response = await fetch(`${API_BASE_URL}/perfis/${currentUsuarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(perfil)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/perfis/${currentUsuarioId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Perfil ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarPerfis();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            usuarioIdInput.disabled = false;
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