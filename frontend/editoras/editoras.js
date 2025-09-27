// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentEditoraId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('editorasForm');
const searchId = document.getElementById('searchId'); // Agora é um <select>
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const editorasTableBody = document.getElementById('editorasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Campos do formulário
const nomeEditoraInput = document.getElementById('nome_editora');
const cidadeEditoraInput = document.getElementById('cidade_editora');
const anoFundacaoEditoraInput = document.getElementById('ano_fundacao_editora');

// Carregar lista de editoras ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarEditoras();
    carregarEditorasNoComboBox(); // Nova função para popular o combobox
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEditora);
btnIncluir.addEventListener('click', incluirEditora);
btnAlterar.addEventListener('click', alterarEditora);
btnExcluir.addEventListener('click', excluirEditora);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Adicionar listener para o combobox de busca
searchId.addEventListener('change', () => {
    if (searchId.value) {
        buscarEditora();
    } else {
        limparFormulario();
        mostrarBotoes(true, true, false, false, false, false); // Permite incluir se nada estiver selecionado
        bloquearCampos(false);
    }
});

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    // O combobox de busca (searchId) deve estar sempre habilitado para seleção
    searchId.disabled = false; 
    
    nomeEditoraInput.disabled = !bloquearPrimeiro;
    cidadeEditoraInput.disabled = !bloquearPrimeiro;
    anoFundacaoEditoraInput.disabled = !bloquearPrimeiro;
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    currentEditoraId = null;
    // Não resetar o combobox de busca, apenas a seleção
    searchId.value = ""; 
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para buscar editora por ID
async function buscarEditora() {
    const id = searchId.value; // Pega o valor selecionado no combobox
    if (!id) {
        mostrarMensagem('Selecione um ID para buscar', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/editoras/${id}`);

        if (response.ok) {
            const editora = await response.json();
            preencherFormulario(editora);
            mostrarBotoes(true, false, true, true, false, true); // Buscar, Alterar, Excluir, Cancelar
            mostrarMensagem('Editora encontrada!', 'success');
            bloquearCampos(true); // Bloqueia campos para visualização
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id; // Mantém o ID selecionado no combobox
            mostrarBotoes(true, true, false, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Editora não encontrada.', 'info');
            bloquearCampos(false); // Libera campos para inclusão
            nomeEditoraInput.focus();
        } else {
            throw new Error('Erro ao buscar editora');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar editora', 'error');
    }
}

// Função para preencher formulário com dados da editora
function preencherFormulario(editora) {
    currentEditoraId = editora.editora_id;
    searchId.value = editora.editora_id; // Seleciona o ID no combobox
    nomeEditoraInput.value = editora.nome || '';
    cidadeEditoraInput.value = editora.cidade || '';
    anoFundacaoEditoraInput.value = editora.ano_fundacao || '';
}

// Função para incluir editora
function incluirEditora() {
    mostrarMensagem('Digite os dados para a nova editora!', 'info');
    limparFormulario(); // Limpa o formulário e deseleciona o combobox
    bloquearCampos(true); // Bloqueia o combobox de busca, libera os outros
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    nomeEditoraInput.focus();
    operacao = 'incluir';
}

// Função para alterar editora
function alterarEditora() {
    if (!currentEditoraId) {
        mostrarMensagem('Selecione uma editora para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e salve!', 'info');
    bloquearCampos(true); // Bloqueia o combobox de busca, libera os outros
    nomeEditoraInput.focus();
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'alterar';
}

// Função para excluir editora
function excluirEditora() {
    if (!currentEditoraId) {
        mostrarMensagem('Selecione uma editora para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(false); // Bloqueia todos os campos para evitar edição acidental
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
    bloquearCampos(false); // Libera o combobox de busca, bloqueia os outros
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

    const editoraData = {
        nome: nomeEditoraInput.value.trim(),
        cidade: cidadeEditoraInput.value.trim(),
        ano_fundacao: parseInt(anoFundacaoEditoraInput.value) || null
    };

    if ((operacao === 'incluir' || operacao === 'alterar') && (!editoraData.nome || !editoraData.cidade || !editoraData.ano_fundacao)) {
        mostrarMensagem('Nome, cidade e ano de fundação são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/editoras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editoraData)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editoraData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            if (operacao === 'excluir') {
                mostrarMensagem('Editora excluída com sucesso!', 'success');
            } else {
                mostrarMensagem(`Editora ${operacao} com sucesso!`, 'success');
            }
            limparFormulario();
            carregarEditoras();
            carregarEditorasNoComboBox(); // Recarrega o combobox após alteração
            mostrarBotoes(true, false, false, false, false, false); // Apenas Buscar
            bloquearCampos(false); // Libera o combobox de busca, bloqueia os outros
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

// Função para carregar lista de editoras na tabela
async function carregarEditoras() {
    try {
        const response = await fetch(`${API_BASE_URL}/editoras`);
        if (response.ok) {
            const editoras = await response.json();
            renderizarTabelaEditoras(editoras);
        } else {
            throw new Error('Erro ao carregar editoras');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de editoras', 'error');
    }
}

// Função para renderizar tabela de editoras
function renderizarTabelaEditoras(editoras) {
    editorasTableBody.innerHTML = '';

    editoras.forEach(editora => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarEditora(${editora.editora_id})">
                            ${editora.editora_id}
                        </button>
                    </td>
                    <td>${editora.nome}</td>
                    <td>${editora.cidade}</td>
                    <td>${editora.ano_fundacao}</td>
                `;
        editorasTableBody.appendChild(row);
    });
}

// Função para selecionar editora da tabela (e preencher o combobox)
async function selecionarEditora(id) {
    searchId.value = id; // Define o valor selecionado no combobox
    await buscarEditora();
}

// NOVA FUNÇÃO: Carregar editoras no combobox de busca
async function carregarEditorasNoComboBox() {
    try {
        const response = await fetch(`${API_BASE_URL}/editoras`);
        if (response.ok) {
            const editoras = await response.json();
            searchId.innerHTML = '<option value="">Selecione um ID</option>'; // Opção padrão

            editoras.forEach(editora => {
                const option = document.createElement('option');
                option.value = editora.editora_id;
                option.textContent = `${editora.editora_id} - ${editora.nome}`;
                searchId.appendChild(option);
            });
        } else {
            throw new Error('Erro ao carregar editoras para o combobox');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar IDs de editoras', 'error');
    }
}