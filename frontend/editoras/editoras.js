// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentEditoraId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('editorasForm');
const searchId = document.getElementById('searchId'); // Agora é um <input type="number">
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
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // Buscar e Incluir visíveis inicialmente
    bloquearCampos(true); // Bloqueia campos de dados inicialmente, libera searchId para busca
    searchId.focus(); // Foco no campo de busca
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEditora);
btnIncluir.addEventListener('click', incluirEditora);
btnAlterar.addEventListener('click', alterarEditora);
btnExcluir.addEventListener('click', excluirEditora);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Adicionar listener para Enter no campo de busca
searchId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarEditora();
    }
});

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `message ${tipo}`;
    mensagemDiv.textContent = texto;
    messageContainer.appendChild(mensagemDiv);
    
    // Remove a mensagem após 3 segundos
    setTimeout(() => {
        if (messageContainer.contains(mensagemDiv)) {
            messageContainer.removeChild(mensagemDiv);
        }
    }, 3000);
}

// Função para controlar o bloqueio/desbloqueio de campos
// bloquearDados = true: bloqueia campos de dados (nome, cidade, ano), libera searchId
// bloquearDados = false: libera campos de dados, bloqueia searchId
function bloquearCampos(bloquearDados) {
    searchId.disabled = !bloquearDados; // Inverso: quando dados bloqueados, searchId liberado
    nomeEditoraInput.disabled = bloquearDados;
    cidadeEditoraInput.disabled = bloquearDados;
    anoFundacaoEditoraInput.disabled = bloquearDados;
}

// Função para limpar o formulário
function limparFormulario() {
    form.reset();
    currentEditoraId = null;
    searchId.value = ''; // Limpa o input de busca
}

// Função para mostrar/ocultar botões
function mostrarBotoes(mostrarBuscar, mostrarIncluir, mostrarAlterar, mostrarExcluir, mostrarSalvar, mostrarCancelar) {
    btnBuscar.style.display = mostrarBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = mostrarIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = mostrarAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = mostrarExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = mostrarSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = mostrarCancelar ? 'inline-block' : 'none';
}

// Função para carregar todas as editoras na tabela
async function carregarEditoras() {
    try {
        const response = await fetch(`${API_BASE_URL}/editoras`);
        if (response.ok) {
            const editoras = await response.json();
            editorasTableBody.innerHTML = ''; // Limpa a tabela

            editoras.forEach(editora => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${editora.editora_id}</td>
                    <td>${editora.nome || ''}</td>
                    <td>${editora.cidade || ''}</td>
                    <td>${editora.ano_fundacao || ''}</td>
                `;
                // Adiciona clique na linha para selecionar
                row.addEventListener('click', () => selecionarEditora(editora.editora_id));
                row.style.cursor = 'pointer';
                editorasTableBody.appendChild(row);
            });
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao carregar editoras:', error);
        mostrarMensagem('Erro ao carregar lista de editoras', 'error');
        editorasTableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados</td></tr>';
    }
}

// Função para buscar uma editora por ID
async function buscarEditora() {
    const id = searchId.value.trim();
    if (!id || isNaN(id)) {
        mostrarMensagem('Digite um ID válido para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/editoras/${id}`);
        if (response.ok) {
            const editora = await response.json();
            preencherFormulario(editora);
            mostrarBotoes(true, false, true, true, false, true); // Buscar, Alterar, Excluir, Cancelar
            mostrarMensagem('Editora encontrada!', 'success');
            bloquearCampos(true); // Bloqueia campos de dados para visualização, libera searchId
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id; // Mantém o ID digitado
            mostrarBotoes(true, true, false, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Editora não encontrada. Você pode incluir uma nova.', 'info');
            bloquearCampos(false); // Libera campos de dados para inclusão possível
            nomeEditoraInput.focus();
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao buscar editora:', error);
        mostrarMensagem('Erro ao buscar editora', 'error');
    }
}

// Função para preencher o formulário com dados da editora
function preencherFormulario(editora) {
    currentEditoraId = editora.editora_id;
    searchId.value = editora.editora_id; // Preenche o input com o ID
    nomeEditoraInput.value = editora.nome || '';
    cidadeEditoraInput.value = editora.cidade || '';
    anoFundacaoEditoraInput.value = editora.ano_fundacao || '';
}

// Função para selecionar editora ao clicar na tabela
async function selecionarEditora(id) {
    searchId.value = id; // Preenche o input com o ID da tabela
    await buscarEditora();
}

// Função para incluir nova editora
function incluirEditora() {
    if (currentEditoraId) {
        mostrarMensagem('Busque uma editora vazia ou cancele para incluir nova.', 'warning');
        return;
    }
    mostrarMensagem('Digite os dados para a nova editora!', 'info');
    limparFormulario();
    bloquearCampos(false); // Libera campos de dados para preenchimento, bloqueia searchId
    searchId.disabled = true; // Garante bloqueio do searchId
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    nomeEditoraInput.focus();
    operacao = 'incluir';
}

// Função para alterar editora
function alterarEditora() {
    if (!currentEditoraId) {
        mostrarMensagem('Busque uma editora para alterar.', 'warning');
        return;
    }
    mostrarMensagem('Altere os dados e salve!', 'info');
    bloquearCampos(false); // Libera campos de dados para edição, bloqueia searchId
    searchId.disabled = true; // Garante bloqueio do searchId
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    nomeEditoraInput.focus();
    operacao = 'alterar';
}

// Função para excluir editora
function excluirEditora() {
    if (!currentEditoraId) {
        mostrarMensagem('Busque uma editora para excluir.', 'warning');
        return;
    }
    if (!confirm('Confirme a exclusão da editora?')) {
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(true); // Bloqueia campos de dados para evitar edição, bloqueia searchId
    searchId.disabled = true; // Garante bloqueio do searchId
    mostrarBotoes(false, false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

// Função para salvar operação (incluir, alterar, excluir)
async function salvarOperacao() {
    // Validação básica
    if (!nomeEditoraInput.value.trim()) {
        mostrarMensagem('O nome da editora é obrigatório!', 'warning');
        nomeEditoraInput.focus();
        return;
    }

    const dadosEditora = {
        nome: nomeEditoraInput.value.trim(),
        cidade: cidadeEditoraInput.value.trim() || null,
        ano_fundacao: anoFundacaoEditoraInput.value ? parseInt(anoFundacaoEditoraInput.value) : null
    };

    try {
        let response;
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/editoras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosEditora)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosEditora)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            limparFormulario();
            await carregarEditoras(); // Recarrega a tabela
            mostrarBotoes(true, true, false, false, false, false); // Buscar, Incluir
            bloquearCampos(true); // Bloqueia campos de dados, libera searchId
            searchId.disabled = false; // Garante liberação do searchId
            operacao = null;
            const msg = operacao === 'excluir' ? 'Editora excluída!' : 'Editora salva!';
            mostrarMensagem(msg, 'success');
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao salvar operação:', error);
        mostrarMensagem(`Erro ao ${operacao}: ${error.message}`, 'error');
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, true, false, false, false, false); // Buscar, Incluir
    bloquearCampos(true); // Bloqueia campos de dados, libera searchId
    searchId.disabled = false; // Garante liberação do searchId
    searchId.focus();
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para validar dados antes de salvar (opcional, pode ser expandida)
function validarDados() {
    if (!nomeEditoraInput.value.trim()) {
        return { valido: false, campo: 'nome_editora', mensagem: 'Nome é obrigatório' };
    }
    if (anoFundacaoEditoraInput.value && (anoFundacaoEditoraInput.value < 1800 || anoFundacaoEditoraInput.value > new Date().getFullYear())) {
        return { valido: false, campo: 'ano_fundacao_editora', mensagem: 'Ano de fundação inválido' };
    }
    return { valido: true };
}