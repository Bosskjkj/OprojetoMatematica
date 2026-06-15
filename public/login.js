const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

function showMessage(text) {
  message.textContent = text;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showMessage('Preencha e-mail e senha para continuar.');
    return;
  }

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.mensagem || `Erro ao fazer login: ${response.status}`);
    }

    if (!result.token) {
      throw new Error('Token não foi retornado pelo servidor');
    }

    localStorage.setItem('jwtToken', result.token);
    setTimeout(() => {
      window.location.href = '/home';
    }, 500);
  } catch (error) {
    console.error('Erro de login:', error);
    showMessage(error.message || 'Erro ao conectar com o servidor');
  }
}

loginForm.addEventListener('submit', handleLogin);
