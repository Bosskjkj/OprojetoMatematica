const { useState, useEffect } = React;

function getToken() {
  return localStorage.getItem('jwtToken');
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function extractOptionsFromEnunciado(enunciado) {
  if (!enunciado) return {};
  if (!/A[)\.]/.test(enunciado)) return {};
  const parts = enunciado.split(/(?=[A-E][)\.]\s)/g).map(p => p.trim()).filter(Boolean);
  const extracted = {};
  parts.forEach(p => {
    const m = p.match(/^([A-E])[)\.]\s*(.*)$/s);
    if (m) extracted[m[1]] = m[2].trim();
  });
  return extracted;
}

function detectImage(q) {
  return q.imagem || q.imagem_url || q.imagemUrl || q.image || q.image_url || q.imagemURL || null;
}

function App() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState({});
  const [score, setScore] = useState(null);
  const topicoId = getQueryParam('id');

  useEffect(() => {
    async function fetchQuestoes() {
      try {
        const endpoint = topicoId ? `/api/questoes/topico/${topicoId}` : '/api/questoes';
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (res.status === 401) return window.location.href = '/';
        const data = await res.json();
        setQuestoes(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestoes();
  }, [topicoId]);

  async function corrigir() {
    const results = [];
    const newFeedbacks = {};
    for (const q of questoes) {
      const id = q.id || q.idq;
      const selected = document.querySelector(`input[name=\"resposta_${id}\"]:checked`);
      const feedbackElId = `feedback_${id}`;
      if (!selected) {
        newFeedbacks[feedbackElId] = { status: 'none', text: 'Não respondida / dissertativa' };
        continue;
      }
      try {
        const res = await fetch(`/api/questoes/${id}/verificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ resposta: selected.value })
        });
        if (!res.ok) {
          newFeedbacks[feedbackElId] = { status: 'error', text: 'Erro ao verificar' };
          results.push(0);
          continue;
        }
        const json = await res.json();
        if (json.acertou) {
          newFeedbacks[feedbackElId] = { status: 'acertou', text: '✓ Resposta correta!' };
          results.push(1);
        } else {
          newFeedbacks[feedbackElId] = { status: 'errou', text: `✗ Resposta incorreta. Correta: ${json.resposta}` };
          results.push(0);
        }
      } catch (err) {
        newFeedbacks[feedbackElId] = { status: 'error', text: 'Erro ao verificar' };
        results.push(0);
      }
    }
    setFeedbacks(newFeedbacks);
    const corretas = results.reduce((s, v) => s + v, 0);
    setScore(`${corretas} / ${questoes.length}`);
  }

  if (loading) return React.createElement('div', { className: 'loading' }, 'Carregando questões...');

  if (!questoes || questoes.length === 0) return React.createElement('div', null, 'Nenhuma questão disponível para este tópico');

  return (
    React.createElement('div', null,
      React.createElement('div', { className: 'quiz-header' },
        React.createElement('button', { id: 'corrigirBtn', className: 'btn-primary', onClick: corrigir }, 'Corrigir Quiz'),
        React.createElement('span', { id: 'quizScore', style: { marginLeft: 12 } }, score ? `Pontuação: ${score}` : '')
      ),
      questoes.map((q, idx) => {
        const id = q.id || q.idq || idx;
        const enunciado = q.enunciado || q.Enunciado || q.titulo || '';
        const referencias = q.referencias || q.Referencias || '';
        const explicacao = q.explicacao || q.Explicacao || '';
        const image = detectImage(q);

        let opcaoA = q.opcao_a || q.opcaoA || q['opcao_a'];
        let opcaoB = q.opcao_b || q.opcaoB || q['opcao_b'];
        let opcaoC = q.opcao_c || q.opcaoC || q['opcao_c'];
        let opcaoD = q.opcao_d || q.opcaoD || q['opcao_d'];
        let opcaoE = q.opcao_e || q.opcaoE || q['opcao_e'];

        if (!opcaoA) {
          const extracted = extractOptionsFromEnunciado(enunciado);
          opcaoA = opcaoA || extracted['A'];
          opcaoB = opcaoB || extracted['B'];
          opcaoC = opcaoC || extracted['C'];
          opcaoD = opcaoD || extracted['D'];
          opcaoE = opcaoE || extracted['E'];
        }

        const hasOpcoes = opcaoA || opcaoB || opcaoC || opcaoD || opcaoE;

        return (
          React.createElement('div', { key: id, className: 'questao-card', 'data-id': id },
            React.createElement('div', { className: 'questao-titulo' }, q.titulo || `Questão ${idx + 1}`),
            React.createElement('div', { className: 'questao-enunciado' }, (
              React.createElement('div', null, React.createElement('span', null, enunciado))
            )),
            image ? React.createElement('div', { style: { marginTop: 12 } }, React.createElement('img', { src: image, alt: 'Imagem da questão', style: { maxWidth: '100%', borderRadius: 6 } })) : null,
            referencias ? React.createElement('div', { className: 'questao-referencias' }, React.createElement('strong', null, 'Referência:'), ` ${referencias}`) : null,
            hasOpcoes ? React.createElement('div', { className: 'opcoes-container' },
              ['A','B','C','D','E'].map(letra => {
                const valor = ({ A: opcaoA, B: opcaoB, C: opcaoC, D: opcaoD, E: opcaoE })[letra];
                if (!valor) return null;
                return React.createElement('div', { className: 'opcao-group', key: letra },
                  React.createElement('label', { className: 'opcao-label' },
                    React.createElement('input', { type: 'radio', name: `resposta_${id}`, value: letra }),
                    React.createElement('strong', null, `${letra}) `),
                    React.createElement('span', null, ` ${valor}`)
                  )
                );
              })
            ) : React.createElement('div', { className: 'opcoes-container' }, React.createElement('em', null, 'Questão dissertativa — será exibida a resposta após correção.')),
            React.createElement('div', { className: `resposta-feedback ${feedbacks[`feedback_${id}`]?.status || ''}`, id: `feedback_${id}`, style: { display: feedbacks[`feedback_${id}`] ? 'block' : 'none', marginTop: 12 } }, feedbacks[`feedback_${id}`]?.text || ''),
            explicacao ? React.createElement('div', { className: 'explicacao', id: `explicacao_${id}`, style: { display: feedbacks[`feedback_${id}`] ? 'block' : 'none', marginTop: 8 } }, React.createElement('strong', null, 'Explicação: '), explicacao) : null
          )
        );
      })
    )
  );
}

const mount = document.createElement('div');
const container = document.getElementById('questoesContainer');
container.innerHTML = '';
container.appendChild(mount);
ReactDOM.createRoot(mount).render(React.createElement(App));
