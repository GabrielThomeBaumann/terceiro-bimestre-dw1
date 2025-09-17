// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentUsuarioId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('usuariosForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const usuariosTableBody = document.getElementById('usuariosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de usuários ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarUsuario);
btnIncluir.addEventListener('click', incluirUsuario);
btnAlterar.addEventListener('click', alterarUsuario);
btnExcluir.addEventListener('click', excluirUsuario);
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

// Função para buscar usuário por ID
async function buscarUsuario() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);

        if (response.ok) {
            const usuario = await response.json();
            preencherFormulario(usuario);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Usuário encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Usuário não encontrado. Você pode incluir um novo usuário.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar usuário');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar usuário', 'error');
    }
}

// Função para preencher formulário com dados do usuário
function preencherFormulario(usuario) {
    currentUsuarioId = usuario.usuario_id;
    searchId.value = usuario.usuario_id;
    document.getElementById('nome').value = usuario.nome || '';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('senha').value = ''; // Por segurança, não preenche a senha
    document.getElementById('tipo_usuario').value = usuario.tipo_usuario || '';
}

// Função para iniciar inclusão de usuário
function incluirUsuario() {
    mostrarMensagem('Digite os dados!', 'info');
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome').focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de usuário
function alterarUsuario() {
    mostrarMensagem('Digite os dados para alterar!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome').focus();
    operacao = 'alterar';
}

// Função para iniciar exclusão de usuário
function excluirUsuario() {
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

    const usuario = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value,
        tipo_usuario: document.getElementById('tipo_usuario').value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!usuario.nome || !usuario.email || !usuario.senha)) {
        mostrarMensagem('Nome, email e senha são obrigatórios', 'warning');
        return;
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
            // Se senha estiver vazia, não enviar para não alterar
            if (!usuario.senha) {
                delete usuario.senha;
            }
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
            if (operacao === 'excluir') {
                mostrarMensagem('Usuário excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Usuário ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarUsuarios();
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

// Função para carregar lista de usuários
async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (response.ok) {
            const usuarios = await response.json();
            renderizarTabelaUsuarios(usuarios);
        } else {
            throw new Error('Erro ao carregar usuários');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de usuários', 'error');
    }
}

// Função para renderizar tabela de usuários
function renderizarTabelaUsuarios(usuarios) {
    usuariosTableBody.innerHTML = '';

    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarUsuario(${usuario.usuario_id})">${usuario.usuario_id}</button>
            </td>
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.tipo_usuario || ''}</td>
        `;
        usuariosTableBody.appendChild(row);
    });
}

// Função para selecionar usuário da tabela
async function selecionarUsuario(id) {
    searchId.value = id;
    await buscarUsuario();
}