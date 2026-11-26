/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

// Estrutura do painel: vistas (endereço sempre sem #), menu lateral no celular, tema e conta.
// Depende de painel.js (sessao, encerrarSessao, emailDaSessao, mostrarConfig) e de tema.js (alternarTema)

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

const vistaInicial = 'dashboard'

// ----- Vistas -----
let vistaAtual = null

function nomeDoHash() {
  // só para links antigos com #placas; depois de abrir, o endereço fica sem hash
  const nome = location.hash.slice(1)

  return Object.hasOwn(titulos, nome) ? nome : vistaInicial
}

function mostrarVista(nome) {
  vistaAtual = nome

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
  if (nome == 'config') mostrarConfig() // atualiza a validade da sessão a cada visita
  fecharMenu()
  fecharConta()
}

// troca de vista sem mexer no endereço: o histórico guarda a vista, o link continua só "painel"
function irParaVista(nome) {
  if (nome != vistaAtual) history.pushState({vista: nome}, '', location.pathname + location.search)

  mostrarVista(nome)
  window.scrollTo(0, 0)
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

document.addEventListener('click', (evento) => {
  if (!Conta.contains(evento.target)) fecharConta()

  // qualquer link com data-vista (menu e atalhos) troca de vista sem colocar # no endereço
  const link = evento.target.closest('a[data-vista]')

  if (link) {
    evento.preventDefault()
    irParaVista(link.dataset.vista)
  }
})

document.addEventListener('keydown', (evento) => {
  if (evento.key != 'Escape') return

  if (Menu.classList.contains('aberto')) {
    fecharMenu()
    AbrirMenu.focus()
  }

  fecharConta()
})

// botão voltar do navegador
window.addEventListener('popstate', (evento) => {
  mostrarVista(evento.state && evento.state.vista ? evento.state.vista : vistaInicial)
})

// ao passar para a tela grande o menu já fica fixo, então o fundo escuro sai
matchMedia('(min-width: 900px)').addEventListener('change', fecharMenu)

// painel?c=k7x2 abre a placa pelo painel.js; o editor é um modal e abre sobre qualquer vista
const vistaDeEntrada = nomeDoHash()

history.replaceState({vista: vistaDeEntrada}, '', location.pathname + location.search) // tira o # do endereço
mostrarVista(vistaDeEntrada)