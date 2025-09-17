// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentEditoraId = null; // Alterado de currentPersonId
let operacao = null;

// Elementos do DOM
const form = document.getElementById('editorasForm'); // Alterado de questaoForm
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const editorasTableBody = document.getElementById('editorasTableBody'); // Alterado de questoesTableBody
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de editoras ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarEditoras(); // Alterado de carregarQuestoes
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEditora); // Alterado de buscarQuestao
btnIncluir.addEventListener('click', incluirEditora); // Alterado de incluirQuestao
btnAlterar.addEventListener('click', alterarEditora); // Alterado de alterarQuestao
btnExcluir.addEventListener('click', excluirEditora); // Alterado de excluirQuestao
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false); //libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição (não usada para editoras, mas mantida por consistência)
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para converter data para formato ISO (não usada para editoras, mas mantida por consistência)
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

// Função para buscar editora por ID
async function buscarEditora() { // Alterado de buscarQuestao
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/editoras/${id}`); // Alterado de /questao

        if (response.ok) {
            const editora = await response.json(); // Alterado de questao
            preencherFormulario(editora); // Alterado de preencherFormulario

            mostrarBotoes(true, false, true, true, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Editora encontrada!', 'success'); // Alterado de Questao

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Editora não encontrada. Você pode incluir uma nova editora.', 'info'); // Alterado de Questao
            bloquearCampos(false); //bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar editora'); // Alterado de questao
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar editora', 'error'); // Alterado de questao
    }
}

// Função para preencher formulário com dados da editora
function preencherFormulario(editora) { // Alterado de questao
    currentEditoraId = editora.editora_id; // Alterado de id_questao
    searchId.value = editora.editora_id; // Alterado de id_questao
    document.getElementById('nome_editora').value = editora.nome || ''; // Alterado de texto_questao
    document.getElementById('cidade_editora').value = editora.cidade || ''; // Alterado de nota_maxima_questao
    document.getElementById('ano_fundacao_editora').value = editora.ano_fundacao || ''; // Alterado de texto_complementar_questao
}

// Função para incluir editora
async function incluirEditora() { // Alterado de incluirQuestao
    mostrarMensagem('Digite os dados!', 'success');
    currentEditoraId = searchId.value; // Alterado de currentPersonId
    limparFormulario();
    searchId.value = currentEditoraId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_editora').focus(); // Alterado de texto_questao
    operacao = 'incluir';
}

// Função para alterar editora
async function alterarEditora() { // Alterado de alterarQuestao
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_editora').focus(); // Alterado de texto_questao
    operacao = 'alterar';
}

// Função para excluir editora
async function excluirEditora() { // Alterado de excluirQuestao
    mostrarMensagem('Excluindo editora...', 'info'); // Alterado de questao
    currentEditoraId = searchId.value; // Alterado de currentPersonId
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentEditoraId: ' + currentEditoraId + ' - searchId: ' + searchId.value); // Alterado de currentPersonId

    const formData = new FormData(form);
    const editora = { // Alterado de questao
        editora_id: searchId.value, // Alterado de id_questao
        nome: formData.get('nome_editora'), // Alterado de texto_questao
        cidade: formData.get('cidade_editora'), // Alterado de nota_maxima_questao
        ano_fundacao: formData.get('ano_fundacao_editora') // Alterado de texto_complementar_questao
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/editoras`, { // Alterado de /questao
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editora) // Alterado de questao
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, { // Alterado de /questao/${currentPersonId}
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editora) // Alterado de questao
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/editoras/${currentEditoraId}`, { // Alterado de /questao/${currentPersonId}
                method: 'DELETE'
            });
            console.log('Editora excluída' + response.status); // Alterado de Questao
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaEditora = await response.json(); // Alterado de novaQuestao
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarEditoras(); // Alterado de carregarQuestoes

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir editora', 'error'); // Alterado de questao
        } else {
            mostrarMensagem('Editora excluída com sucesso!', 'success'); // Alterado de Questao
            limparFormulario();
            carregarEditoras(); // Alterado de carregarQuestoes
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a editora', 'error'); // Alterado de questao
    }

    mostrarBotoes(true, false, false, false, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false); //libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false); //libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de editoras
async function carregarEditoras() { // Alterado de carregarQuestoes
    try {
        const response = await fetch(`${API_BASE_URL}/editoras`); // Alterado de /questao
        if (response.ok) {
            const editoras = await response.json(); // Alterado de questoes
            renderizarTabelaEditoras(editoras); // Alterado de renderizarTabelaQuestoes
        } else {
            throw new Error('Erro ao carregar editoras'); // Alterado de questoes
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de editoras', 'error'); // Alterado de questoes
    }
}

// Função para renderizar tabela de editoras
function renderizarTabelaEditoras(editoras) { // Alterado de renderizarTabelaQuestoes(questoes)
    editorasTableBody.innerHTML = ''; // Alterado de questoesTableBody

    editoras.forEach(editora => { // Alterado de questoes.forEach(questao
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarEditora(${editora.editora_id})"> <!-- Alterado de selecionarQuestao -->
                            ${editora.editora_id}
                        </button>
                    </td>
                    <td>${editora.nome}</td> <!-- Alterado de texto_questao -->
                    <td>${editora.cidade}</td> <!-- Alterado de nota_maxima_questao -->
                    <td>${editora.ano_fundacao}</td> <!-- Alterado de texto_complementar_questao -->
                `;
        editorasTableBody.appendChild(row); // Alterado de questoesTableBody
    });
}

// Função para selecionar editora da tabela
async function selecionarEditora(id) { // Alterado de selecionarQuestao
    searchId.value = id;
    await buscarEditora(); // Alterado de buscarQuestao
}