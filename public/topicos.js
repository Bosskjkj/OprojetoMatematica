const logoutButton = document.getElementById('logoutButton');
const topicosContainer = document.getElementById('topicosContainer');
const errorMessage = document.getElementById('errorMessage');
const disciplinaNome = document.getElementById('disciplinaNome');
const disciplinaDescricao = document.getElementById('disciplinaDescricao');

function getToken() {
  return localStorage.getItem('jwtToken');
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
}

function redirectToLogin() {
  localStorage.removeItem('jwtToken');
  window.location.href = '/';
}

async function carregarDisciplina() {
  try {
    const disciplinaId = getQueryParam('id');
    if (!disciplinaId) {
      disciplinaNome.textContent = 'Tópicos';
      disciplinaDescricao.textContent = 'Selecione um tópico disponível';
      return;
    }

    const response = await fetch(`/api/disciplinas/${disciplinaId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      disciplinaNome.textContent = 'Tópicos';
      disciplinaDescricao.textContent = 'Selecione um tópico disponível';
      return;
    }

    const disciplina = await response.json();
    disciplinaNome.textContent = disciplina.nome;
    if (disciplina.descricao) {
      disciplinaDescricao.textContent = disciplina.descricao;
    }
  } catch (erro) {
    disciplinaNome.textContent = 'Tópicos';
    disciplinaDescricao.textContent = 'Selecione um tópico disponível';
  }
}

async function carregarTopicos() {
  try {
    const disciplinaId = getQueryParam('id');
    const endpoint = disciplinaId ? `/api/topicos/disciplina/${disciplinaId}` : '/api/topicos';

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar tópicos');
    }

    const topicos = await response.json();
    exibirTopicos(topicos);
  } catch (erro) {
    showError(erro.message);
  }
}

function exibirTopicos(topicos) {
  if (!topicos || topicos.length === 0) {
    topicosContainer.innerHTML = '<p>Nenhum tópico disponível para esta disciplina</p>';
    return;
  }

  topicosContainer.innerHTML = topicos.map(t => {
    const label = t.descricao || t.Descricao || t.nome || t.Nome || 'Sem título';
    return `
      <a href="/questoes?id=${t.id}" class="topico-button">
        ${label}
      </a>
    `;
  }).join('');
}

logoutButton.addEventListener('click', redirectToLogin);
carregarDisciplina();
carregarTopicos();
