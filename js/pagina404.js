/* 
Desenvolvido por Miguel Valério (mvaleriohub)
24/11/2026 -- (11/24/2026)
*/

const numeroWhatsapp = '5569999375311' // código do país + DDD + número, só dígitos (ex.: 5569999999999)

const Placa = document.getElementById('placa')
const Confirmar = document.getElementById('confirmar')
const Resposta = document.getElementById('resposta')
const Whatsapp = document.getElementById('whatsapp')

const codigo = new URLSearchParams(location.search).get('c')

// a pergunta só aparece quando o endereço tem o código de uma placa; qualquer outro endereço é um 404 comum
if (codigo && /^[a-z0-9]{3,12}$/.test(codigo)) {
  Placa.classList.remove('oculto')
}

Confirmar.addEventListener('click', () => {
  const mensagem = `Olá! Sou cliente e a minha placa de avaliação (código ${codigo}) deu erro. Ela deveria estar funcionando, mas parou.`

  Whatsapp.href = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`
  Confirmar.classList.add('oculto')
  Resposta.classList.remove('oculto')
})