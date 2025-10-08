// Configuração da API, IP e porta. (Mantido do original)
const API_BASE_URL = 'http://localhost:3001';

// --- VARIÁVEIS GLOBAIS PARA CRUD DE LIVROS (mantidas do original) ---
let currentLivroId = null;
let operacaoLivro = null; // 'incluir', 'alterar', 'excluir' para livros

// --- VARIÁVEIS GLOBAIS PARA AUTORES ASSOCIADOS (adicionadas conforme instruções) ---
let associatedAuthorIds = new Set(); // IDs dos autores associados ao livro selecionado
const availableAuthorsBody = document.getElementById('availableAuthorsBody');
const associatedAuthorsBody = document.getElementById('associatedAuthorsBody');

// --- ELEMENTOS DOM PARA CRUD DE LIVROS (mantidos do original) ---
const livrosForm = document.getElementById('livrosForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar'); // Para livros
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const livrosTableBody = document.getElementById('livrosTableBody');
let messageContainer; // DECLARADA MAS NÃO ATRIBUÍDA AQUI

// Campos do formulário de livros (mantidos)
const tituloInput = document.getElementById('titulo');
const anoPublicacaoInput = document.getElementById('ano_publicacao');
const editoraSelect = document.getElementById('editora_id');
const isbnInput = document.getElementById('isbn');
const paginasInput = document.getElementById('paginas');
const imagemUrlInput = document.getElementById('imagem_url');

// --- INICIALIZAÇÃO (simplificada - removido CRUD livro-autor) ---
document.addEventListener('DOMContentLoaded', function() {
    // ATRIBUIÇÃO DO messageContainer DENTRO DO DOMContentLoaded
    messageContainer = document.getElementById('messageContainer');
    
    // Para CRUD de Livros (mantido do original)
    carregarLivros();
    carregarEditorasParaSelect();
    limparFormularioLivros();
    mostrarBotoesLivros(true, false, false, false, false, true); // Inicial: Buscar e Cancelar visíveis
    searchId.focus();
});

// --- EVENT LISTENERS PARA CRUD DE LIVROS (mantidos do original) ---
btnBuscar.addEventListener('click', buscarLivro);
btnIncluir.addEventListener('click', incluirLivro);
btnAlterar.addEventListener('click', alterarLivro);
btnExcluir.addEventListener('click', excluirLivro);
btnSalvar.addEventListener('click', salvarLivro);
btnCancelar.addEventListener('click', cancelarLivro);

searchId.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        buscarLivro();
    }
});

// --- FUNÇÕES COMUNS DE UI (mantidas/expandidas do original) ---
function mostrarMensagem(texto, tipo = 'info') {
    // Remove mensagens antigas se existirem
    const oldMessages = messageContainer.querySelectorAll('.message');
    oldMessages.forEach(function(msg) {
        msg.remove();
    });
    
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `message ${tipo}`;
    mensagemDiv.textContent = texto;
    messageContainer.appendChild(mensagemDiv);

    setTimeout(function() {
        if (messageContainer.contains(mensagemDiv)) {
            messageContainer.removeChild(mensagemDiv);
        }
    }, 3000);
}

// Função para formatar data, se usada no original (mantida)
function formatarDataParaInput(dataString) {
    if (!dataString) return '';
    return new Date(dataString).toISOString().split('T')[0];
}

// --- FUNÇÕES PARA AUTORES ASSOCIADOS (adicionadas conforme instruções) ---

async function carregarAutoresParaLivro(livroId) {
    try {
        // Busca todos os autores
        const response = await fetch(`${API_BASE_URL}/livros/autores/todos`);
        const todosAutores = await response.json();

        // Busca autores associados ao livro
        let autoresAssociados = [];
        if (livroId) {
            const resp = await fetch(`${API_BASE_URL}/livros/${livroId}/autores`);
            if (resp.ok) {
                autoresAssociados = await resp.json();
            } else {
                console.error('Erro ao carregar autores associados:', resp.status);
                autoresAssociados = [];
            }
        }

        // Preenche o set de associados
        associatedAuthorIds.clear();
        autoresAssociados.forEach(a => associatedAuthorIds.add(a.autor_id));

        // Renderiza tabelas
        renderizarAutoresDisponiveis(todosAutores, autoresAssociados);
        renderizarAutoresAssociados(autoresAssociados);
    } catch (error) {
        console.error('Erro ao carregar autores para livro:', error);
        mostrarMensagem('Erro ao carregar autores', 'error');
    }
}

function renderizarAutoresDisponiveis(todosAutores, autoresAssociados) {
    availableAuthorsBody.innerHTML = '';
    const associadosIds = new Set(autoresAssociados.map(a => a.autor_id));
    todosAutores.forEach(autor => {
        if (!associadosIds.has(autor.autor_id)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${autor.autor_id}</td>
                <td>${autor.nome}</td>
                <td><button type="button" onclick="adicionarAutor(${autor.autor_id}, '${autor.nome.replace(/'/g, "\\'")}')">Adicionar</button></td>
            `;
            availableAuthorsBody.appendChild(tr);
        }
    });
}

function renderizarAutoresAssociados(autoresAssociados) {
    associatedAuthorsBody.innerHTML = '';
    autoresAssociados.forEach(autor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${autor.autor_id}</td>
            <td>${autor.nome}</td>
            <td><button type="button" onclick="removerAutor(${autor.autor_id}, '${autor.nome.replace(/'/g, "\\'")}')">Remover</button></td>
        `;
        associatedAuthorsBody.appendChild(tr);
    });
}

function adicionarAutor(autor_id, nome) {
    associatedAuthorIds.add(autor_id);
    atualizarTabelasAutores();
}

function removerAutor(autor_id, nome) {
    associatedAuthorIds.delete(autor_id);
    atualizarTabelasAutores();
}

async function atualizarTabelasAutores() {
    try {
        // Busca todos os autores
        const response = await fetch(`${API_BASE_URL}/livros/autores/todos`);
        const todosAutores = await response.json();

        // Monta lista de associados a partir do set
        const autoresAssociados = todosAutores.filter(a => associatedAuthorIds.has(a.autor_id));

        renderizarAutoresDisponiveis(todosAutores, autoresAssociados);
        renderizarAutoresAssociados(autoresAssociados);
    } catch (error) {
        console.error('Erro ao atualizar tabelas de autores:', error);
        mostrarMensagem('Erro ao atualizar autores', 'error');
    }
}

// --- FUNÇÕES PARA CRUD DE LIVROS (modificadas para integrar com autores) ---

function bloquearCamposLivros(bloquear) {
    tituloInput.disabled = bloquear;
    anoPublicacaoInput.disabled = bloquear;
    editoraSelect.disabled = bloquear;
    isbnInput.disabled = bloquear;
    paginasInput.disabled = bloquear;
    imagemUrlInput.disabled = bloquear;
}

function limparFormularioLivros() {
    livrosForm.reset();
    searchId.value = '';
    currentLivroId = null;
    operacaoLivro = null;
    bloquearCamposLivros(true);
    // Oculta o gerenciamento de autores ao limpar o formulário
    document.getElementById('authorsFields').style.display = 'none';
    // Limpa também as tabelas de autores
    carregarAutoresParaLivro(null);
}

function mostrarBotoesLivros(mostrarBuscar, mostrarIncluir, mostrarAlterar, mostrarExcluir, mostrarSalvar, mostrarCancelar) {
    btnBuscar.style.display = mostrarBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = mostrarIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = mostrarAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = mostrarExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = mostrarSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = mostrarCancelar ? 'inline-block' : 'none';
}

async function carregarLivros() {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (!response.ok) {
            throw new Error('Erro ao carregar livros');
        }
        const livros = await response.json();
        renderizarTabelaLivros(livros);
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        mostrarMensagem('Erro ao carregar lista de livros', 'error');
        livrosTableBody.innerHTML = '<tr><td colspan="9">Erro ao carregar dados</td></tr>';
    }
}

function renderizarTabelaLivros(livros) {
    livrosTableBody.innerHTML = '';
    livros.forEach(function(livro) {
        const nomesAutores = Array.isArray(livro.autores) && livro.autores.length > 0 
            ? livro.autores.map(a => a.nome).join(', ')
            : 'Sem autores';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${livro.livro_id}</td>
            <td>${livro.titulo}</td>
            <td>${livro.ano_publicacao || ''}</td>
            <td>${livro.editora_id || ''}</td>
            <td>${livro.isbn || ''}</td>
            <td>${livro.paginas || ''}</td>
            <td>${nomesAutores}</td>
            <td><img src="${livro.imagem_url || ''}" alt="Imagem" style="width: 50px;"></td>
            <td>
                <button type="button" onclick="selecionarLivro(${livro.livro_id})">Selecionar</button>
            </td>
        `;
        livrosTableBody.appendChild(tr);
    });
}

// Função global para selecionar livro da tabela
window.selecionarLivro = async function(livroId) {
    searchId.value = livroId;
    await buscarLivro();
};

async function carregarEditorasParaSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/editoras`);
        if (!response.ok) {
            throw new Error('Erro ao carregar editoras');
        }
        const editoras = await response.json();
        editoraSelect.innerHTML = '<option value="">Selecione uma editora</option>';
        editoras.forEach(function(editora) {
            const option = document.createElement('option');
            option.value = editora.editora_id;
            option.textContent = editora.nome;
            editoraSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar editoras:', error);
        mostrarMensagem('Erro ao carregar editoras', 'error');
    }
}

async function buscarLivro() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/livros/${id}`);
        if (response.ok) {
            const livro = await response.json();
            preencherFormularioLivro(livro);
            mostrarBotoesLivros(true, false, true, true, false, true);
            mostrarMensagem('Livro encontrado!', 'success');
            bloquearCamposLivros(true);
            currentLivroId = livro.livro_id;
            // CARREGA AUTORES ASSOCIADOS AO LIVRO ENCONTRADO
            await carregarAutoresParaLivro(livro.livro_id);
            // EXIBE O GERENCIAMENTO DE AUTORES AO BUSCAR
            document.getElementById('authorsFields').style.display = 'block';
        } else if (response.status === 404) {
            mostrarMensagem('Livro não encontrado. Deseja incluir?', 'info');
            limparFormularioLivros();
            mostrarBotoesLivros(true, true, false, false, false, true);
            bloquearCamposLivros(false);
            // INICIALIZA TABELAS DE AUTORES PARA NOVO LIVRO
            carregarAutoresParaLivro(null);
        } else {
            throw new Error('Erro na busca');
        }
    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        mostrarMensagem('Erro ao buscar livro', 'error');
    }
}

function preencherFormularioLivro(livro) {
    searchId.value = livro.livro_id;
    tituloInput.value = livro.titulo || '';
    anoPublicacaoInput.value = livro.ano_publicacao || '';
    editoraSelect.value = livro.editora_id || '';
    isbnInput.value = livro.isbn || '';
    paginasInput.value = livro.paginas || '';
    imagemUrlInput.value = livro.imagem_url || '';
    // Exibe o gerenciamento de autores ao preencher o formulário
    document.getElementById('authorsFields').style.display = 'block';
}

function incluirLivro() {
    limparFormularioLivros();
    bloquearCamposLivros(false);
    mostrarBotoesLivros(false, false, false, false, true, true);
    operacaoLivro = 'incluir';
    tituloInput.focus();
    mostrarMensagem('Preencha os dados do livro', 'info');
    // INICIALIZA TABELAS DE AUTORES PARA NOVO LIVRO
    carregarAutoresParaLivro(null);
    // EXIBE O GERENCIAMENTO DE AUTORES AO INCLUIR
    document.getElementById('authorsFields').style.display = 'block';
}

function alterarLivro() {
    if (!currentLivroId) {
        mostrarMensagem('Selecione um livro primeiro', 'warning');
        return;
    }
    bloquearCamposLivros(false);
    // EXIBE O GERENCIAMENTO DE AUTORES AO ALTERAR
    document.getElementById('authorsFields').style.display = 'block';
    mostrarBotoesLivros(false, false, false, false, true, true);
    operacaoLivro = 'alterar';
    tituloInput.focus();
    mostrarMensagem('Altere os dados e salve', 'info');
}

function excluirLivro() {
    if (!currentLivroId) {
        mostrarMensagem('Selecione um livro primeiro', 'warning');
        return;
    }
    if (!confirm('Confirma exclusão?')) return;
    bloquearCamposLivros(true);
    // Garante que o gerenciamento de autores está visível para confirmação
    document.getElementById('authorsFields').style.display = 'block';
    mostrarBotoesLivros(false, false, false, false, true, true);
    operacaoLivro = 'excluir';
    mostrarMensagem('Confirme salvando para excluir', 'warning');
}

async function salvarLivro() {
    if (!operacaoLivro) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }
    const livroData = {
        titulo: tituloInput.value.trim(),
        ano_publicacao: anoPublicacaoInput.value ? parseInt(anoPublicacaoInput.value) : null,
        editora_id: editoraSelect.value ? parseInt(editoraSelect.value) : null,
        isbn: isbnInput.value.trim(),
        paginas: paginasInput.value ? parseInt(paginasInput.value) : null,
        imagem_url: imagemUrlInput.value.trim(),
        // ADICIONA OS AUTORES ASSOCIADOS (conforme instruções)
        autores_ids: Array.from(associatedAuthorIds)
    };
    if (!livroData.titulo || !livroData.isbn || !livroData.editora_id) {
        mostrarMensagem('Campos obrigatórios: Título, ISBN, Editora', 'warning');
        return;
    }
    try {
        let response;
        if (operacaoLivro === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livroData)
            });
        } else if (operacaoLivro === 'alterar') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livroData)
            });
        } else if (operacaoLivro === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livros/${currentLivroId}`, {
                method: 'DELETE'
            });
        }
        if (response.ok) {
            mostrarMensagem(`Livro ${operacaoLivro}do com sucesso!`, 'success');
            limparFormularioLivros();
            carregarLivros();
            mostrarBotoesLivros(true, false, false, false, false, true);
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar livro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

function cancelarLivro() {
    limparFormularioLivros();
    mostrarBotoesLivros(true, false, false, false, false, true);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}