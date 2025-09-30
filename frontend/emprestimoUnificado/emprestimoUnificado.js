const API_BASE_URL = 'http://localhost:3001';

// Elementos do DOM
const form = document.getElementById('emprestimoUnificadoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const messageContainer = document.getElementById('messageContainer');

// Campos do formulário principal
const usuarioIdInput = document.getElementById('usuario_id');
const dataEmprestimoInput = document.getElementById('data_emprestimo');
const dataDevolucaoPrevistaInput = document.getElementById('data_devolucao_prevista');
const dataDevolucaoRealInput = document.getElementById('data_devolucao_real');
const statusInput = document.getElementById('status');

// Tabelas de livros
const availableBooksTableBody = document.getElementById('availableBooksTableBody');
const associatedBooksTableBody = document.getElementById('associatedBooksTableBody');
const allEmprestimosTableBody = document.getElementById('allEmprestimosTableBody');

let currentEmprestimoId = null;
let operacao = null; // 'incluir', 'alterar', 'excluir'
let associatedBookIds = new Set(); // Para controlar os IDs dos livros associados

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarTodosEmprestimos();
    carregarTodosLivrosDisponiveis();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
    bloquearCamposFormulario(false); // Libera o campo de busca, bloqueia os outros
    bloquearGerenciamentoLivros(true); // Bloqueia as tabelas de livros inicialmente
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEmprestimoUnificado);
btnIncluir.addEventListener('click', incluirEmprestimoUnificado);
btnAlterar.addEventListener('click', alterarEmprestimoUnificado);
btnExcluir.addEventListener('click', excluirEmprestimoUnificado);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// --- Funções de UI ---

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCamposFormulario(bloquear) {
    // searchId.disabled = bloquear; // O campo de busca deve ser controlado separadamente
    usuarioIdInput.disabled = bloquear;
    dataEmprestimoInput.disabled = bloquear;
    dataDevolucaoPrevistaInput.disabled = bloquear;
    dataDevolucaoRealInput.disabled = bloquear;
    statusInput.disabled = bloquear;
}

function bloquearGerenciamentoLivros(bloquear) {
    // Bloqueia/desbloqueia as tabelas de livros
    availableBooksTableBody.querySelectorAll('button').forEach(btn => btn.disabled = bloquear);
    associatedBooksTableBody.querySelectorAll('button').forEach(btn => btn.disabled = bloquear);
}

function limparFormulario() {
    form.reset();
    searchId.value = '';
    currentEmprestimoId = null;
    operacao = null;
    associatedBookIds.clear();
    renderizarLivrosAssociados([]); // Limpa a lista de livros associados
    carregarTodosLivrosDisponiveis(); // Recarrega os livros disponíveis
    bloquearCamposFormulario(true); // Bloqueia os campos do formulário
    bloquearGerenciamentoLivros(true); // Bloqueia as tabelas de livros
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function formatarDataParaInput(dataString) {
    if (!dataString) return '';
    return new Date(dataString).toISOString().split('T')[0];
}

// --- Funções de Carregamento de Dados ---

async function carregarTodosEmprestimos() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado`);
        if (!response.ok) throw new Error('Erro ao carregar empréstimos unificados');
        const emprestimos = await response.json();
        renderizarTodosEmprestimos(emprestimos);
    } catch (error) {
        console.error('Erro ao carregar todos os empréstimos:', error);
        mostrarMensagem('Erro ao carregar lista de empréstimos', 'error');
    }
}

function renderizarTodosEmprestimos(emprestimos) {
    allEmprestimosTableBody.innerHTML = '';
    emprestimos.forEach(emp => {
        const tr = document.createElement('tr');
        const livros = emp.livros_associados ? emp.livros_associados.map(l => l.titulo).join(', ') : 'Nenhum';
        tr.innerHTML = `
            <td><button class="btn-id" onclick="selecionarEmprestimoUnificado(${emp.emprestimo_id})">${emp.emprestimo_id}</button></td>
            <td>${emp.usuario_id}</td>
            <td>${formatarDataParaInput(emp.data_emprestimo)}</td>
            <td>${formatarDataParaInput(emp.data_devolucao_prevista)}</td>
            <td>${emp.status}</td>
            <td>${livros}</td>
        `;
        allEmprestimosTableBody.appendChild(tr);
    });
}

async function carregarTodosLivrosDisponiveis() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado/livros/todos`);
        if (!response.ok) throw new Error('Erro ao carregar livros disponíveis');
        const livros = await response.json();
        renderizarLivrosDisponiveis(livros);
    } catch (error) {
        console.error('Erro ao carregar livros disponíveis:', error);
        mostrarMensagem('Erro ao carregar livros disponíveis', 'error');
    }
}

function renderizarLivrosDisponiveis(livros) {
    availableBooksTableBody.innerHTML = '';
    livros.forEach(livro => {
        // Só adiciona se o livro não estiver já associado
        if (!associatedBookIds.has(livro.livro_id)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${livro.livro_id}</td>
                <td>${livro.titulo}</td>
                <td><button class="btn-add btn-small" onclick="adicionarLivro(${livro.livro_id}, '${livro.titulo}')" ${operacao === null ? 'disabled' : ''}>Adicionar</button></td>
            `;
            availableBooksTableBody.appendChild(tr);
        }
    });
}

function renderizarLivrosAssociados(livros) {
    associatedBooksTableBody.innerHTML = '';
    associatedBookIds.clear(); // Limpa o set antes de preencher
    livros.forEach(livro => {
        associatedBookIds.add(livro.livro_id); // Adiciona ao set
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${livro.livro_id}</td>
            <td>${livro.titulo}</td>
            <td><button class="btn-remove btn-small" onclick="removerLivro(${livro.livro_id}, '${livro.titulo}')" ${operacao === null ? 'disabled' : ''}>Remover</button></td>
        `;
        associatedBooksTableBody.appendChild(tr);
    });
    // Após renderizar os associados, atualiza os disponíveis para remover os já associados
    carregarTodosLivrosDisponiveis();
}

// --- Funções de Gerenciamento de Livros (Adicionar/Remover) ---

function adicionarLivro(livro_id, titulo) {
    if (associatedBookIds.has(livro_id)) {
        mostrarMensagem('Este livro já está associado.', 'warning');
        return;
    }
    associatedBookIds.add(livro_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${livro_id}</td>
        <td>${titulo}</td>
        <td><button class="btn-remove btn-small" onclick="removerLivro(${livro_id}, '${titulo}')" ${operacao === null ? 'disabled' : ''}>Remover</button></td>
    `;
    associatedBooksTableBody.appendChild(tr);
    // Remove o livro da lista de disponíveis
    const availableRow = availableBooksTableBody.querySelector(`tr button[onclick*="adicionarLivro(${livro_id}"]`).closest('tr');
    if (availableRow) {
        availableRow.remove();
    }
}

function removerLivro(livro_id, titulo) {
    if (!associatedBookIds.has(livro_id)) {
        mostrarMensagem('Este livro não está associado.', 'warning');
        return;
    }
    associatedBookIds.delete(livro_id);
    // Remove o livro da lista de associados
    const associatedRow = associatedBooksTableBody.querySelector(`tr button[onclick*="removerLivro(${livro_id}"]`).closest('tr');
    if (associatedRow) {
        associatedRow.remove();
    }
    // Adiciona o livro de volta à lista de disponíveis
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${livro_id}</td>
        <td>${titulo}</td>
        <td><button class="btn-add btn-small" onclick="adicionarLivro(${livro_id}, '${titulo}')" ${operacao === null ? 'disabled' : ''}>Adicionar</button></td>
    `;
    availableBooksTableBody.appendChild(tr);
}

// --- Funções CRUD ---

async function buscarEmprestimoUnificado() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    limparFormulario(); // Limpa antes de buscar para evitar dados antigos
    searchId.value = id; // Mantém o ID buscado no campo
    searchId.disabled = false; // Garante que o campo de busca esteja habilitado

    try {
        const response = await fetch(`${API_BASE_URL}/emprestimoUnificado/${id}`);
        if (response.ok) {
            const emprestimo = await response.json();
            preencherFormulario(emprestimo);
            mostrarBotoes(true, false, true, true, false, true); // Buscar, Alterar, Excluir, Cancelar
            mostrarMensagem('Empréstimo encontrado!', 'success');
            bloquearCamposFormulario(true); // Bloqueia campos para visualização
            bloquearGerenciamentoLivros(true); // Bloqueia gerenciamento de livros para visualização
            currentEmprestimoId = emprestimo.emprestimo_id;

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Empréstimo não encontrado. Você pode incluir um novo.', 'info');
            bloquearCamposFormulario(false); // Libera campos para inclusão
            bloquearGerenciamentoLivros(false); // Libera gerenciamento de livros
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
    dataEmprestimoInput.value = formatarDataParaInput(emprestimo.data_emprestimo);
    dataDevolucaoPrevistaInput.value = formatarDataParaInput(emprestimo.data_devolucao_prevista);
    dataDevolucaoRealInput.value = formatarDataParaInput(emprestimo.data_devolucao_real);
    statusInput.value = emprestimo.status || 'ativo';

    // Preenche os livros associados
    renderizarLivrosAssociados(emprestimo.livros_associados || []);
}

function incluirEmprestimoUnificado() {
    mostrarMensagem('Preencha os dados e associe os livros para o novo empréstimo!', 'info');
    limparFormulario();
    searchId.disabled = true; // Desabilita o campo de busca para inclusão
    bloquearCamposFormulario(false); // Libera campos do formulário
    bloquearGerenciamentoLivros(false); // Libera gerenciamento de livros
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    usuarioIdInput.focus();
    operacao = 'incluir';
}

function alterarEmprestimoUnificado() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e/ou livros associados e salve!', 'info');
    searchId.disabled = true; // Desabilita o campo de busca para alteração
    bloquearCamposFormulario(false); // Libera campos do formulário
    bloquearGerenciamentoLivros(false); // Libera gerenciamento de livros
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    usuarioIdInput.focus();
    operacao = 'alterar';
}

function excluirEmprestimoUnificado() {
    if (!currentEmprestimoId) {
        mostrarMensagem('Selecione um empréstimo para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    searchId.disabled = true; // Desabilita o campo de busca
    bloquearCamposFormulario(true); // Bloqueia campos do formulário
    bloquearGerenciamentoLivros(true); // Bloqueia gerenciamento de livros
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
    searchId.disabled = false; // Libera o campo de busca
    searchId.focus();
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
        livro_ids: Array.from(associatedBookIds) // Envia os IDs dos livros associados
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
            carregarTodosEmprestimos();
            mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
            searchId.disabled = false; // Libera o campo de busca
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

// Função para selecionar empréstimo da tabela inferior
async function selecionarEmprestimoUnificado(id) {
    searchId.value = id;
    await buscarEmprestimoUnificado();
}