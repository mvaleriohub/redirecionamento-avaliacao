/* 
Desenvolvido por Miguel Valério (mvaleriohub)
24/11/2026 -- (11/24/2026)
*/

const urlSupabase = 'https://tzkiyfafjivsujrhzhsb.supabase.co'
const chavePublica = 'sb_publishable_8pqTFeUWFOYTjGw0HmqT-Q_KbBfgsgY'

const TelaLogin = document.getElementById('login')
const TelaPainel = document.getElementById('painel')
const FormLogin = document.getElementById('formLogin')
const ErroLogin = document.getElementById('erroLogin')
const Sair = document.getElementById('sair')
const Mensagem = document.getElementById('mensagem')
const Busca = document.getElementById('busca')
const NovaPlaca = document.getElementById('novaPlaca')
const Editor = document.getElementById('editor')
const Lista = document.getElementById('lista')
const CampoCodigo = document.getElementById('campoCodigo')
const CampoCliente = document.getElementById('campoCliente')
const CampoLink = document.getElementById('campoLink')
const CampoAtiva = document.getElementById('campoAtiva')
const CampoData = document.getElementById('campoData')
const GerarCodigo = document.getElementById('gerarCodigo')
const Cancelar = document.getElementById('cancelar')

const RotuloLink = document.getElementById('rotuloLink')
const TrocarModo = document.getElementById('trocarModo')

const prefixoAvaliacao = 'https://search.google.com/local/writereview?placeid='
const padraoAvaliacao = /^https:\/\/search\.google\.com\/local\/writereview\?placeid=([A-Za-z0-9_-]+)$/

let sessao = null
let placas = []
let editando = null // código da placa aberta no editor; null quando é uma placa nova
let modoLink = 'placeid' // 'placeid' (padrão) ou 'completo' (link digitado inteiro)

// ----- Sessão -----
function guardarSessao(dados) {
  sessao = {
    token: dados.access_token,
    renovacao: dados.refresh_token,
    expira: Date.now() + dados.expires_in * 1000
  }
  localStorage.setItem('sessaoPlacas', JSON.stringify(sessao))
}

function carregarSessao() {
  try {
    sessao = JSON.parse(localStorage.getItem('sessaoPlacas'))
  } catch (erro) {
    sessao = null
  }
}

function encerrarSessao() {
  sessao = null
  localStorage.removeItem('sessaoPlacas')
  mostrarTela('login')
}

async function pedirToken(corpo, tipo) {
  const resposta = await fetch(`${urlSupabase}/auth/v1/token?grant_type=${tipo}`, {
    method: 'POST',
    headers: {'apikey': chavePublica, 'Content-Type': 'application/json'},
    body: JSON.stringify(corpo)
  })

  if (!resposta.ok) return false

  guardarSessao(await resposta.json())
  return true
}

async function tokenAtual() {
  if (!sessao) return null

  // renova 1 minuto antes de expirar para não falhar no meio de uma ação
  if (Date.now() > sessao.expira - 60000) {
    const renovou = await pedirToken({refresh_token: sessao.renovacao}, 'refresh_token')
    if (!renovou) return null
  }

  return sessao.token
}

async function requisicao(caminho, opcoes = {}) {
  const token = await tokenAtual()

  if (!token) {
    encerrarSessao()
    return null
  }

  const resposta = await fetch(`${urlSupabase}${caminho}`, {
    ...opcoes,
    headers: {
      'apikey': chavePublica,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opcoes.headers
    }
  })

  if (resposta.status == 401) {
    encerrarSessao()
    return null
  }

  return resposta
}

// ----- Telas e avisos -----
function mostrarTela(tela) {
  TelaLogin.classList.toggle('oculto', tela != 'login')
  TelaPainel.classList.toggle('oculto', tela != 'painel')
  Sair.classList.toggle('oculto', tela != 'painel')
}

function avisar(texto, erro = false) {
  Mensagem.textContent = texto
  Mensagem.classList.toggle('erro', erro)
  setTimeout(() => {
    Mensagem.textContent = ''
  }, 4000)
}

function hoje() {
  return new Date().toLocaleDateString('en-CA') // formato AAAA-MM-DD
}

// ----- Lista -----
async function carregarPlacas() {
  const resposta = await requisicao('/rest/v1/placas?select=*&order=criado_em.desc')

  if (!resposta) return

  if (!resposta.ok) {
    avisar('Erro ao carregar as placas.', true)
    return
  }

  placas = await resposta.json()
  mostrarLista()
}

function mostrarLista() {
  const termo = Busca.value.trim().toLowerCase()
  Lista.replaceChildren()

  for (const placa of placas) {
    const texto = `${placa.codigo} ${placa.cliente || ''}`.toLowerCase()
    if (termo && !texto.includes(termo)) continue

    const item = document.createElement('li')
    const codigo = document.createElement('strong')
    const cliente = document.createElement('span')
    const estado = document.createElement('small')

    codigo.textContent = placa.codigo
    cliente.textContent = placa.cliente || 'Sem cliente'
    estado.textContent = placa.ativa ? 'Ativa' : 'Inativa'
    item.classList.add(placa.ativa ? 'ativa' : 'inativa')
    item.append(codigo, cliente, estado)
    item.addEventListener('click', () => abrirEditor(placa.codigo))
    Lista.appendChild(item)
  }

  if (!Lista.children.length) {
    const vazio = document.createElement('li')
    vazio.textContent = 'Nenhuma placa encontrada.'
    Lista.appendChild(vazio)
  }
}

// ----- Editor -----
function definirModo(modo) {
  modoLink = modo

  if (modo == 'placeid') {
    RotuloLink.textContent = 'Place ID'
    CampoLink.placeholder = 'Cole o Place ID (ChIJ...)'
    TrocarModo.textContent = 'Usar o link completo'
  } else {
    RotuloLink.textContent = 'Link de avaliação'
    CampoLink.placeholder = 'https://...'
    TrocarModo.textContent = 'Usar só o Place ID'
  }
}

function abrirEditor(codigo) {
  const placa = placas.find((p) => p.codigo == codigo)
  const link = placa ? placa.link_avaliacao || '' : ''
  const achado = link.match(padraoAvaliacao)

  editando = placa ? placa.codigo : null
  CampoCodigo.value = codigo
  CampoCodigo.disabled = editando != null // o código não muda depois de criado
  GerarCodigo.classList.toggle('oculto', editando != null)
  CampoCliente.value = placa ? placa.cliente || '' : ''

  // link no formato padrão mostra só o Place ID; qualquer outro link abre no modo completo
  if (achado) {
    definirModo('placeid')
    CampoLink.value = achado[1]
  } else if (link) {
    definirModo('completo')
    CampoLink.value = link
  } else {
    definirModo('placeid')
    CampoLink.value = ''
  }

  CampoAtiva.checked = placa ? placa.ativa : false
  // data de hoje sempre que não houver uma data guardada (placa nova ou sem data)
  CampoData.value = placa && placa.data_venda ? placa.data_venda : hoje()
  Editor.classList.remove('oculto')
  Editor.scrollIntoView({behavior: 'smooth'})
}

function fecharEditor() {
  Editor.classList.add('oculto')
  editando = null
}

function gerarCodigo() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789' // sem i, l, o, 0 e 1 para não confundir na leitura
  let novo

  do {
    novo = ''
    for (let i = 0; i < 4; i++) {
      novo += letras[Math.floor(Math.random() * letras.length)]
    }
  } while (placas.some((p) => p.codigo == novo))

  CampoCodigo.value = novo
}

async function salvarPlaca(evento) {
  evento.preventDefault()

  const codigo = CampoCodigo.value.trim().toLowerCase()
  const valorLink = CampoLink.value.trim()
  const ativa = CampoAtiva.checked

  if (!/^[a-z0-9]{3,12}$/.test(codigo)) {
    avisar('Código: de 3 a 12 letras minúsculas ou números.', true)
    return
  }

  if (valorLink && modoLink == 'placeid' && !/^[A-Za-z0-9_-]{20,}$/.test(valorLink)) {
    avisar('Place ID inválido. Confira se copiou inteiro, sem espaços.', true)
    return
  }

  if (valorLink && modoLink == 'completo' && !valorLink.startsWith('https://')) {
    avisar('O link precisa começar com https://', true)
    return
  }

  if (ativa && !valorLink) {
    avisar('Para ativar, cole o Place ID (ou o link de avaliação).', true)
    return
  }

  // no modo padrão o link é montado a partir do Place ID
  const link = !valorLink ? '' : modoLink == 'placeid' ? prefixoAvaliacao + valorLink : valorLink

  const dados = {
    cliente: CampoCliente.value.trim() || null,
    link_avaliacao: link || null,
    ativa: ativa,
    data_venda: CampoData.value || (ativa ? hoje() : null)
  }

  let resposta

  if (editando) {
    resposta = await requisicao(`/rest/v1/placas?codigo=eq.${editando}`, {
      method: 'PATCH',
      headers: {'Prefer': 'return=minimal'},
      body: JSON.stringify(dados)
    })
  } else {
    resposta = await requisicao('/rest/v1/placas', {
      method: 'POST',
      headers: {'Prefer': 'return=minimal'},
      body: JSON.stringify({codigo, ...dados})
    })
  }

  if (!resposta) return

  if (resposta.status == 409) {
    avisar('Esse código já existe.', true)
    return
  }

  if (!resposta.ok) {
    avisar('Erro ao salvar. Tente de novo.', true)
    return
  }

  avisar('Salvo!')
  fecharEditor()
  await carregarPlacas()
}

// ----- Início -----
async function iniciarPainel() {
  mostrarTela('painel')
  await carregarPlacas()

  if (!sessao) return

  // painel.html?c=k7x2 já abre a placa k7x2 (ou o cadastro dela, se ainda não existir)
  const codigoUrl = new URLSearchParams(location.search).get('c')
  if (codigoUrl) abrirEditor(codigoUrl.toLowerCase())
}

FormLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  ErroLogin.textContent = ''

  try {
    const entrou = await pedirToken({
      email: document.getElementById('email').value,
      password: document.getElementById('senha').value
    }, 'password')

    if (!entrou) {
      ErroLogin.textContent = 'E-mail ou senha incorretos.'
      return
    }

    FormLogin.reset()
    await iniciarPainel()
  } catch (erro) {
    ErroLogin.textContent = 'Sem conexão. Tente de novo.'
  }
})

TrocarModo.addEventListener('click', () => {
  definirModo(modoLink == 'placeid' ? 'completo' : 'placeid')
  CampoLink.value = ''
  CampoLink.focus()
})

CampoLink.addEventListener('input', () => {
  const valor = CampoLink.value.trim()

  if (modoLink != 'placeid' || !valor.startsWith('https://')) return

  // colou um link no campo do Place ID: extrai o ID se for o formato padrão, senão troca para o modo completo
  const achado = valor.match(padraoAvaliacao)

  if (achado) {
    CampoLink.value = achado[1]
  } else {
    definirModo('completo')
  }
})

Sair.addEventListener('click', encerrarSessao)
Busca.addEventListener('input', mostrarLista)
NovaPlaca.addEventListener('click', () => abrirEditor(''))
GerarCodigo.addEventListener('click', gerarCodigo)
Cancelar.addEventListener('click', fecharEditor)
Editor.addEventListener('submit', salvarPlaca)

carregarSessao()

if (sessao) {
  iniciarPainel()
} else {
  mostrarTela('login')
}