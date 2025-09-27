const API_BASE_URL = 'http://localhost:3001';
let currentEmprestimoId = null;
let currentLivroId = null;
let operacao = null;

const form = document.getElementById('emprestimoHasLivroForm');
const searchEmprestimoId = document.getElementById('searchEmprestimoId');
const searchLivroId = document.getElementById('searchLivroId');
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
const dataDevolucaoPrevistaInput = document.getElementById('data_devolucao_prevista');
const dataDevolucaoRealizadaInput = document.getElementById('data_devolucao_realizada');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarRegistros();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnAlterar.addEventListener('click', alterarRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    searchEmprestimoId.disabled = bloquear;
    searchLivroId.disabled = bloquear;
    emprestimoIdInput.disabled = !bloquear;
    livroIdInput.disabled = !bloquear;
    dataDevolucaoPrevistaInput.disabled = !bloquear;
    dataDevolucaoRealizadaInput.disabled = !bloquear;
}

function limparFormulario() {
    form.reset();
    searchEmprestimoId.value = '';
    searchLivroId.value = '';
    currentEmprestimoId = null;
    currentLivroId = null;
    bloquearCampos(false); // Libera os campos de busca
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
    const emprestimo_id = searchEmprestimoId.value.trim();
    const livro_id = searchLivroId.value.trim();

    if (!emprestimo_id || !livro_id) {
        mostrarMensagem('Digite o ID do Empréstimo e o ID do Livro para buscar', 'warning');
        return;
    }
    
    limparFormulario(); // Limpa antes de buscar para evitar dados antigos
    searchEmprestimoId.value = emprestimo_id; // Mantém os IDs buscados nos campos
    searchLivroId.value = livro_id;
    searchEmprestimoId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${emprestimo_id}/${livro_id}`);
        if (response.ok) {
            const registro = await response.json();
            preencherFormulario(registro);
            mostrarBotoes(true, false, true, true, false, true); // Buscar, Alterar, Excluir, Cancelar
            mostrarMensagem('Registro encontrado!', 'success');
            bloquearCampos(true); // Bloqueia campos para visualização
            searchEmprestimoId.disabled = false; // Mantém os campos de busca habilitados
            searchLivroId.disabled = false;
            currentEmprestimoId = registro.emprestimo_id;
            currentLivroId = registro.livro_id;

        } else if (response.status === 404) {
            limparFormulario();
            searchEmprestimoId.value = emprestimo_id;
            searchLivroId.value = livro_id;
            mostrarBotoes(true, true, false, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Associação não encontrada. Você pode incluir uma nova.', 'info');
            bloquearCampos(false); // Libera campos para inclusão
            searchEmprestimoId.disabled = false;
            searchLivroId.disabled = false;
            emprestimoIdInput.focus();
        } else {
            throw new Error('Erro ao buscar registro');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar registro', 'error');
    }
}

// Função para preencher formulário com dados do registro
function preencherFormulario(registro) {
    currentEmprestimoId = registro.emprestimo_id;
    currentLivroId = registro.livro_id;
    searchEmprestimoId.value = registro.emprestimo_id;
    searchLivroId.value = registro.livro_id;
    emprestimoIdInput.value = registro.emprestimo_id || '';
    livroIdInput.value = registro.livro_id || '';
    dataDevolucaoPrevistaInput.value = registro.data_devolucao_prevista ? registro.data_devolucao_prevista.split('T')[0] : '';
    dataDevolucaoRealizadaInput.value = registro.data_devolucao_realizada ? registro.data_devolucao_realizada.split('T')[0] : '';
}

function incluirRegistro() {
    mostrarMensagem('Digite os dados para a nova associação!', 'info');
    limparFormulario();
    bloquearCampos(true); // Bloqueia os IDs de busca, libera os outros
    searchEmprestimoId.disabled = true; // Desabilita os campos de ID para inclusão
    searchLivroId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    emprestimoIdInput.focus();
    operacao = 'incluir';
}

function alterarRegistro() {
    if (!currentEmprestimoId || !currentLivroId) {
        mostrarMensagem('Selecione uma associação para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e salve!', 'info');
    bloquearCampos(true); // Bloqueia os IDs de busca, libera os outros
    searchEmprestimoId.disabled = true; // Desabilita os campos de ID para alteração
    searchLivroId.disabled = true;
    emprestimoIdInput.focus();
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'alterar';
}

function excluirRegistro() {
    if (!currentEmprestimoId || !currentLivroId) {
        mostrarMensagem('Selecione uma associação para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(false); // Bloqueia todos os campos para evitar edição acidental
    searchEmprestimoId.disabled = true; // Desabilita os campos de ID
    searchLivroId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
    bloquearCampos(false); // Libera os campos de busca, bloqueia os outros
    searchEmprestimoId.disabled = false;
    searchLivroId.disabled = false;
    searchEmprestimoId.focus();
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const registroData = {
        emprestimo_id: parseInt(emprestimoIdInput.value),
        livro_id: parseInt(livroIdInput.value),
        data_devolucao_prevista: dataDevolucaoPrevistaInput.value,
        data_devolucao_realizada: dataDevolucaoRealizadaInput.value || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!registroData.emprestimo_id || !registroData.livro_id || !registroData.data_devolucao_prevista)) {
        mostrarMensagem('ID do Empréstimo, ID do Livro e Data de Devolução Prevista são obrigatórios', 'warning');
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
            response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${currentEmprestimoId}/${currentLivroId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/emprestimoHasLivro/${currentEmprestimoId}/${currentLivroId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Associação excluída com sucesso!', 'success');
            } else {
                mostrarMensagem(`Associação ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarRegistros();
            mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
            bloquearCampos(false); // Libera os campos de busca, bloqueia os outros
            searchEmprestimoId.disabled = false;
            searchLivroId.disabled = false;
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
            <td>${registro.emprestimo_id}</td>
            <td>${registro.livro_id}</td>
            <td>${registro.data_devolucao_prevista ? registro.data_devolucao_prevista.split('T')[0] : ''}</td>
            <td>${registro.data_devolucao_realizada ? registro.data_devolucao_realizada.split('T')[0] : ''}</td>
            <td>
                <button class="btn-id" onclick="selecionarRegistro(${registro.emprestimo_id}, ${registro.livro_id})">Selecionar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function selecionarRegistro(emprestimo_id, livro_id) {
    searchEmprestimoId.value = emprestimo_id;
    searchLivroId.value = livro_id;
    await buscarRegistro();
}