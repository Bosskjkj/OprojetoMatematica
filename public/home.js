const logoutButton = document.getElementById('logoutButton');
const disciplinasContainer = document.getElementById('disciplinasContainer');
const errorMessage = document.getElementById('errorMessage');

function getToken() {
  return localStorage.getItem('jwtToken');
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
}

function redirectToLogin() {
  localStorage.removeItem('jwtToken');
  window.location.href = '/';
}

async function carregarDisciplinas() {
  try {
    const response = await fetch('/api/disciplinas', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar disciplinas');
    }

    const disciplinas = await response.json();
    if (!disciplinas || disciplinas.length === 0) {
      carregarTopicosComoDisciplinas();
      return;
    }
    exibirDisciplinas(disciplinas);
  } catch (erro) {
    carregarTopicosComoDisciplinas();
  }
}

async function carregarTopicosComoDisciplinas() {
  try {
    const response = await fetch('/api/topicos', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar tópicos como disciplinas');
    }

    const topicos = await response.json();
    if (!topicos || topicos.length === 0) {
      disciplinasContainer.innerHTML = '<p>Nenhuma disciplina disponível</p>';
      return;
    }

    disciplinasContainer.innerHTML = topicos.map(t => {
      const label = t.descricao || t.Descricao || t.nome || t.Nome || 'Sem título';
      return `
        <a href="/questoes?id=${t.id}" class="disciplina-button">
          ${label}
        </a>
      `;
    }).join('');
  } catch (erro) {
    disciplinasContainer.innerHTML = '<p>Nenhuma disciplina disponível</p>';
  }
}

function exibirDisciplinas(disciplinas) {
  if (!disciplinas || disciplinas.length === 0) {
    disciplinasContainer.innerHTML = '<p>Nenhuma disciplina disponível</p>';
    return;
  }

  disciplinasContainer.innerHTML = disciplinas.map(d => {
    const label = d.descricao || d.Descricao || d.nome || d.Nome || 'Sem título';
    return `
      <a href="/topicos?id=${d.id}" class="disciplina-button">
        ${label}
      </a>
    `;
  }).join('');
}

logoutButton.addEventListener('click', redirectToLogin);
carregarDisciplinas();
