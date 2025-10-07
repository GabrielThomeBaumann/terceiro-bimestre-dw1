// Configuração da API, IP e porta. (Mantido do original)
const API_BASE_URL = 'http://localhost:3001';

// --- VARIÁVEIS GLOBAIS PARA CRUD DE LIVROS (mantidas do original) ---
let currentLivroId = null;
let operacaoLivro = null; // 'incluir', 'alterar', 'excluir' para livros

// --- VARIÁVEIS GLOBAIS PARA CRUD DE LIVRO-AUTOR (novas) ---
let currentAssociacaoLivroId = null;
let currentAssociacaoAutorId = null;
let operacaoLivroAutor = null; // 'incluir', 'excluir' para associações

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
const messageContainer = document.getElementById('messageContainer');

// Campos do formulário de livros (mantidos)
const tituloInput = document.getElementById('titulo');
const anoPublicacaoInput = document.getElementById('ano_publicacao');
const editoraSelect = document.getElementById('editora_id');
const isbnInput = document.getElementById('isbn');
const paginasInput = document.getElementById('paginas');
const imagemUrlInput = document.getElementById('imagem_url');

// --- ELEMENTOS DOM PARA CRUD DE LIVRO-AUTOR (novos, baseados nos IDs alterados) ---
const livroAutorForm = document.getElementById('livroAutorForm');
const searchLivroIdSelect = document.getElementById('searchLivroId');
const searchAutorIdSelect = document.getElementById('searchAutorId');
const btnBuscarLivroAutor = document.getElementById('btnBuscarLivroAutor');
const btnIncluirLivroAutor = document.getElementById('btnIncluirLivroAutor');
const btnExcluirLivroAutor = document.getElementById('btnExcluirLivroAutor');
const btnSalvarLivroAutor = document.getElementById('btnSalvarLivroAutor');
const btnCancelarLivroAutor = document.getElementById('btnCancelarLivroAutor');
const livroAutorTableBody = document.getElementById('livroAutorTableBody');

// Campos do formulário de livro-autor
const livroIdSelect = document.getElementById('livro_id');
const autorIdSelect = document.getElementById('autor_id');

// --- INICIALIZAÇÃO (expandida para carregar ambos os CRUDs) ---
document.addEventListener('DOMContentLoaded', function() {
    // Para CRUD de Livros (mantido do original)
    carregarLivros();
    carregarEditorasParaSelect();
    limparFormularioLivros();
    mostrarBotoesLivros(true, false, false, false, false, true); // Inicial: Buscar e Cancelar visíveis
    searchId.focus();

    // Para CRUD de Livro-Autor (novo)
    carregarLivrosParaSelectLivroAutor();
    carregarAutoresParaSelectLivroAutor();
    carregarAssociacoesLivroAutor();
    limparFormularioLivroAutor();
    mostrarBotoesLivroAutor(true, false, false, false, true); // Inicial: Buscar e Cancelar visíveis
    searchLivroIdSelect.focus();
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

// --- EVENT LISTENERS PARA CRUD DE LIVRO-AUTOR (novos) ---
btnBuscarLivroAutor.addEventListener('click', buscarAssociacaoLivroAutor);
btnIncluirLivroAutor.addEventListener('click', incluirAssociacaoLivroAutor);
btnExcluirLivroAutor.addEventListener('click', excluirAssociacaoLivroAutor);
btnSalvarLivroAutor.addEventListener('click', salvarLivroAutor);
btnCancelarLivroAutor.addEventListener('click', cancelarLivroAutor);

searchLivroIdSelect.addEventListener('change', function() {
    if (this.value) {
        carregarAssociacoesPorLivro(parseInt(this.value));
    } else {
        carregarAssociacoesLivroAutor();
    }
});

searchAutorIdSelect.addEventListener('change', function() {
    if (this.value) {
        carregarAssociacoesPorAutor(parseInt(this.value));
    } else {
        carregarAssociacoesLivroAutor();
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

// --- FUNÇÕES PARA CRUD DE LIVROS (mantidas do original, sem alterações) ---

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
        livrosTableBody.innerHTML = '<tr><td colspan="7">Erro ao carregar dados</td></tr>';
    }
}

function renderizarTabelaLivros(livros) {
    livrosTableBody.innerHTML = '';
    livros.forEach(function(livro) {
        const tr = document.createElement('tr');
        // CORRIGIDO: Adiciona coluna de autores (usa 'livro.autores' do backend)
        const nomesAutores = Array.isArray(livro.autores) && livro.autores.length > 0 
            ? livro.autores.map(a => a.nome).join(', ')  // Usa 'nome' do JSON agregado
            : 'Sem autores';
        
        tr.innerHTML = `
            <td>${livro.livro_id}</td>
            <td>${livro.titulo}</td>
            <td>${livro.ano_publicacao || ''}</td>
            <td>${livro.editora_id || ''}</td>
            <td>${livro.isbn || ''}</td>
            <td>${livro.paginas || ''}</td>
            <td>${nomesAutores}</td> <!-- NOVO: Coluna para autores -->
            <td><img src="${livro.imagem_url || ''}" alt="Imagem" style="width: 50px;"></td>
        `;
        livrosTableBody.appendChild(tr);
    });
}
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
        } else if (response.status === 404) {
            mostrarMensagem('Livro não encontrado. Deseja incluir?', 'info');
            limparFormularioLivros();
            mostrarBotoesLivros(true, true, false, false, false, true);
            bloquearCamposLivros(false);
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
}

function incluirLivro() {
    limparFormularioLivros();
    bloquearCamposLivros(false);
    mostrarBotoesLivros(false, false, false, false, true, true);
    operacaoLivro = 'incluir';
    tituloInput.focus();
    mostrarMensagem('Preencha os dados do livro', 'info');
}

function alterarLivro() {
    if (!currentLivroId) {
        mostrarMensagem('Selecione um livro primeiro', 'warning');
        return;
    }
    bloquearCamposLivros(false);
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
        imagem_url: imagemUrlInput.value.trim()
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

// --- FUNÇÕES PARA CRUD DE LIVRO-AUTOR (novas, análogas ao de livros) ---

function bloquearCamposLivroAutor(bloquear) {
    livroIdSelect.disabled = bloquear;
    autorIdSelect.disabled = bloquear;
}

function limparFormularioLivroAutor() {
    livroAutorForm.reset();
    searchLivroIdSelect.value = '';
    searchAutorIdSelect.value = '';
    currentAssociacaoLivroId = null;
    currentAssociacaoAutorId = null;
    operacaoLivroAutor = null;
    bloquearCamposLivroAutor(true);
}

function mostrarBotoesLivroAutor(mostrarBuscar, mostrarIncluir, mostrarExcluir, mostrarSalvar, mostrarCancelar) {
    btnBuscarLivroAutor.style.display = mostrarBuscar ? 'inline-block' : 'none';
    btnIncluirLivroAutor.style.display = mostrarIncluir ? 'inline-block' : 'none';
    btnExcluirLivroAutor.style.display = mostrarExcluir ? 'inline-block' : 'none';
    btnSalvarLivroAutor.style.display = mostrarSalvar ? 'inline-block' : 'none';
    btnCancelarLivroAutor.style.display = mostrarCancelar ? 'inline-block' : 'none';
}

async function carregarLivrosParaSelectLivroAutor() {
    try {
        const response = await fetch(`${API_BASE_URL}/livros`);
        if (!response.ok) {
            throw new Error('Erro ao carregar livros para select');
        }
        const livros = await response.json();
        searchLivroIdSelect.innerHTML = '<option value="">Selecione um Livro</option>';
        livroIdSelect.innerHTML = '<option value="">Selecione um Livro</option>';
        livros.forEach(function(livro) {
            const optionSearch = document.createElement('option');
            optionSearch.value = livro.livro_id;
            optionSearch.textContent = `${livro.livro_id} - ${livro.titulo}`;
            searchLivroIdSelect.appendChild(optionSearch);

            const optionForm = document.createElement('option');
            optionForm.value = livro.livro_id;
            optionForm.textContent = `${livro.livro_id} - ${livro.titulo}`;
            livroIdSelect.appendChild(optionForm);
        });
    } catch (error) {
        console.error('Erro ao carregar livros para select:', error);
        mostrarMensagem('Erro ao carregar livros para select', 'error');
    }
}

async function carregarAutoresParaSelectLivroAutor() {
    try {
        const response = await fetch(`${API_BASE_URL}/autores`);
        if (!response.ok) {
            throw new Error('Erro ao carregar autores para select');
        }
        const autores = await response.json();
        searchAutorIdSelect.innerHTML = '<option value="">Selecione um Autor</option>';
        autorIdSelect.innerHTML = '<option value="">Selecione um Autor</option>';
        autores.forEach(function(autor) {
            const optionSearch = document.createElement('option');
            optionSearch.value = autor.autor_id;
            optionSearch.textContent = `${autor.autor_id} - ${autor.nome}`; // CORRIGIDO: 'nome' em vez de 'nome_autor'
            searchAutorIdSelect.appendChild(optionSearch);

            const optionForm = document.createElement('option');
            optionForm.value = autor.autor_id;
            optionForm.textContent = `${autor.autor_id} - ${autor.nome}`; // CORRIGIDO: 'nome' em vez de 'nome_autor'
            autorIdSelect.appendChild(optionForm);
        });
    } catch (error) {
        console.error('Erro ao carregar autores para select:', error);
        mostrarMensagem('Erro ao carregar autores para select', 'error');
    }
}

async function carregarAssociacoesLivroAutor() {
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor`);
        if (!response.ok) {
            throw new Error('Erro ao carregar associações');
        }
        const associacoes = await response.json();
        renderizarTabelaLivroAutor(associacoes);
    } catch (error) {
        console.error('Erro ao carregar associações:', error);
        mostrarMensagem('Erro ao carregar lista de associações', 'error');
        livroAutorTableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados</td></tr>';
    }
}

function renderizarTabelaLivroAutor(associacoes) {
    livroAutorTableBody.innerHTML = '';
    associacoes.forEach(function(associacao) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${associacao.livro_id}</td>
            <td>${associacao.titulo_livro || ''}</td>
            <td>${associacao.autor_id}</td>
            <td>${associacao.nome || ''}</td> <!-- CORRIGIDO: 'nome' em vez de 'nome_autor' -->
            <td><button class="btn-danger btn-small" onclick="excluirAssociacaoDaTabela(${associacao.livro_id}, ${associacao.autor_id})">Excluir</button></td>
        `;
        livroAutorTableBody.appendChild(tr);
    });
}

async function buscarAssociacaoLivroAutor() {
    const livroId = searchLivroIdSelect.value;
    const autorId = searchAutorIdSelect.value;
    if (!livroId && !autorId) {
        mostrarMensagem('Selecione um livro ou autor para buscar', 'warning');
        carregarAssociacoesLivroAutor(); // Volta à lista completa
        return;
    }
    try {
        let response;
        let associacoes = [];
        if (livroId) {
            response = await fetch(`${API_BASE_URL}/livroautor/livro/${livroId}`);
            if (response.ok) {
                associacoes = await response.json();
            }
        } else if (autorId) {
            response = await fetch(`${API_BASE_URL}/livroautor/autor/${autorId}`);
            if (response.ok) {
                associacoes = await response.json();
            }
        }
        if (associacoes.length > 0) {
            // Preenche o primeiro da lista no form (ou o único se for filtro específico)
            const primeiraAssociacao = associacoes[0];
            preencherFormularioAssociacao(primeiraAssociacao);
            mostrarBotoesLivroAutor(true, false, true, false, true);
            mostrarMensagem('Associação encontrada!', 'success');
            bloquearCamposLivroAutor(true);
            currentAssociacaoLivroId = primeiraAssociacao.livro_id;
            currentAssociacaoAutorId = primeiraAssociacao.autor_id;
            // Renderiza a tabela filtrada
            renderizarTabelaLivroAutor(associacoes);
        } else {
            mostrarMensagem('Nenhuma associação encontrada', 'info');
            limparFormularioLivroAutor();
            mostrarBotoesLivroAutor(true, true, false, false, true);
            bloquearCamposLivroAutor(false);
            livroAutorTableBody.innerHTML = '<tr><td colspan="5">Nenhuma associação encontrada</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao buscar associação:', error);
        mostrarMensagem('Erro ao buscar associação', 'error');
    }
}

function preencherFormularioAssociacao(associacao) {
    livroIdSelect.value = associacao.livro_id || '';
    autorIdSelect.value = associacao.autor_id || '';
}

async function carregarAssociacoesPorLivro(livroId) {
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor/livro/${livroId}`);
        if (response.ok) {
            const associacoes = await response.json();
            renderizarTabelaLivroAutor(associacoes);
        } else {
            livroAutorTableBody.innerHTML = '<tr><td colspan="5">Nenhuma associação para este livro</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar associações por livro:', error);
        mostrarMensagem('Erro ao filtrar por livro', 'error');
    }
}

async function carregarAssociacoesPorAutor(autorId) {
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor/autor/${autorId}`);
        if (response.ok) {
            const associacoes = await response.json();
            renderizarTabelaLivroAutor(associacoes);
        } else {
            livroAutorTableBody.innerHTML = '<tr><td colspan="5">Nenhuma associação para este autor</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar associações por autor:', error);
        mostrarMensagem('Erro ao filtrar por autor', 'error');
    }
}

function incluirAssociacaoLivroAutor() {
    limparFormularioLivroAutor();
    bloquearCamposLivroAutor(false);
    mostrarBotoesLivroAutor(false, false, false, true, true);
    operacaoLivroAutor = 'incluir';
    livroIdSelect.focus();
    mostrarMensagem('Selecione livro e autor para associar', 'info');
}

function excluirAssociacaoLivroAutor() {
    if (!currentAssociacaoLivroId || !currentAssociacaoAutorId) {
        mostrarMensagem('Selecione uma associação primeiro', 'warning');
        return;
    }
    if (!confirm('Confirma exclusão da associação?')) return;
    bloquearCamposLivroAutor(true);
    mostrarBotoesLivroAutor(false, false, false, true, true);
    operacaoLivroAutor = 'excluir';
    mostrarMensagem('Confirme salvando para excluir', 'warning');
}

async function salvarLivroAutor() {
    if (!operacaoLivroAutor) {
        mostrarMensagem('Nenhuma operação selecionada', 'warning');
        return;
    }
    const livroId = livroIdSelect.value;
    const autorId = autorIdSelect.value;
    if (!livroId || !autorId) {
        mostrarMensagem('Selecione livro e autor', 'warning');
        return;
    }
    try {
        let response;
        if (operacaoLivroAutor === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livroautor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ livro_id: parseInt(livroId), autor_id: parseInt(autorId) })
            });
        } else if (operacaoLivroAutor === 'excluir') {
            response = await fetch(`${API_BASE_URL}/livroautor/${currentAssociacaoLivroId}/${currentAssociacaoAutorId}`, {
                method: 'DELETE'
            });
        }
        if (response.ok) {
            mostrarMensagem(`Associação ${operacaoLivroAutor}ída com sucesso!`, 'success');
            limparFormularioLivroAutor();
            carregarAssociacoesLivroAutor();
            mostrarBotoesLivroAutor(true, false, false, false, true);
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar associação:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

function cancelarLivroAutor() {
    limparFormularioLivroAutor();
    mostrarBotoesLivroAutor(true, false, false, false, true);
    searchLivroIdSelect.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para excluir associação diretamente da tabela (ação rápida)
async function excluirAssociacaoDaTabela(livroId, autorId) {
    if (!confirm('Confirma exclusão desta associação?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/livroautor/${livroId}/${autorId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            mostrarMensagem('Associação excluída com sucesso!', 'success');
            carregarAssociacoesLivroAutor(); // Recarrega a tabela
        } else {
            const errorData = await response.json();
            mostrarMensagem(errorData.error || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir associação da tabela:', error);
        mostrarMensagem('Erro ao excluir', 'error');
    }
}

