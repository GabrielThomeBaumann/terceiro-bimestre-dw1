const API_BASE_URL = 'http://localhost:3001';

const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const emailInput = document.getElementById('email'); // Alterado de nomeInput
const senhaInput = document.getElementById('senha');
const tipoUsuarioSelect = document.getElementById('tipo_usuario'); // Alterado de tipoUsuarioInput

const usuariosTableBody = document.getElementById('usuariosTableBody');
const messageContainer = document.getElementById('messageContainer');

let currentUsuarioId = null;
let operacao = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

// Event listeners
btnBuscar.addEventListener('click', buscarUsuario);
btnIncluir.addEventListener('click', incluirUsuario);
btnAlterar.addEventListener('click', alterarUsuario);
btnExcluir.addEventListener('click', excluirUsuario);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    emailInput.disabled = bloquear; // Alterado de nomeInput
    senhaInput.disabled = bloquear;
    tipoUsuarioSelect.disabled = bloquear; // Alterado de tipoUsuarioInput
}

function limparFormulario() {
    currentUsuarioId = null;
    searchId.value = '';
    emailInput.value = ''; // Alterado de nomeInput
    senhaInput.value = '';
    tipoUsuarioSelect.value = 'comum'; // Resetar para o valor padrão
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

async function buscarUsuario() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
        if (response.ok) {
            const usuario = await response.json();
            preencherFormulario(usuario);
            mostrarMensagem('Usuário encontrado!', 'success');
            mostrarBotoes(true, false, true, true, false, false);
            bloquearCampos(true);
            currentUsuarioId = usuario.usuario_id;
        } else if (response.status === 404) {
            mostrarMensagem('Usuário não encontrado. Você pode incluir um novo usuário.', 'info');
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar usuário');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar usuário', 'error');
    }
}

function preencherFormulario(usuario) {
    currentUsuarioId = usuario.usuario_id;
    searchId.value = usuario.usuario_id;
    emailInput.value = usuario.email || ''; // Alterado de nomeInput
    // Não preencher a senha por segurança
    senhaInput.value = '';
    tipoUsuarioSelect.value = usuario.tipo_usuario || 'comum'; // Alterado de tipoUsuarioInput
}

function incluirUsuario() {
    limparFormulario();
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    emailInput.focus(); // Alterado de nomeInput
    operacao = 'incluir';
}

function alterarUsuario() {
    mostrarBotoes(false, false, false, false, true, true);
    bloquearCampos(false);
    emailInput.focus(); // Alterado de nomeInput
    operacao = 'alterar';
}

function excluirUsuario() {
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

    const usuario = {
        email: emailInput.value.trim(), // Alterado de nome
        senha: senhaInput.value,
        tipo_usuario: tipoUsuarioSelect.value // Alterado de tipo_usuario
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!usuario.email || !usuario.senha)) {
        mostrarMensagem('Email e senha são obrigatórios', 'warning');
        return;
    }
    // Se for alteração e a senha não for fornecida, não enviar a senha para o backend
    if (operacao === 'alterar' && !usuario.senha) {
        delete usuario.senha;
    }


    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuario)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/usuarios/${currentUsuarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuario)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/usuarios/${currentUsuarioId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Usuário ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarUsuarios();
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

async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        const usuarios = await response.json();

        usuariosTableBody.innerHTML = '';

        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="btn-id" onclick="selecionarUsuario(${usuario.usuario_id})">
                        ${usuario.usuario_id}
                    </button>
                </td>
                <td>${usuario.email}</td>
                <td>${usuario.tipo_usuario || 'comum'}</td>
                <td>${usuario.data_criacao ? new Date(usuario.data_criacao).toLocaleString() : ''}</td>
            `;
            usuariosTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar usuários', 'error');
    }
}

async function selecionarUsuario(id) {
    searchId.value = id;
    await buscarUsuario();
}