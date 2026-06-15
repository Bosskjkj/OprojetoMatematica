const logoutButton = document.getElementById('logoutButton');
const questoesContainer = document.getElementById('questoesContainer');
const errorMessage = document.getElementById('errorMessage');
const topicoNome = document.getElementById('topicoNome');
const contador = document.getElementById('contador');

let questoes = [];
let questionIndex = 0;

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

async function carregarTopico() {
  try {
    const topicoId = getQueryParam('id');
    if (!topicoId) {
      window.location.href = '/home';
      return;
    }

    const response = await fetch(`/api/topicos/${topicoId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar tópico');
    }

    const topico = await response.json();
    topicoNome.textContent = topico.nome;
  } catch (erro) {
    showError(erro.message);
  }
}

async function carregarQuestoes() {
  try {
    const topicoId = getQueryParam('id');
    if (!topicoId) {
      window.location.href = '/home';
      return;
    }

    const response = await fetch(`/api/questoes/topico/${topicoId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar questões');
    }

    questoes = await response.json();
    if (questoes.length === 0) {
      questoesContainer.innerHTML = '<p>Nenhuma questão disponível para este tópico</p>';
      return;
    }
    renderQuizView();
  } catch (erro) {
    showError(erro.message);
  }
}

function exibirQuestao(index) {
  if (index < 0 || index >= questoes.length) {
    return;
  }

  questionIndex = index;
  const questao = questoes[index];
  
  contador.textContent = `Questão ${index + 1} de ${questoes.length}`;

  const hasOpcoes = questao.opcao_a !== undefined || questao.opcao_b !== undefined || questao.opcao_c !== undefined || questao.opcao_d !== undefined;
  let opcoesHtml = '';
  let verificarButtonLabel = 'Verificar Resposta';

  if (hasOpcoes) {
    const opcoes = ['A', 'B', 'C', 'D'];
    if (questao.opcao_e) opcoes.push('E');

    opcoesHtml = opcoes.map(letra => {
      const valor = questao[`opcao_${letra.toLowerCase()}`];
      return `
        <div class="opcao-group">
          <label class="opcao-label">
            <input type="radio" class="opcao-input" name="resposta" value="${letra}" />
            <strong>${letra}):</strong> ${valor}
          </label>
        </div>
      `;
    }).join('');
  } else {
    verificarButtonLabel = 'Mostrar resposta';
  }

  const referenciasHtml = questao.referencias ? `<div class="questao-referencias"><strong>Referência:</strong> ${questao.referencias}</div>` : '';

  questoesContainer.innerHTML = `
    <div class="questao-card">
      <div class="questao-titulo">${questao.titulo || 'Questão ' + (index + 1)}</div>
      <div class="questao-enunciado">${questao.enunciado}</div>
      ${referenciasHtml}
      <div class="opcoes-container">
        ${opcoesHtml}
      </div>
      <button class="btn-verificar" onclick="verificarResposta()">${verificarButtonLabel}</button>
      <div class="resposta-feedback" id="feedback"></div>
      <div class="navegacao-questoes">
        <button class="btn-nav" onclick="irParaQuestao(${index - 1})" ${index === 0 ? 'disabled' : ''}>← Anterior</button>
        <button class="btn-nav" onclick="irParaQuestao(${index + 1})" ${index === questoes.length - 1 ? 'disabled' : ''}>Próxima →</button>
      </div>
    </div>
  `;
}

async function verificarResposta() {
  const questao = questoes[questionIndex];
  const respostaSelecionada = document.querySelector('input[name="resposta"]:checked');
  const hasOpcoes = questao.opcao_a !== undefined || questao.opcao_b !== undefined || questao.opcao_c !== undefined || questao.opcao_d !== undefined;

  try {
    if (!hasOpcoes) {
      const feedback = document.getElementById('feedback');
      const respostaCorreta = questao.resposta_correta || 'Resposta não disponível';
      const explicacao = questao.explicacao ? `\n\n${questao.explicacao}` : '';
      feedback.className = 'resposta-feedback acertou';
      feedback.textContent = `Resposta: ${respostaCorreta}${explicacao}`;
      feedback.style.display = 'block';
      return;
    }

    if (!respostaSelecionada) {
      alert('Selecione uma resposta!');
      return;
    }

    const response = await fetch(`/api/questoes/${questao.id}/verificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ resposta: respostaSelecionada.value })
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao verificar resposta');
    }

    const resultado = await response.json();
    const feedback = document.getElementById('feedback');
    
    if (resultado.acertou) {
      feedback.className = 'resposta-feedback acertou';
      feedback.textContent = '✓ Resposta correta!';
    } else {
      feedback.className = 'resposta-feedback errou';
      feedback.textContent = `✗ Resposta incorreta. A resposta correta é: ${resultado.resposta}`;
    }
    feedback.style.display = 'block';
  } catch (erro) {
    showError(erro.message);
  }
}

function irParaQuestao(index) {
  if (index >= 0 && index < questoes.length) {
    exibirQuestao(index);
  }
}

function renderQuizView() {
  const html = [];
  html.push('<div class="quiz-header"><button id="corrigirBtn" class="btn-primary">Corrigir Quiz</button> <span id="quizScore" style="margin-left:12px"></span></div>');

  questoes.forEach((q, idx) => {
    const id = q.id || q.idq || idx;
    const enunciado = q.enunciado || '';
    const referencias = q.referencias || '';
    const explicacao = q.explicacao || '';

    let opcaoA = q.opcao_a || q.opcaoA || q['opcao_a'];
    let opcaoB = q.opcao_b || q.opcaoB || q['opcao_b'];
    let opcaoC = q.opcao_c || q.opcaoC || q['opcao_c'];
    let opcaoD = q.opcao_d || q.opcaoD || q['opcao_d'];
    let opcaoE = q.opcao_e || q.opcaoE || q['opcao_e'];

    // fallback: extrair alternativas do enunciado quando o banco retorna tudo junto
    if (!opcaoA && /A[)\.]/.test(enunciado)) {
      const parts = enunciado.split(/(?=[A-E][)\.]\s)/g).map(p => p.trim()).filter(Boolean);
      const extracted = {};
      parts.forEach(p => {
        const m = p.match(/^([A-E])[)\.]\s*(.*)$/s);
        if (m) extracted[m[1]] = m[2].trim();
      });
      opcaoA = opcaoA || extracted['A'];
      opcaoB = opcaoB || extracted['B'];
      opcaoC = opcaoC || extracted['C'];
      opcaoD = opcaoD || extracted['D'];
      opcaoE = opcaoE || extracted['E'];
    }

    html.push(`<div class="questao-card" data-id="${id}">`);
    html.push(`<div class="questao-titulo">${q.titulo || 'Questão ' + (idx + 1)}</div>`);
    html.push(`<div class="questao-enunciado">${enunciado}</div>`);
    if (referencias) html.push(`<div class="questao-referencias"><strong>Referência:</strong> ${referencias}</div>`);

    if (opcaoA || opcaoB || opcaoC || opcaoD || opcaoE) {
      html.push('<div class="opcoes-container">');
      [['A', opcaoA], ['B', opcaoB], ['C', opcaoC], ['D', opcaoD], ['E', opcaoE]].forEach(([letra, valor]) => {
        if (!valor) return;
        html.push(`
          <div class="opcao-group">
            <label class="opcao-label">
              <input type="radio" name="resposta_${id}" value="${letra}" />
              <strong>${letra})</strong> ${valor}
            </label>
          </div>
        `);
      });
      html.push('</div>');
    } else {
      html.push('<div class="opcoes-container"><em>Questão dissertativa — será exibida a resposta após correção.</em></div>');
    }

    html.push(`<div class="resposta-feedback" id="feedback_${id}" style="display:none"></div>`);
    if (explicacao) html.push(`<div class="explicacao" id="explicacao_${id}" style="display:none"><strong>Explicação:</strong> ${explicacao}</div>`);
    html.push('</div>');
  });

  questoesContainer.innerHTML = html.join('');
  const btn = document.getElementById('corrigirBtn');
  if (btn) btn.addEventListener('click', corrigirQuiz);
}

async function corrigirQuiz() {
  const total = questoes.length;
  const promises = questoes.map(async q => {
    const id = q.id || q.idq || q.IDQ || q.ID_Q;
    const feedbackEl = document.getElementById(`feedback_${id}`);
    const explicacaoEl = document.getElementById(`explicacao_${id}`);
    const selected = document.querySelector(`input[name="resposta_${id}"]:checked`);
    if (!selected) {
      if (explicacaoEl) explicacaoEl.style.display = 'block';
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'resposta-feedback sem-resposta';
        feedbackEl.textContent = 'Não respondida / dissertativa';
      }
      return 0;
    }

    try {
      const response = await fetch(`/api/questoes/${id}/verificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ resposta: selected.value })
      });

      if (!response.ok) {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.className = 'resposta-feedback errou';
          feedbackEl.textContent = 'Erro ao verificar';
        }
        return 0;
      }

      const result = await response.json();
      if (result.acertou) {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.className = 'resposta-feedback acertou';
          feedbackEl.textContent = '✓ Resposta correta!';
        }
        return 1;
      } else {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.className = 'resposta-feedback errou';
          feedbackEl.textContent = `✗ Resposta incorreta. Correta: ${result.resposta}`;
        }
        if (explicacaoEl) explicacaoEl.style.display = 'block';
        return 0;
      }
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'resposta-feedback errou';
        feedbackEl.textContent = 'Erro ao verificar';
      }
      return 0;
    }
  });

  const results = await Promise.all(promises);
  const corretas = results.reduce((s, v) => s + v, 0);
  const scoreEl = document.getElementById('quizScore');
  if (scoreEl) scoreEl.textContent = `Pontuação: ${corretas} / ${total}`;
}

logoutButton.addEventListener('click', redirectToLogin);
carregarTopico();
carregarQuestoes();
