// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';

let currentEmprestimoId = null;
let currentLivroId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('emprestimoHasLivroForm');
const emprestimoIdInput = document.getElementById('emprestimo_id');
const livroIdInput = document.getElementById('livro_id');
const dataDevolucaoPrevistaInput = document.getElementById('data_devolucao_prevista');
const dataDevolucaoRealizadaInput = document.getElementById('data_devolucao_realizada');

const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const tableBody = document.getElementById('emprestimoHasLivroTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicializar lista ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimoHasLivro();
    resetForm();
});

// Event Listeners
btnIncluir.addEventListener('click', iniciarInclusao);
btnAlterar.addEventListener('click', iniciarAlteracao);
btnExcluir.addEventListener('click', iniciarExclusao);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// Função para resetar formulário e botões
function resetForm() {
    form.reset();
    currentEmprestimoId = null;
    currentLivroId = null;
    operacao = null;
    btnIncluir.style.display = 'inline-block';
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    btnSalvar.style.display = 'none';
    btnCancelar.style.display = 'none';
    habilitarCampos(true);
}

// Habilitar ou desabilitar campos
function habilitarCampos(habilitar) {
    emprestimoIdInput.disabled = !habilitar;
    livroIdInput.disabled = !habilitar;
    dataDevolucaoPrevistaInput.disabled = !habilitar;
    dataDevolucaoRealizadaInput.disabled = !habilitar;
}

// Carregar lista de registros
async function carregarEmprestimoHasLivro() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimohaslivro`);
        if (!response.ok) throw new Error('Erro ao carregar dados');
        const dados = await response.json();
        renderizarTabela(dados);
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar lista', 'error');
    }
}

// Renderizar tabela
function renderizarTabela(dados) {
    tableBody.innerHTML = '';
    dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><button class="btn-id" onclick="selecionarRegistro(${item.emprestimo_id}, ${item.livro_id})">${item.emprestimo_id}</button></td>
            <td>${item.livro_id}</td>
            <td>${item.data_devolucao_prevista ? item.data_devolucao_prevista.split('T')[0] : ''}</td>
            <td>${item.data_devolucao_realizada ? item.data_devolucao_realizada.split('T')[0] : ''}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Selecionar registro para alterar/excluir
async function selecionarRegistro(emprestimoId, livroId) {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimohaslivro/${emprestimoId}/${livroId}`);
        if (!response.ok) throw new Error('Registro não encontrado');
        const item = await response.json();
        preencherFormulario(item);
        operacao = null;
        btnIncluir.style.display = 'none';
        btnAlterar.style.display = 'inline-block';
        btnExcluir.style.display = 'inline-block';
        btnSalvar.style.display = 'none';
        btnCancelar.style.display = 'inline-block';
        habilitarCampos(false);
        currentEmprestimoId = emprestimoId;
        currentLivroId = livroId;
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar registro', 'error');
    }
}

// Preencher formulário com dados
function preencherFormulario(item) {
    emprestimoIdInput.value = item.emprestimo_id;
    livroIdInput.value = item.livro_id;
    dataDevolucaoPrevistaInput.value = item.data_devolucao_prevista ? item.data_devolucao_prevista.split('T')[0] : '';
    dataDevolucaoRealizadaInput.value = item.data_devolucao_realizada ? item.data_devolucao_realizada.split('T')[0] : '';
}

// Iniciar inclusão
function iniciarInclusao() {
    resetForm();
    operacao = 'incluir';
    btnIncluir.style.display = 'none';
    btnSalvar.style.display = 'inline-block';
    btnCancelar.style.display = 'inline-block';
    habilitarCampos(true);
    emprestimoIdInput.focus();
}

// Iniciar alteração
function iniciarAlteracao() {
    operacao = 'alterar';
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    btnSalvar.style.display = 'inline-block';
    btnCancelar.style.display = 'inline-block';
    habilitarCampos(true);
    emprestimoIdInput.disabled = true; // IDs não podem ser alterados
    livroIdInput.disabled = true;
}

// Iniciar exclusão
function iniciarExclusao() {
    operacao = 'excluir';
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    btnSalvar.style.display = 'inline-block';
    btnCancelar.style.display = 'inline-block';
    habilitarCampos(false);
}

// Cancelar operação
function cancelarOperacao() {
    resetForm();
    limparFormulario();
    carregarEmprestimoHasLivro();
}

// Limpar formulário
function limparFormulario() {
    form.reset();
}

// Salvar operação (incluir, alterar, excluir)
async function salvarOperacao() {
    const emprestimo_id = parseInt(emprestimoIdInput.value);
    const livro_id = parseInt(livroIdInput.value);
    const data_devolucao_prevista = dataDevolucaoPrevistaInput.value || null;
    const data_devolucao_realizada = dataDevolucaoRealizadaInput.value || null;

    if (!emprestimo_id || !livro_id || (operacao !== 'excluir' && !data_devolucao_prevista)) {
        mostrarMensagem('Preencha os campos obrigatórios', 'warning');
        return;
    }

    const body = {
        emprestimo_id,
        livro_id,
        data_devolucao_prevista,
        data_devolucao_realizada
    };

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/emprestimohaslivro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/emprestimohaslivro/${currentEmprestimoId}/${currentLivroId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/emprestimohaslivro/${currentEmprestimoId}/${currentLivroId}`, {
                method: 'DELETE'
            });
        } else {
            mostrarMensagem('Nenhuma operação selecionada', 'warning');
            return;
        }

        if (response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            resetForm();
            carregarEmprestimoHasLivro();
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro na operação', 'error');
    }
}