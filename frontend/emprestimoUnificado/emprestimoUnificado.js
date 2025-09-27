const API_BASE_URL = 'http://localhost:3001';
let currentEmprestimoId = null;
let operacao = null;
let todosLivrosDisponiveis = []; // Armazena todos os livros para o select
let livrosAssociados = []; // Armazena os livros atualmente associados ao empréstimo no formulário

// Elementos do DOM
const form = document.getElementById('emprestimoUnificadoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const emprestimosTableBody = document.getElementById('emprestimosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Campos do formulário de empréstimo
const usuarioIdInput = document.getElementById('usuario_id');
const dataEmprestimoInput = document.getElementById('data_emprestimo');
const dataDevolucaoPrevistaInput = document.getElementById('data_devolucao_prevista');
const dataDevolucaoRealInput = document.getElementById('data_devolucao_real');
const statusInput = document.getElementById('status');

// Campos e lista de livros associados
const livroSelect = document.getElementById('livroSelect');
const livroDataDevolucaoPrevistaInput = document.getElementById('livroDataDevolucaoPrevista');
const btnAddLivro = document.getElementById('btnAddLivro');
const listaLivrosAssociados = document.getElementById('listaLivrosAssociados');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimos();
    carregarTodosLivros();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCamposEmprestimo(false);
    bloquearCamposLivrosAssociados(true); // Começa bloqueado
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEmprestimo);
btnIncluir.addEventListener('click', incluirEmprestimo);
btnAlterar.addEventListener('click', alterarEmprestimo);
btnExcluir.addEventListener('click', excluirEmprestimo);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);
btnAddLivro.addEventListener('click', adicionarLivroAoEmprestimo);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCamposEmprestimo(bloquear) {
    searchId.disabled = bloquear;
    usuarioIdInput.disabled = !bloquear;
    dataEmprestimoInput.disabled = !bloquear;
    dataDevolucaoPrevistaInput.disabled = !bloquear;
    dataDevolucaoRealInput.disabled = !bloquear;
    statusInput.disabled = !bloquear;
}

function bloquearCamposLivrosAssociados(bloquear) {
    livroSelect.disabled = bloquear;
    livroDataDevolucaoPrevistaInput.disabled = bloquear;
    btnAddLivro.disabled = bloquear;
    // Os botões de remover livros individuais são controlados dinamicamente
}

function limparFormulario() {
    form.reset();
    searchId.value = '';
    currentEmprestimoId = null;
    livrosAssociados = [];
    renderizarLivrosAssociados();
    bloquearCamposEmprestimo(false);
    bloquearCamposLivrosAssociados(true);
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function carregarTodosLivros() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado/livros/todos`);
        if (!response.ok) throw new Error('Erro ao carregar livros');
        todosLivrosDisponiveis = await response.json();

        livroSelect.innerHTML = '<option value="">Selecione um livro</option>';
        todosLivrosDisponiveis.forEach(livro => {
            const option = document.createElement('option');
            option.value = livro.livro_id;
            option.textContent = `${livro.titulo} (ID: ${livro.livro_id})`;
            livroSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar todos os livros:', error);
        mostrarMensagem('Erro ao carregar lista de livros', 'error');
    }
}

function renderizarLivrosAssociados() {
    listaLivrosAssociados.innerHTML = '';
    livrosAssociados.forEach(livro => {
        const li = document.createElement('li');
        li.setAttribute('data-livro-id', livro.livro_id);
        li.innerHTML = `
            <div class="livro-info">
                <span class="titulo">${livro.titulo} (ID: ${livro.livro_id})</span>
                <span class="datas">Dev. Prevista: ${livro.data_devolucao_prevista_livro || 'N/A'} | Dev. Realizada: ${livro.data_devolucao_realizada_livro || 'N/A'}</span>
            </div>
            <button type="button" class="remove-livro-btn" data-livro-id="${livro.livro_id}">Remover</button>
        `;
        listaLivrosAssociados.appendChild(li);
    });

    document.querySelectorAll('.remove-livro-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const livroIdToRemove = parseInt(event.target.dataset.livroId);
            livrosAssociados = livrosAssociados.filter(l => l.livro_id !== livroIdToRemove);
            renderizarLivrosAssociados();
        });
    });
}

function adicionarLivroAoEmprestimo() {
    const selectedLivroId = parseInt(livroSelect.value);
    const dataDevolucaoPrevista = livroDataDevolucaoPrevistaInput.value;

    if (isNaN(selectedLivroId) || !dataDevolucaoPrevista) {
        mostrarMensagem('Selecione um livro e informe a data de devolução prevista.', 'warning');
        return;
    }

    const livroExistente = livrosAssociados.find(l => l.livro_id === selectedLivroId);
    if (livroExistente) {
        mostrarMensagem('Este livro já foi adicionado ao empréstimo.', 'warning');
        return;
    }

    const livroInfo = todosLivrosDisponiveis.find(l => l.livro_id === selectedLivroId);
    if (livroInfo) {
        livrosAssociados.push({
            livro_id: selectedLivroId,
            titulo: livroInfo.titulo,
            data_devolucao_prevista_livro: dataDevolucaoPrevista,
            data_devolucao_realizada_livro: null // Inicialmente nulo
        });
        renderizarLivrosAssociados();
        livroSelect.value = '';
        livroDataDevolucaoPrevistaInput.value = '';
    }
}

async function buscarEmprestimo() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    limparFormulario();
    searchId.value = id;
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado/${id}`);

        if (response.ok) {
            const emprestimo = await response.json();
            preencherFormulario(emprestimo);
            mostrarBotoes(true, false, true, true, false, true);
            mostrarMensagem('Empréstimo encontrado!', 'success');
            bloquearCamposEmprestimo(true);
            bloquearCamposLivrosAssociados(false); // Libera para alteração
            searchId.disabled = false;
            currentEmprestimoId = emprestimo.emprestimo_id;

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, true);
            mostrarMensagem('Empréstimo não encontrado. Você pode incluir um novo empréstimo.', 'info');
            bloquearCamposEmprestimo(false);
            bloquearCamposLivrosAssociados(false); // Libera para inclusão
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

function preencherFormulario(emprestimo) {
    currentEmprestimoId = emprestimo.emprestimo_id;
    searchId.value = emprestimo.emprestimo_id;
    usuarioIdInput.value = emprestimo.usuario_id || '';
    dataEmprestimoInput.value = emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : '';
    dataDevolucaoPrevistaInput.value = emprestimo.data_devolucao_prevista ? emprestimo.data_devolucao_prevista.split('T')[0] : '';
    dataDevolucaoRealInput.value = emprestimo.data_devolucao_real ? emprestimo.data_devolucao_real.split('T')[0] : '';
    statusInput.value = emprestimo.status || 'ativo';

    livrosAssociados = emprestimo.livros_associados || [];
    renderizarLivrosAssociados();
}

function incluirEmprestimo() {
    mostrarMensagem('Digite os dados para o novo empréstimo e adicione os livros!', 'info');
    limparFormulario();
    bloquearCamposEmprestimo(true);
    bloquearCamposLivrosAssociados(false);
    searchId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    usuarioIdInput.focus();
    operacao = 'incluir';
}

function alterarEmprestimo() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados do empréstimo e/ou os livros associados e salve!', 'info');
    bloquearCamposEmprestimo(true);
    bloquearCamposLivrosAssociados(false);
    searchId.disabled = true;
    usuarioIdInput.focus();
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'alterar';
}

function excluirEmprestimo() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar! Todas as associações de livros serão removidas.', 'warning');
    bloquearCamposEmprestimo(false);
    bloquearCamposLivrosAssociados(true); // Bloqueia a edição de livros ao excluir
    searchId.disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCamposEmprestimo(false);
    bloquearCamposLivrosAssociados(true);
    searchId.disabled = false;
    searchId.focus();
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

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
        status: statusInput.value || 'ativo',
        livros: livrosAssociados.map(livro => ({
            livro_id: livro.livro_id,
            data_devolucao_prevista_livro: livro.data_devolucao_prevista_livro,
            data_devolucao_realizada_livro: livro.data_devolucao_realizada_livro
        }))
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!emprestimoData.usuario_id || !emprestimoData.data_emprestimo || !emprestimoData.data_devolucao_prevista)) {
        mostrarMensagem('ID do Usuário, Data do Empréstimo e Data de Devolução Prevista são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/emprestimoUnificado`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimoData)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/emprestimoUnificado/${currentEmprestimoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emprestimoData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/emprestimoUnificado/${currentEmprestimoId}`, {
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
            bloquearCamposEmprestimo(false);
            bloquearCamposLivrosAssociados(true);
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

async function carregarEmprestimos() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado`);
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

function renderizarTabelaEmprestimos(emprestimos) {
    emprestimosTableBody.innerHTML = '';

    emprestimos.forEach(emprestimo => {
        const row = document.createElement('tr');
        const livrosHtml = emprestimo.livros_associados && emprestimo.livros_associados.length > 0 && emprestimo.livros_associados[0].livro_id !== null
            ? emprestimo.livros_associados.map(l => `${l.titulo} (ID: ${l.livro_id})`).join('<br>')
            : 'Nenhum livro';

        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarEmprestimo(${emprestimo.emprestimo_id})">${emprestimo.emprestimo_id}</button>
            </td>
            <td>${emprestimo.usuario_id}</td>
            <td>${emprestimo.data_emprestimo ? emprestimo.data_emprestimo.split('T')[0] : ''}</td>
            <td>${emprestimo.data_devolucao_prevista ? emprestimo.data_devolucao_prevista.split('T')[0] : ''}</td>
            <td>${emprestimo.data_devolucao_real ? emprestimo.data_devolucao_real.split('T')[0] : ''}</td>
            <td>${emprestimo.status || ''}</td>
            <td>${livrosHtml}</td>
        `;
        emprestimosTableBody.appendChild(row);
    });
}

async function selecionarEmprestimo(id) {
    searchId.value = id;
    await buscarEmprestimo();
}