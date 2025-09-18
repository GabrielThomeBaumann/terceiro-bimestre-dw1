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

// Novos campos do formulário
const usuarioIdInput = document.getElementById('usuario_id');
const dataEmprestimoInput = document.getElementById('data_emprestimo');
const dataDevolucaoPrevistaInput = document.getElementById('data_devolucao_prevista');
const dataDevolucaoRealInput = document.getElementById('data_devolucao_real');
const statusInput = document.getElementById('status');


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
    searchId.disabled = bloquearPrimeiro; // ID de busca sempre controlável
    usuarioIdInput.disabled = !bloquearPrimeiro;
    dataEmprestimoInput.disabled = !bloquearPrimeiro;
    dataDevolucaoPrevistaInput.disabled = !bloquearPrimeiro;
    dataDevolucaoRealInput.disabled = !bloquearPrimeiro;
    statusInput.disabled = !bloquearPrimeiro;
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    searchId.disabled = false;
    currentEmprestimoId = null;
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
    limparFormulario(); // Limpa antes de buscar para evitar dados antigos
    searchId.value = id; // Mantém o ID buscado no campo
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimo/${id}`);

        if (response.ok) {
            const emprestimo = await response.json();
            preencherFormulario(emprestimo);

            mostrarBotoes(true, false, true, true, false, true); // Buscar, Alterar, Excluir, Cancelar
            mostrarMensagem('Empréstimo encontrado!', 'success');
            bloquearCampos(true); // Bloqueia campos para visualização
            searchId.disabled = false; // Mantém o campo de busca habilitado
            currentEmprestimoId = emprestimo.emprestimo_id;

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Empréstimo não encontrado. Você pode incluir um novo empréstimo.', 'info');
            bloquearCampos(false); // Libera campos para inclusão
            searchId.disabled = false;
            usuarioIdInput.focus();
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
    usuarioIdInput.value = emprestimo.usuario_id || '';
    dataEmprestimoInput.value = emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : '';
    dataDevolucaoPrevistaInput.value = emprestimo.data_devolucao_prevista ? emprestimo.data_devolucao_prevista.split('T')[0] : '';
    dataDevolucaoRealInput.value = emprestimo.data_devolucao_real ? emprestimo.data_devolucao_real.split('T')[0] : '';
    statusInput.value = emprestimo.status || 'ativo';
}

// Função para iniciar inclusão de empréstimo
function incluirEmprestimo() {
    mostrarMensagem('Digite os dados para o novo empréstimo!', 'info');
    limparFormulario();
    bloquearCampos(true); // Bloqueia o ID de busca, libera os outros
    searchId.disabled = true; // Desabilita o campo de ID para inclusão
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    usuarioIdInput.focus();
    operacao = 'incluir';
}

// Função para iniciar alteração de empréstimo
function alterarEmprestimo() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e salve!', 'info');
    bloquearCampos(true); // Bloqueia o ID de busca, libera os outros
    searchId.disabled = true; // Desabilita o campo de ID para alteração
    usuarioIdInput.focus();
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'alterar';
}

// Função para iniciar exclusão de empréstimo
function excluirEmprestimo() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(false); // Bloqueia todos os campos para evitar edição acidental
    searchId.disabled = true; // Desabilita o campo de ID
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
    bloquearCampos(false); // Libera o campo de busca, bloqueia os outros
    searchId.disabled = false;
    searchId.focus();
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para salvar inclusão, alteração ou exclusão
async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const emprestimoData = {
        usuario_id: parseInt(usuarioIdInput.value),
        data_emprestimo: dataEmprestimoInput.value,
        data_devolucao_prevista: dataDevolucaoPrevistaInput.value,
        data_devolucao_real: dataDevolucaoRealInput.value || null,
        status: statusInput.value || 'ativo'
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!emprestimoData.usuario_id || !emprestimoData.data_emprestimo || !emprestimoData.data_devolucao_prevista)) {
        mostrarMensagem('ID do Usuário, Data do Empréstimo e Data de Devolução Prevista são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/emprestimo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimoData)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/emprestimo/${currentEmprestimoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimoData)
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
            mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
            bloquearCampos(false); // Libera o campo de busca, bloqueia os outros
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
            <td>${emprestimo.usuario_id}</td>
            <td>${emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : ''}</td>
            <td>${emprestimo.data_devolucao_prevista ? emprestimo.data_devolucao_prevista.split('T')[0] : ''}</td>
            <td>${emprestimo.data_devolucao_real ? emprestimo.data_devolucao_real.split('T')[0] : ''}</td>
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