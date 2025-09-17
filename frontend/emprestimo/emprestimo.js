// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentEmprestimoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('emprestimoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const emprestimoTableBody = document.getElementById('emprestimoTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de empréstimos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEmprestimo);
btnIncluir.addEventListener('click', incluirEmprestimo);
btnAlterar.addEventListener('click', alterarEmprestimo);
btnExcluir.addEventListener('click', excluirEmprestimo);
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

// Função para buscar empréstimo por ID
async function buscarEmprestimo() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimo/${id}`);

        if (response.ok) {
            const emprestimo = await response.json();
            preencherFormulario(emprestimo);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Empréstimo encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Empréstimo não encontrado. Você pode incluir um novo empréstimo.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar empréstimo');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar empréstimo', 'error');
    }
}

// Função para preencher formulário com dados do empréstimo
function preencherFormulario(emprestimo) {
    currentEmprestimoId = emprestimo.emprestimo_id;
    searchId.value = emprestimo.emprestimo_id;
    document.getElementById('cliente_id').value = emprestimo.cliente_id || '';
    document.getElementById('data_emprestimo').value = emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : '';
    document.getElementById('data_devolucao').value = emprestimo.data_devolucao ? emprestimo.data_devolucao.split('T')[0] : '';
    document.getElementById('status').value = emprestimo.status || '';
}

// Função para iniciar inclusão de empréstimo
function incluirEmprestimo() {
    mostrarMensagem('Digite os dados!', 'info');
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_id').focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de empréstimo
function alterarEmprestimo() {
    mostrarMensagem('Digite os dados para alterar!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_id').focus();
    operacao = 'alterar';
}

// Função para iniciar exclusão de empréstimo
function excluirEmprestimo() {
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

    const emprestimo = {
        cliente_id: parseInt(document.getElementById('cliente_id').value),
        data_emprestimo: document.getElementById('data_emprestimo').value || null,
        data_devolucao: document.getElementById('data_devolucao').value || null,
        status: document.getElementById('status').value.trim() || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!emprestimo.cliente_id || !emprestimo.data_emprestimo)) {
        mostrarMensagem('ID do cliente e data do empréstimo são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/emprestimo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimo)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/emprestimo/${currentEmprestimoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimo)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/emprestimo/${currentEmprestimoId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Empréstimo excluído com sucesso!', 'success');
            } else {
                mostrarMensagem(`Empréstimo ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarEmprestimos();
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

// Função para carregar lista de empréstimos
async function carregarEmprestimos() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimo`);
        if (response.ok) {
            const emprestimos = await response.json();
            renderizarTabelaEmprestimos(emprestimos);
        } else {
            throw new Error('Erro ao carregar empréstimos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de empréstimos', 'error');
    }
}

// Função para renderizar tabela de empréstimos
function renderizarTabelaEmprestimos(emprestimos) {
    emprestimoTableBody.innerHTML = '';

    emprestimos.forEach(emprestimo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarEmprestimo(${emprestimo.emprestimo_id})">${emprestimo.emprestimo_id}</button>
            </td>
            <td>${emprestimo.cliente_id}</td>
            <td>${emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : ''}</td>
            <td>${emprestimo.data_devolucao ? emprestimo.data_devolucao.split('T')[0] : ''}</td>
            <td>${emprestimo.status || ''}</td>
        `;
        emprestimoTableBody.appendChild(row);
    });
}

// Função para selecionar empréstimo da tabela
async function selecionarEmprestimo(id) {
    searchId.value = id;
    await buscarEmprestimo();
}