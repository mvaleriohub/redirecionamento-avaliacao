/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

// depende do contato.js (numeroWhatsapp), carregado antes deste arquivo

const Descricao = document.getElementById('descricao')
const Placa = document.getElementById('placa')
const CodigoConsultado = document.getElementById('codigoconsultado')
const Confirmar = document.getElementById('confirmar')
const Resposta = document.getElementById('resposta')
const Whatsapp = document.getElementById('whatsapp')

const codigo = new URLSearchParams(location.search).get('c')

// com o código de uma placa no endereço, a página mostra o código e a pergunta; qualquer outro endereço é um 404 comum
if (codigo && /^[a-z0-9]{3,12}$/.test(codigo)) {
  Descricao.textContent = 'Essa placa não está disponível no momento. Mas podemos ajudar você.'
  CodigoConsultado.textContent = codigo
  Placa.classList.remove('oculto')
}

Confirmar.addEventListener('click', () => {
  const mensagem = `Olá! Sou cliente e a minha placa de avaliação (código ${codigo}) deu erro. Ela deveria estar funcionando, mas parou.`

  Whatsapp.href = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`
  Confirmar.classList.add('oculto')
  Resposta.classList.remove('oculto')
})