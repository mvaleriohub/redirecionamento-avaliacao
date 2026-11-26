/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

// Estrutura do painel: vistas por hash, menu lateral no celular, tema e conta.
// Depende de painel.js (usa sessao e encerrarSessao) e de tema.js (alternarTema)

const Menu = document.getElementById('menu')
const FundoMenu = document.getElementById('fundomenu')
const AbrirMenu = document.getElementById('abrirmenu')
const TituloVista = document.getElementById('tituloVista')
const AlternarTema = document.getElementById('alternarTema')
const Conta = document.getElementById('conta')
const BotaoConta = document.getElementById('botaoConta')
const MenuConta = document.getElementById('menuconta')
const EmailConta = document.getElementById('emailConta')
const SairPainel = document.getElementById('sairPainel')
const Vistas = document.querySelectorAll('.vista')
const LinksMenu = document.querySelectorAll('#menu > nav > a')

const titulos = {
  dashboard: 'Dashboard',
  placas: 'Placas',
  estoque: 'Estoque e lotes',
  qr: 'Gerador de QR',
  backup: 'Backup',
  config: 'Configurações'
}

const vistaInicial = 'placas' // vira 'dashboard' quando o dashboard existir (Fase 6)

// ----- Vistas -----
function nomeDoHash() {
  const nome = location.hash.slice(1)

  return Object.hasOwn(titulos, nome) ? nome : vistaInicial
}

function mostrarVista(nome) {
  for (const vista of Vistas) {
    vista.classList.toggle('oculto', vista.dataset.vista != nome)
  }

  for (const link of LinksMenu) {
    if (link.dataset.vista == nome) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  }

  TituloVista.textContent = titulos[nome]
  fecharMenu()
  fecharConta()
}

// ----- Menu (celular) -----
function abrirMenu() {
  Menu.classList.add('aberto')
  FundoMenu.classList.remove('oculto')
  AbrirMenu.setAttribute('aria-expanded', 'true')

  const atual = Menu.querySelector('[aria-current]')
  if (atual) atual.focus()
}

function fecharMenu() {
  Menu.classList.remove('aberto')
  FundoMenu.classList.add('oculto')
  AbrirMenu.setAttribute('aria-expanded', 'false')
}

// ----- Conta -----
function emailDaSessao() {
  // o e-mail vem no próprio token da sessão
  try {
    const carga = sessao.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(carga)).email || ''
  } catch (erro) {
    return ''
  }
}

function fecharConta() {
  MenuConta.classList.add('oculto')
  BotaoConta.setAttribute('aria-expanded', 'false')
}

function alternarConta() {
  if (!MenuConta.classList.contains('oculto')) {
    fecharConta()
    return
  }

  EmailConta.textContent = emailDaSessao()
  MenuConta.classList.remove('oculto')
  BotaoConta.setAttribute('aria-expanded', 'true')
}

// ----- Eventos -----
AbrirMenu.addEventListener('click', abrirMenu)
FundoMenu.addEventListener('click', fecharMenu)
AlternarTema.addEventListener('click', () => alternarTema())
BotaoConta.addEventListener('click', alternarConta)

SairPainel.addEventListener('click', () => {
  fecharConta()
  encerrarSessao()
})

for (const link of LinksMenu) {
  // clicar na vista que já está aberta não muda o hash, então o menu fecha aqui
  link.addEventListener('click', fecharMenu)
}

document.addEventListener('click', (evento) => {
  if (!Conta.contains(evento.target)) fecharConta()
})

document.addEventListener('keydown', (evento) => {
  if (evento.key != 'Escape') return

  if (Menu.classList.contains('aberto')) {
    fecharMenu()
    AbrirMenu.focus()
  }

  fecharConta()
})

window.addEventListener('hashchange', () => mostrarVista(nomeDoHash()))

// ao passar para a tela grande o menu já fica fixo, então o fundo escuro sai
matchMedia('(min-width: 900px)').addEventListener('change', fecharMenu)

// painel?c=k7x2 abre a placa pelo painel.js, e o editor fica na vista Placas
mostrarVista(new URLSearchParams(location.search).get('c') ? 'placas' : nomeDoHash())