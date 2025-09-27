const API_BASE_URL = 'http://localhost:3001';
let currentLivroId = null;
let currentAutorId = null;
let operacao = null;

const form = document.getElementById('livroAutorForm');
const searchLivroId = document.getElementById('searchLivroId');
const searchAutorId = document.getElementById('searchAutorId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('livroAutorTableBody');
const messageContainer = document.getElementById('messageContainer');

const livroIdInput = document.getElementById('livro_id');
const autorIdInput = document.getElementById('autor_id');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarLivrosNoComboBox(livroIdInput); // Carrega livros para o combobox do formulário
    carregarAutoresNoComboBox(autorIdInput); // Carrega autores para o combobox do formulário
    carregarLivrosNoComboBox(searchLivroId); // Carrega livros para o combobox de busca
    carregarAutoresNoComboBox(searchAutorId); // Carrega autores para o combobox de busca
    carregarRegistros();
    limparFormulario();
    mostrarBotoes(true, false, false, false, false); // buscar, incluir, excluir, salvar, cancelar
    bloquearCampos(false);
});

// Event Listeners
btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Adicionar listeners para os comboboxes de busca
searchLivroId.addEventListener('change', () => {
    if (searchLivroId.value && searchAutorId.value) {
        buscarRegistro();
    } else if (!searchLivroId.value && !searchAutorId.value) {
        limparFormulario();
        mostrarBotoes(true, true, false, false, false);
        bloquearCampos(false);
    }
});

searchAutorId.addEventListener('change', () => {
    if (searchLivroId.value && searchAutorId.value) {
        buscarRegistro();
    } else if (!searchLivroId.value && !searchAutorId.value) {
        limparFormulario();
        mostrarBotoes(true, true, false, false, false);
        bloquearCampos(false);
    }
});

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    searchLivroId.disabled = bloquear;
    searchAutorId.disabled = bloquear;
    livroIdInput.disabled = !bloquear;
    autorIdInput.disabled = !bloquear;
}

function limparFormulario() {
    form.reset();
    searchLivroId.value = "";
    searchAutorId.value = "";
    currentLivroId = null;
    currentAutorId = null;
    bloquearCampos(false);
}

function mostrarBotoes(buscar, incluir, excluir, salvar, cancelar) {
    btnBuscar.style.display = buscar ? 'inline-block' : 'none';
    btnIncluir.style.display = incluir ? 'inline-block' : 'none';
    btnExcluir.style.display = excluir ? 'inline-block' : 'none';
    btnSalvar.style.display = salvar ? 'inline-block' : 'none';
    btnCancelar.style.display = cancelar ? 'inline-block' : 'none';
}

async function carregarLivrosNoComboBox(selectElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (!response.ok) throw new Error('Erro ao carregar livros');
        const livros = await response.json();

        selectElement.innerHTML = '<option value="">Selecione um Livro</option>';
        livros.forEach(livro => {
            const option = document.createElement('option');
            option.value = livro.livro_id;
            option.textContent = `${livro.livro_id} - ${livro.titulo}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar livros no combobox:', error);
        mostrarMensagem('Erro ao carregar livros', 'error');
    }
}

async function carregarAutoresNoComboBox(selectElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/autores`);
        if (!response.ok) throw new Error('Erro ao carregar autores');
        const autores = await response.json();

        selectElement.innerHTML = '<option value="">Selecione um Autor</option>';
        autores.forEach(autor => {
            const option = document.createElement('option');
            option.value = autor.autor_id;
            option.textContent = `${autor.autor_id} - ${autor.nome}`;  // Corrigido: usar 'nome' em vez de 'nome_autor'
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar autores no combobox:', error);
        mostrarMensagem('Erro ao carregar autores', 'error');
    }
}

async function buscarRegistro() {
    const livroId = searchLivroId.value;
    const autorId = searchAutorId.value;

    if (!livroId || !autorId) {
        mostrarMensagem('Selecione um Livro e um Autor para buscar', 'warning');
        return;
    }

    limparFormulario();
    searchLivroId.value = livroId;
    searchAutorId.value = autorId;

    try {
        const response = await fetch(`${API_BASE_URL}/livroautor/${livroId}/${autorId}`);
        if (response.ok) {
            const registro = await response.json();
            preencherFormulario(registro);
            mostrarBotoes(true, false, true, false, true); // Buscar, Excluir, Cancelar
            mostrarMensagem('Associação encontrada!', 'success');
            bloquearCampos(true);
            searchLivroId.disabled = false;
            searchAutorId.disabled = false;
            currentLivroId = registro.livro_id;
            currentAutorId = registro.autor_id;
        } else if (response.status === 404) {
            limparFormulario();
            searchLivroId.value = livroId;
            searchAutorId.value = autorId;
            mostrarBotoes(true, true, false, false, true); // Buscar, Incluir, Cancelar
            mostrarMensagem('Associação não encontrada. Você pode incluir uma nova.', 'info');
            bloquearCampos(false);
            searchLivroId.disabled = false;
            searchAutorId.disabled = false;
            livroIdInput.value = livroId;
            autorIdInput.value = autorId;
            livroIdInput.focus();
        } else {
            throw new Error('Erro ao buscar associação');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar associação', 'error');
    }
}

function preencherFormulario(registro) {
    currentLivroId = registro.livro_id;
    currentAutorId = registro.autor_id;
    searchLivroId.value = registro.livro_id;
    searchAutorId.value = registro.autor_id;
    livroIdInput.value = registro.livro_id;
    autorIdInput.value = registro.autor_id;
}

function incluirRegistro() {
    mostrarMensagem('Selecione o Livro e o Autor para a nova associação!', 'info');
    limparFormulario();
    bloquearCampos(true); // Bloqueia os comboboxes de busca, libera os outros
    searchLivroId.disabled = true;
    searchAutorId.disabled = true;
    mostrarBotoes(false, false, false, true, true); // Salvar, Cancelar
    livroIdInput.focus();
    operacao = 'incluir';
}

function excluirRegistro() {
    if (!currentLivroId || !currentAutorId) {
        mostrarMensagem('Selecione uma associação para excluir.', 'warning');
        return;
    }
    mostrarMensagem('Confirme a exclusão clicando em Salvar!', 'warning');
    bloquearCampos(false); // Bloqueia todos os campos para evitar edição acidental
    searchLivroId.disabled = true;
    searchAutorId.disabled = true;
    mostrarBotoes(false, false, false, true, true); // Salvar, Cancelar
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false); // Apenas Buscar
    bloquearCampos(false); // Libera os comboboxes de busca, bloqueia os outros
    searchLivroId.disabled = false;
    searchAutorId.disabled = false;
    searchLivroId.focus();
    operacao = null;
    mostrarMensagem('Operação cancelada', 'info');
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }

    const registroData = {
        livro_id: parseInt(livroIdInput.value),
        autor_id: parseInt(autorIdInput.value)
    };

    if (!registroData.livro_id || !registroData.autor_id) {
        mostrarMensagem('ID do Livro e ID do Autor são obrigatórios', 'warning');
        return;
    }

    try {
        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livroautor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroData)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livroautor/${currentLivroId}/${currentAutorId}`, {
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
            mostrarBotoes(true, false, false, false, false); // Apenas Buscar
            bloquearCampos(false);
            searchLivroId.disabled = false;
            searchAutorId.disabled = false;
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
        const response = await fetch(`${API_BASE_URL}/livroautor`);
        if (!response.ok) throw new Error('Erro ao carregar associações');
        const associacoes = await response.json();

        // Para exibir os nomes dos livros e autores, precisamos buscar os detalhes
        const livrosResponse = await fetch(`${API_BASE_URL}/livros`);
        const autoresResponse = await fetch(`${API_BASE_URL}/autores`);

        if (!livrosResponse.ok || !autoresResponse.ok) {
            throw new Error('Erro ao carregar detalhes de livros ou autores');
        }

        const livros = await livrosResponse.json();
        const autores = await autoresResponse.json();

        const livrosMap = new Map(livros.map(livro => [livro.livro_id, livro.titulo]));
        const autoresMap = new Map(autores.map(autor => [autor.autor_id, autor.nome]));  // Corrigido: usar 'nome' em vez de 'nome_autor'

        tableBody.innerHTML = '';

        associacoes.forEach(associacao => {
            const livroTitulo = livrosMap.get(associacao.livro_id) || 'Livro Desconhecido';
            const autorNome = autoresMap.get(associacao.autor_id) || 'Autor Desconhecido';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${associacao.livro_id}</td>
                <td>${livroTitulo}</td>
                <td>${associacao.autor_id}</td>
                <td>${autorNome}</td>
                <td>
                    <button class="btn-small btn-danger" onclick="selecionarRegistroParaExcluir(${associacao.livro_id}, ${associacao.autor_id})">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de associações', 'error');
    }
}

async function selecionarRegistroParaExcluir(livroId, autorId) {
    searchLivroId.value = livroId;
    searchAutorId.value = autorId;
    currentLivroId = livroId;
    currentAutorId = autorId;
    // Preenche o formulário para que os IDs estejam visíveis antes de confirmar a exclusão
    livroIdInput.value = livroId;
    autorIdInput.value = autorId;
    excluirRegistro();
}