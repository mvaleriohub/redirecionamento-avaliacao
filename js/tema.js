/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

// Carregado no <head>, antes da página aparecer: o tema certo já está aplicado quando o navegador pinta a tela (sem piscar)
// O padrão é sempre o claro, em qualquer aparelho. O escuro só vale depois que o admin escolhe pelo painel (alternarTema), e fica salvo naquele aparelho

function temaSalvo() {
  try {
    return localStorage.getItem('tema')
  } catch (erro) {
    return null
  }
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema
}

function alternarTema() {
  const novo = document.documentElement.dataset.tema == 'escuro' ? 'claro' : 'escuro'

  aplicarTema(novo)

  try {
    localStorage.setItem('tema', novo)
  } catch (erro) {
    // sem armazenamento disponível: o tema vale só até fechar a página
  }
}

aplicarTema(temaSalvo() == 'escuro' ? 'escuro' : 'claro')