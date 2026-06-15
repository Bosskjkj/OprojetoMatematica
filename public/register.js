const registerForm = document.getElementById('registerForm');
const message = document.getElementById('message');

function showMessage(text) {
  message.textContent = text;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

async function handleRegister(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const passwordConfirm = document.getElementById('passwordConfirm').value.trim();

  if (!email || !password || !passwordConfirm) {
    showMessage('Preencha todos os campos para continuar.');
    return;
  }

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, passwordConfirm })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.mensagem || 'Erro ao cadastrar');
    }

    showMessage('Cadastro concluído! Redirecionando para a página de confirmação...');
    setTimeout(() => {
      window.location.href = '/cadastro-sucesso';
    }, 1200);
  } catch (error) {
    showMessage(error.message);
  }
}

registerForm.addEventListener('submit', handleRegister);
