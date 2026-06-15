
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';

const API_LIMIT = 30;

function getToken() {
  return localStorage.getItem('jwtToken');
}

function extractOptionsFromText(text = '') {
  const match = text.match(/(?:^|\s)([A-Ea-e][).]\s)/);
  if (!match) {
    return { statement: text, options: [] };
  }

  const statement = text.slice(0, match.index).trim();
  const optionText = text.slice(match.index).trim();
  const parts = optionText.split(/(?=[A-Ea-e][).]\s)/g).map((part) => part.trim()).filter(Boolean);

  const options = parts.map((part) => {
    const optionMatch = part.match(/^([A-Ea-e])[).]\s*(.*)$/s);
    if (!optionMatch) return null;
    return { letter: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() };
  }).filter(Boolean);

  return { statement: statement || text, options };
}

function normalizeQuestion(question, index) {
  const rawStatement = question.enunciado || question.Enunciado || question.titulo || '';
  const extracted = extractOptionsFromText(rawStatement);
  const fromColumns = [
    ['A', question.opcao_a || question.opcaoA],
    ['B', question.opcao_b || question.opcaoB],
    ['C', question.opcao_c || question.opcaoC],
    ['D', question.opcao_d || question.opcaoD],
    ['E', question.opcao_e || question.opcaoE],
  ].filter(([, text]) => Boolean(text)).map(([letter, text]) => ({ letter, text }));

  const options = fromColumns.length > 0 ? fromColumns : extracted.options;
  const resposta = question.resposta || question.resposta_correta || question.Resposta || '';
  const imageUrl = question.imagem || question.imagem_url || question.imagemUrl || question.image_url || question.image || '';

  return {
    id: question.id || question.idq || index + 1,
    numero: index + 1,
    titulo: question.titulo || `Questao ${index + 1}`,
    enunciado: fromColumns.length > 0 ? rawStatement : extracted.statement,
    options,
    resposta: String(resposta).trim(),
    explicacao: question.explicacao || question.Explicacao || '',
    referencias: question.referencias || question.Referencias || '',
    imageUrl: String(imageUrl).trim().replace(/\s+/g, ''),
    topicId: question.topico_id || question.idtopico || null,
    topic: question.topico || question.nome_topico || question.topic || 'Sem topico',
  };
}

function isCorrectAnswer(question, answer) {
  const expected = question.resposta.toUpperCase();
  const selected = String(answer || '').toUpperCase();
  if (!expected || !selected) return false;
  if (expected === selected) return true;

  const selectedOption = question.options.find((option) => option.letter === selected);
  return selectedOption ? selectedOption.text.trim().toUpperCase() === expected : false;
}

function groupByTopic(questions) {
  return questions.reduce((groups, question) => {
    const key = question.topic || 'Sem topico';
    if (!groups[key]) groups[key] = [];
    groups[key].push(question);
    return groups;
  }, {});
}

function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestions() {
      try {
        setLoading(true);
        setError('');

        const token = getToken();
        const response = await fetch(`/api/questoes?limite=${API_LIMIT}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          let message = 'Nao foi possivel carregar as questoes do banco.';
          try {
            const errorData = await response.json();
            message = errorData.erro || errorData.mensagem || message;
          } catch {
            message = `${message} Status ${response.status}.`;
          }
          throw new Error(message);
        }

        const data = await response.json();
        setQuestions((Array.isArray(data) ? data : []).slice(0, API_LIMIT).map(normalizeQuestion));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadQuestions();
    return () => controller.abort();
  }, []);

  return { questions, loading, error };
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Matematica+</p>
          <h2>Portal de Estudos</h2>
          <p className="muted">Navegacao rapida para cadastro, simulado, estudos e dashboard.</p>
        </div>

        <nav className="nav-list">
          <NavLink to="/">Cadastro</NavLink>
          <NavLink to="/home">Home</NavLink>
          <NavLink to="/simulado">Simulado</NavLink>
          <NavLink to="/resultado">Resultado</NavLink>
          <NavLink to="/estudos">Estudos</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/grupo">Grupo</NavLink>
        </nav>

        <div className="mini-card">
          <strong>Resumo</strong>
          <p>React conectado ao backend Express e separado por topico.</p>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}

function QuestionsState({ loading, error, questions }) {
  if (loading) {
    return <div className="panel large"><strong>Carregando questoes do banco...</strong></div>;
  }

  if (error) {
    return <div className="panel large error-box"><strong>Erro:</strong> {error}</div>;
  }

  if (questions.length === 0) {
    return <div className="panel large">Nenhuma questao encontrada no banco.</div>;
  }

  return null;
}

function Card({ title, text }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Cadastro() {
  return (
    <Layout>
      <section className="hero-grid">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Crie sua conta e comece a estudar matematica com foco.</h1>
          <p className="lead">Tela de registro pronta para conectar com a API do backend.</p>
          <div className="button-row">
            <a className="btn primary" href="/home">Ir para Home</a>
            <a className="btn secondary" href="/simulado">Comecar simulado</a>
          </div>
        </div>
        <div className="panel">
          <h3>Cadastro</h3>
          <label>E-mail</label>
          <input placeholder="seu@exemplo.com" />
          <label>Senha</label>
          <input type="password" placeholder="********" />
          <label>Confirmar senha</label>
          <input type="password" placeholder="********" />
          <button className="btn primary full">Cadastrar</button>
        </div>
      </section>
    </Layout>
  );
}

function Home({ questions }) {
  const topics = useMemo(() => Object.entries(groupByTopic(questions)), [questions]);

  return (
    <Layout>
      <section>
        <p className="eyebrow">Home</p>
        <h1>Topicos carregados do banco</h1>
        <div className="grid-3">
          {topics.length > 0 ? topics.map(([topic, items]) => (
            <Card key={topic} title={topic} text={`${items.length} questoes disponiveis neste topico.`} />
          )) : (
            <>
              <Card title="Media / Moda / Mediana" text="Conceitos essenciais de estatistica." />
              <Card title="Desvio Padrao" text="Dispersao e interpretacao dos dados." />
              <Card title="Analise de Graficos" text="Leitura visual e comparacao de informacoes." />
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

function Simulado({ questions, loading, error, answers, setAnswers, seconds, setSeconds, started, setStarted }) {
  const navigate = useNavigate();

  const timerLabel = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [seconds]);

  useEffect(() => {
    if (!started) return undefined;
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [started, setSeconds]);

  const score = useMemo(() => {
    return questions.reduce((acc, item) => acc + (isCorrectAnswer(item, answers[item.id]) ? 1 : 0), 0);
  }, [answers, questions]);

  const state = <QuestionsState loading={loading} error={error} questions={questions} />;
  if (loading || error || questions.length === 0) {
    return <Layout><section><p className="eyebrow">Simulado</p><h1>Questoes do banco</h1>{state}</section></Layout>;
  }

  return (
    <Layout>
      <section>
        <p className="eyebrow">Simulado</p>
        <h1>30 questoes separadas por topico</h1>
        <div className="panel large">
          <div className="toolbar">
            <span className="badge">{questions.length} questoes</span>
            <span className="badge">{Object.keys(groupByTopic(questions)).length} topicos</span>
            <span className="badge">Cronometro: {timerLabel}</span>
            <button className="btn primary" onClick={() => { setStarted(true); setSeconds(0); }}>Iniciar tempo</button>
            <button className="btn secondary" onClick={() => navigate('/resultado')}>Finalizar simulado</button>
          </div>
          <p>As questoes abaixo vieram da rota <strong>/api/questoes?limite=30</strong>.</p>
        </div>

        <div className="stack-card">
          {Object.entries(groupByTopic(questions)).map(([topic, items]) => (
            <section className="topic-section" key={topic}>
              <h2>{topic}</h2>
              {items.map((q) => (
                <article className="panel" key={q.id}>
                  <p className="eyebrow">Questao {q.numero}</p>
                  <h3>{q.enunciado}</h3>
                  {q.imageUrl && (
                    <div className="question-image-wrap">
                      <img src={q.imageUrl} alt={`Imagem da questao ${q.numero}`} />
                    </div>
                  )}
                  {q.referencias && <p className="muted-dark"><strong>Referencia:</strong> {q.referencias}</p>}
                  {q.options.length > 0 ? (
                    <div className="option-grid">
                      {q.options.map((option) => (
                        <button
                          key={option.letter}
                          type="button"
                          className={`option-btn ${answers[q.id] === option.letter ? 'selected' : ''}`}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: option.letter }))}
                        >
                          <strong>{option.letter})</strong> {option.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-dark">Questao sem alternativas cadastradas.</p>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>

        <div className="panel large">
          <strong>Progresso:</strong> {Object.keys(answers).length} de {questions.length} respondidas. Pontuacao atual: {score}.
          {!started && <p className="muted-dark">Clique em "Iniciar tempo" para ativar o cronometro.</p>}
        </div>
      </section>
    </Layout>
  );
}

function Resultado({ questions, loading, error, answers, seconds }) {
  const state = <QuestionsState loading={loading} error={error} questions={questions} />;
  if (loading || error || questions.length === 0) {
    return <Layout><section><p className="eyebrow">Resultado</p><h1>Resumo do desempenho</h1>{state}</section></Layout>;
  }

  const acertos = questions.reduce((acc, item) => acc + (isCorrectAnswer(item, answers[item.id]) ? 1 : 0), 0);
  const erros = questions.length - acertos;
  const percentual = Math.round((acertos / questions.length) * 100);
  const minutos = Math.floor(seconds / 60);

  return (
    <Layout>
      <section>
        <p className="eyebrow">Resultado</p>
        <h1>Resumo do desempenho</h1>
        <div className="grid-3">
          <article className="panel"><h3>Acertos</h3><p className="metric">{acertos}/{questions.length}</p></article>
          <article className="panel"><h3>Erros</h3><p className="metric">{erros}</p></article>
          <article className="panel"><h3>Tempo</h3><p className="metric">{minutos} min</p></article>
        </div>
        <div className="panel large">
          <p>Percentual de aproveitamento: <strong>{percentual}%</strong>.</p>
        </div>
        <div className="stack-card">
          {questions.filter((q) => answers[q.id]).map((q) => (
            <article className="panel" key={q.id}>
              <h3>{q.numero}. {q.enunciado}</h3>
              {q.imageUrl && (
                <div className="question-image-wrap">
                  <img src={q.imageUrl} alt={`Imagem da questao ${q.numero}`} />
                </div>
              )}
              <p><strong>Sua resposta:</strong> {answers[q.id]}</p>
              <p><strong>Resposta correta:</strong> {q.resposta || 'Nao cadastrada'}</p>
              {q.explicacao && <p className="muted-dark">{q.explicacao}</p>}
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function Estudos({ questions, loading, error }) {
  const state = <QuestionsState loading={loading} error={error} questions={questions} />;
  const topics = useMemo(() => Object.entries(groupByTopic(questions)), [questions]);

  return (
    <Layout>
      <section>
        <p className="eyebrow">Estudos</p>
        <h1>Questoes separadas por topico</h1>
        {loading || error || questions.length === 0 ? state : (
          <div className="grid-2">
            {topics.map(([topic, items]) => (
              <article className="panel" key={topic}>
                <h3>{topic}</h3>
                <p>{items.length} questoes cadastradas.</p>
                <ol className="compact-list">
                  {items.map((question) => <li key={question.id}>{question.enunciado}</li>)}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function Dashboard({ questions, loading, error, answers }) {
  const state = <QuestionsState loading={loading} error={error} questions={questions} />;
  if (loading || error || questions.length === 0) {
    return <Layout><section><p className="eyebrow">Dashboard</p><h1>Graficos de desempenho</h1>{state}</section></Layout>;
  }

  const acertos = questions.reduce((acc, item) => acc + (isCorrectAnswer(item, answers[item.id]) ? 1 : 0), 0);
  const percentual = Math.round((acertos / questions.length) * 100);
  const progresso = Math.min(100, Math.round((Object.keys(answers).length / questions.length) * 100));

  return (
    <Layout>
      <section>
        <p className="eyebrow">Dashboard</p>
        <h1>Graficos de desempenho</h1>
        <div className="grid-2">
          <article className="panel"><h3>Aproveitamento</h3><div className="bar"><span style={{ width: `${percentual}%` }} /></div><p>{percentual}% de acerto geral com a base do banco.</p></article>
          <article className="panel"><h3>Progresso</h3><div className="bar"><span style={{ width: `${progresso}%` }} /></div><p>{Object.keys(answers).length} questoes respondidas ate o momento.</p></article>
        </div>
      </section>
    </Layout>
  );
}

function Grupo() {
  const members = [
    { name: 'Alexandre', role: 'Desenvolvimento', accent: 'linear-gradient(135deg,#2563eb,#38bdf8)' },
    { name: 'Giovanna Pires', role: 'Organizacao', accent: 'linear-gradient(135deg,#1d4ed8,#818cf8)' },
    { name: 'Pablo Neres', role: 'Integracao', accent: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
    { name: 'Marcos', role: 'Interface', accent: 'linear-gradient(135deg,#38bdf8,#bfdbfe)' },
    { name: 'Leide', role: 'Conteudo', accent: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
  ];

  return (
    <Layout>
      <section>
        <p className="eyebrow">Grupo</p>
        <h1>Integrantes</h1>
        <div className="grid-3">
          {members.map((member) => (
            <article className="panel member-card" key={member.name}>
              <div className="avatar" style={{ background: member.accent }}>{member.name.charAt(0)}</div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export default function App() {
  const { questions, loading, error } = useQuestions();
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setAnswers({});
  }, [questions]);

  return (
    <Routes>
      <Route path="/" element={<Cadastro />} />
      <Route path="/home" element={<Home questions={questions} />} />
      <Route path="/simulado" element={<Simulado questions={questions} loading={loading} error={error} answers={answers} setAnswers={setAnswers} seconds={seconds} setSeconds={setSeconds} started={started} setStarted={setStarted} />} />
      <Route path="/resultado" element={<Resultado questions={questions} loading={loading} error={error} answers={answers} seconds={seconds} />} />
      <Route path="/estudos" element={<Estudos questions={questions} loading={loading} error={error} />} />
      <Route path="/dashboard" element={<Dashboard questions={questions} loading={loading} error={error} answers={answers} />} />
      <Route path="/grupo" element={<Grupo />} />
    </Routes>
  );
}
