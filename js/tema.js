/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

// Carregado no <head>, antes da página aparecer: o tema certo já está aplicado quando o navegador pinta a tela (sem piscar)

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

// primeira visita: segue o tema do sistema
aplicarTema(temaSalvo() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'))