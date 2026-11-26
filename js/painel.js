/* 
Desenvolvido por Miguel Valério (mvaleriohub)
25/11/2026 -- (11/25/2026)
*/

const urlSupabase = 'https://tzkiyfafjivsujrhzhsb.supabase.co'
const chavePublica = 'sb_publishable_8pqTFeUWFOYTjGw0HmqT-Q_KbBfgsgY'

const TelaLogin = document.getElementById('login')
const TelaPainel = document.getElementById('painel')
const FormLogin = document.getElementById('formLogin')
const ErroLogin = document.getElementById('erroLogin')
const Sair = document.getElementById('sair')
const TelaSegundoFator = document.getElementById('segundofator')
const TelaConfigurar = document.getElementById('configurar')
const FormCodigo = document.getElementById('formCodigo')
const FormConfigurar = document.getElementById('formConfigurar')
const CodigoAcesso = document.getElementById('codigoAcesso')
const CodigoConfigurar = document.getElementById('codigoConfigurar')
const ErroCodigo = document.getElementById('erroCodigo')
const ErroConfigurar = document.getElementById('erroConfigurar')
const QrConfigurar = document.getElementById('qrConfigurar')
const ChaveConfigurar = document.getElementById('chaveConfigurar')
const Mensagem = document.getElementById('mensagem')
const Busca = document.getElementById('busca')
const NovaPlaca = document.getElementById('novaPlaca')
const Chips = document.querySelectorAll('#filtros > button')
const Gaveta = document.getElementById('gaveta')
const Editor = document.getElementById('editor')
const TituloEditor = document.getElementById('tituloEditor')
const FecharGaveta = document.getElementById('fecharGaveta')
const Lista = document.getElementById('lista')
const CampoCodigo = document.getElementById('campoCodigo')
const CampoCliente = document.getElementById('campoCliente')
const CampoLink = document.getElementById('campoLink')
const CampoAtiva = document.getElementById('campoAtiva')
const CampoData = document.getElementById('campoData')
const GerarCodigo = document.getElementById('gerarCodigo')
const Cancelar = document.getElementById('cancelar')
const Excluir = document.getElementById('excluir')
const FormatoQr = document.getElementById('formatoQr')
const BaixarLote = document.getElementById('baixarLote')
const BaixarQr = document.getElementById('baixarQr')
const PreviaQr = document.getElementById('previaQr')
const DestinoQr = document.getElementById('destinoQr')
const ExportarCsv = document.getElementById('exportarCsv')
const NovoLote = document.getElementById('novoLote')
const DialogoLote = document.getElementById('dialogolote')
const FormLote = document.getElementById('formLote')
const CampoQuantidade = document.getElementById('campoQuantidade')
const CancelarLote = document.getElementById('cancelarLote')

const RotuloLink = document.getElementById('rotuloLink')
const TrocarModo = document.getElementById('trocarModo')

const prefixoAvaliacao = 'https://search.google.com/local/writereview?placeid='
const padraoAvaliacao = /^https:\/\/search\.google\.com\/local\/writereview\?placeid=([A-Za-z0-9_-]+)$/

// três pontos do botão de ações de cada linha (conteúdo fixo, não vem do banco)
const iconeMais = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>'

let sessao = null
let placas = []
let filtro = 'ativas' // 'ativas' (padrão), 'lote', 'inativas' ou 'todas'
let editando = null // código da placa aberta no editor; null quando é uma placa nova
let modoLink = 'placeid' // 'placeid' (padrão) ou 'completo' (link digitado inteiro)
let fatorId = null // id do fator do app autenticador (2FA) usado no login atual

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
  TelaSegundoFator.classList.toggle('oculto', tela != 'segundofator')
  TelaConfigurar.classList.toggle('oculto', tela != 'configurar')
  TelaPainel.classList.toggle('oculto', tela != 'painel')
  Sair.classList.toggle('oculto', tela == 'login')

  // saiu do painel (sessão encerrada): nada de modal aberto esperando na volta
  if (tela != 'painel') fecharDialogos()
}

function fecharDialogos() {
  fecharMenuLinha()

  for (const dialogo of document.querySelectorAll('dialog[open]')) {
    dialogo.close()
  }
}

function avisar(texto, erro = false) {
  // com um modal aberto a mensagem da página fica atrás dele, então o aviso aparece dentro do modal
  const aberto = document.querySelector('dialog[open]')
  const alvo = aberto ? aberto.querySelector('.avisomodal') : Mensagem

  alvo.textContent = texto
  alvo.classList.toggle('erro', erro)
  setTimeout(() => {
    alvo.textContent = ''
  }, 8000)
}

function hoje() {
  return new Date().toLocaleDateString('en-CA') // formato AAAA-MM-DD
}

function formatarData(texto) {
  if (!texto) return '—'

  // data_venda chega como AAAA-MM-DD; separar o texto evita o erro de fuso horário de new Date()
  const [ano, mes, dia] = texto.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// ----- Lista -----
async function carregarPlacas() {
  const resposta = await requisicao('/rest/v1/placas?select=*&order=criado_em.desc,codigo.asc')

  if (!resposta) return

  if (!resposta.ok) {
    avisar('Erro ao carregar as placas.', true)
    return
  }

  placas = await resposta.json()
  mostrarLista()
}

// ativa; lote (inativa e sem cliente nem link, ainda não vendida); inativa (já teve dados, foi desativada)
function estadoDaPlaca(placa) {
  if (placa.ativa) return 'ativa'
  if (!placa.cliente && !placa.link_avaliacao) return 'lote'
  return 'inativa'
}

function passaFiltro(placa) {
  if (filtro == 'todas') return true

  const estados = {ativas: 'ativa', lote: 'lote', inativas: 'inativa'}
  return estadoDaPlaca(placa) == estados[filtro]
}

// placas que aparecem na lista agora; o download de QRs em lote usa exatamente esta seleção
function placasDaLista() {
  const termo = Busca.value.trim().toLowerCase()

  return placas.filter((placa) => {
    // buscando, o filtro é ignorado: assim achar uma placa em lote ou inativa não depende do filtro
    if (termo) return `${placa.codigo} ${placa.cliente || ''}`.toLowerCase().includes(termo)

    return passaFiltro(placa)
  })
}

function definirFiltro(valor) {
  filtro = valor

  for (const chip of Chips) {
    chip.setAttribute('aria-pressed', chip.dataset.filtro == valor)
  }

  mostrarLista()
}

function atualizarContagens() {
  const nomes = {ativa: 'ativas', lote: 'lote', inativa: 'inativas'}
  const contagem = {ativas: 0, lote: 0, inativas: 0, todas: placas.length}

  for (const placa of placas) {
    contagem[nomes[estadoDaPlaca(placa)]]++
  }

  for (const chip of Chips) {
    chip.querySelector('span').textContent = contagem[chip.dataset.filtro]
  }
}

function criarLinha(placa) {
  const estado = estadoDaPlaca(placa)
  const item = document.createElement('li')
  const codigo = document.createElement('strong')
  const cliente = document.createElement('span')
  const status = document.createElement('span')
  const venda = document.createElement('span')
  const cadastro = document.createElement('span')
  const acoes = document.createElement('div')
  const botao = document.createElement('button')

  codigo.textContent = placa.codigo

  cliente.className = placa.cliente ? 'cliente' : 'cliente semcliente'
  cliente.textContent = placa.cliente || 'Sem cliente'

  status.className = `status ${estado}`
  status.textContent = {ativa: 'Ativa', lote: 'Em lote', inativa: 'Inativa'}[estado]

  // no celular o rótulo aparece antes da data (CSS: data-rotulo); na tabela o cabeçalho faz esse papel
  venda.className = 'venda'
  venda.dataset.rotulo = 'Venda'
  venda.textContent = formatarData(placa.data_venda)

  cadastro.className = 'cadastro'
  cadastro.dataset.rotulo = 'Cadastro'
  cadastro.textContent = placa.criado_em ? new Date(placa.criado_em).toLocaleDateString('pt-BR') : '—'

  acoes.className = 'acoes'
  botao.type = 'button'
  botao.className = 'icone'
  botao.setAttribute('aria-label', `Ações da placa ${placa.codigo}`)
  botao.setAttribute('aria-haspopup', 'menu')
  botao.innerHTML = iconeMais
  botao.addEventListener('click', (evento) => {
    evento.stopPropagation() // senão o clique também abriria o editor da linha
    alternarMenuLinha(acoes, placa.codigo)
  })
  acoes.appendChild(botao)

  item.append(codigo, cliente, status, venda, cadastro, acoes)
  item.addEventListener('click', () => abrirEditor(placa.codigo))
  return item
}

function mostrarLista() {
  fecharMenuLinha()
  Lista.replaceChildren()
  atualizarContagens()

  const visiveis = placasDaLista()

  for (const placa of visiveis) {
    Lista.appendChild(criarLinha(placa))
  }

  if (!visiveis.length) {
    const vazio = document.createElement('li')
    vazio.className = 'vazia'
    vazio.textContent = Busca.value.trim() ? 'Nenhuma placa encontrada.' : 'Nenhuma placa neste filtro.'
    Lista.appendChild(vazio)
  }
}

// ----- Menu de ações da linha -----
function fecharMenuLinha() {
  const aberto = document.querySelector('.menulinha')

  if (aberto) aberto.remove()
}

function criarItemMenu(texto, acao, perigo = false) {
  const item = document.createElement('button')

  item.type = 'button'
  item.setAttribute('role', 'menuitem')
  item.textContent = texto
  if (perigo) item.classList.add('perigo')

  item.addEventListener('click', (evento) => {
    evento.stopPropagation()
    fecharMenuLinha()
    acao()
  })

  return item
}

function alternarMenuLinha(acoes, codigo) {
  const eraDesteBotao = acoes.querySelector('.menulinha') != null

  fecharMenuLinha()

  if (eraDesteBotao) return

  const menu = document.createElement('div')

  menu.className = 'menulinha'
  menu.setAttribute('role', 'menu')
  menu.addEventListener('click', (evento) => evento.stopPropagation()) // clicar no espaço do menu não abre o editor
  menu.append(
    criarItemMenu('Editar', () => abrirEditor(codigo)),
    criarItemMenu('Baixar QR', () => baixarQrDaLinha(codigo)),
    criarItemMenu('Excluir', () => excluirPlaca(codigo), true)
  )
  acoes.appendChild(menu)
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

  for (const aviso of document.querySelectorAll('.avisomodal')) {
    aviso.textContent = ''
  }

  editando = placa ? placa.codigo : null
  TituloEditor.textContent = editando ? `Placa ${editando}` : 'Nova placa'
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

  // placa em lote sendo cadastrada: já vem marcada como ativa, é a venda
  CampoAtiva.checked = placa ? placa.ativa || estadoDaPlaca(placa) == 'lote' : false
  // data de hoje sempre que não houver uma data guardada (placa nova ou sem data)
  CampoData.value = placa && placa.data_venda ? placa.data_venda : hoje()
  Excluir.classList.toggle('oculto', editando == null) // só placas que já existem podem ser excluídas
  mostrarPreviaQr(editando)

  if (!Gaveta.open) Gaveta.showModal()
}

function mostrarPreviaQr(codigo) {
  PreviaQr.classList.toggle('oculto', codigo == null)
  BaixarQr.classList.toggle('oculto', codigo == null)
  PreviaQr.innerHTML = ''

  if (codigo == null) return

  // o svg é montado aqui com um código já validado; se falhar, o editor continua abrindo normalmente
  try {
    PreviaQr.innerHTML = criarSvgQr(codigo)
  } catch (erro) {
    avisar(`Sem prévia do QR: ${erro.message}`, true)
  }
}

function fecharEditor() {
  Gaveta.close()
  editando = null
}

function sortearCodigo() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789' // sem i, l, o, 0 e 1 para não confundir na leitura
  let codigo = ''

  for (let i = 0; i < 4; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)]
  }

  return codigo
}

function gerarCodigo() {
  let novo

  do {
    novo = sortearCodigo()
  } while (placas.some((p) => p.codigo == novo))

  CampoCodigo.value = novo
}

// ----- Lote -----
function abrirLote() {
  for (const aviso of document.querySelectorAll('.avisomodal')) {
    aviso.textContent = ''
  }

  DialogoLote.showModal()
  CampoQuantidade.focus()
}

async function gerarLote(evento) {
  evento.preventDefault()

  const quantidade = parseInt(CampoQuantidade.value)

  if (!quantidade || quantidade < 1 || quantidade > 100) {
    avisar('Quantidade: de 1 a 100.', true)
    return
  }

  const usados = new Set(placas.map((p) => p.codigo))
  const novas = []

  while (novas.length < quantidade) {
    const codigo = sortearCodigo()
    if (usados.has(codigo)) continue

    usados.add(codigo)
    novas.push({codigo: codigo, ativa: false})
  }

  const resposta = await requisicao('/rest/v1/placas', {
    method: 'POST',
    headers: {'Prefer': 'return=minimal'},
    body: JSON.stringify(novas)
  })

  if (!resposta) return

  if (!resposta.ok) {
    // 409 aqui é um código repetido de uma lista desatualizada: gerar de novo resolve
    avisar('Erro ao gerar o lote. Tente de novo.', true)
    return
  }

  DialogoLote.close()
  avisar(`${quantidade} placas criadas em lote.`)
  await carregarPlacas()
  definirFiltro('lote')
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

  fecharEditor()
  avisar('Salvo!')
  await carregarPlacas()
}

async function excluirPlaca(codigo) {
  const placa = placas.find((p) => p.codigo == codigo)
  const aviso = placa && placa.ativa
    ? `A placa ${codigo} está ATIVA e vai parar de funcionar. Excluir mesmo? Não dá para desfazer.`
    : `Excluir a placa ${codigo}? Não dá para desfazer.`

  if (!confirm(aviso)) return

  const resposta = await requisicao(`/rest/v1/placas?codigo=eq.${codigo}`, {
    method: 'DELETE',
    headers: {'Prefer': 'return=minimal'}
  })

  if (!resposta) return

  if (!resposta.ok) {
    avisar('Erro ao excluir. Tente de novo.', true)
    return
  }

  if (editando == codigo) fecharEditor()

  avisar(`Placa ${codigo} excluída.`)
  await carregarPlacas()
}

// ----- QR code -----
async function baixarQrAtual() {
  if (!editando) return

  try {
    await baixarQr(editando, FormatoQr.value)
  } catch (erro) {
    avisar(`Erro ao gerar o QR: ${erro.message}`, true)
  }
}

async function baixarQrDaLinha(codigo) {
  try {
    await baixarQr(codigo, FormatoQr.value)
  } catch (erro) {
    avisar(`Erro ao gerar o QR: ${erro.message}`, true)
  }
}

async function baixarQrsDaLista() {
  const codigos = placasDaLista().map((p) => p.codigo)

  if (!codigos.length) {
    avisar('Nenhuma placa na lista.', true)
    return
  }

  BaixarLote.disabled = true
  BaixarLote.textContent = 'Gerando...'

  try {
    await baixarLoteQr(codigos, FormatoQr.value)
    avisar(`${codigos.length} QRs baixados em um ZIP.`)
  } catch (erro) {
    avisar(`Erro ao gerar os QRs: ${erro.message}`, true)
  } finally {
    BaixarLote.disabled = false
    BaixarLote.textContent = 'Baixar QRs da lista (ZIP)'
  }
}

// ----- Backup (CSV) -----
function campoCsv(valor) {
  let texto = valor == null ? '' : String(valor)

  // texto começando com = + - @ viraria fórmula ao abrir no Excel
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`

  return `"${texto.replace(/"/g, '""')}"`
}

async function exportarPlacas() {
  // busca de novo no banco (não usa a lista da tela) para o backup sair completo e atual
  const resposta = await requisicao('/rest/v1/placas?select=*&order=criado_em.asc,codigo.asc')

  if (!resposta) return

  if (!resposta.ok) {
    avisar('Erro ao exportar as placas.', true)
    return
  }

  const dados = await resposta.json()
  const colunas = ['codigo', 'cliente', 'link_avaliacao', 'ativa', 'data_venda', 'criado_em']
  const linhas = [colunas.join(';')]

  for (const placa of dados) {
    linhas.push(colunas.map((coluna) => campoCsv(placa[coluna])).join(';'))
  }

  // BOM no começo e ponto e vírgula: o Excel em português abre com acentos e colunas certas
  baixarArquivo(`placas-${hoje()}.csv`, new Blob(['\ufeff' + linhas.join('\r\n')], {type: 'text/csv;charset=utf-8'}))

  if (dados.length >= 1000) {
    avisar('Atenção: o limite da consulta é 1000 placas, o backup pode estar incompleto.', true)
    return
  }

  avisar(`${dados.length} placas exportadas.`)
}

// ----- Verificação em duas etapas (2FA) -----
function nivelDaSessao() {
  // o token guarda o nível de acesso: aal1 (só senha) ou aal2 (senha + código do app)
  try {
    const carga = sessao.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(carga)).aal
  } catch (erro) {
    return null
  }
}

async function etapaDeAcesso() {
  if (nivelDaSessao() == 'aal2') return 'painel'

  const resposta = await requisicao('/auth/v1/user')
  if (!resposta || !resposta.ok) return null

  const usuario = await resposta.json()
  const fatores = usuario.factors || []
  const verificado = fatores.find((f) => f.factor_type == 'totp' && f.status == 'verified')

  if (verificado) {
    fatorId = verificado.id
    return 'codigo'
  }

  // apaga tentativas de configuração abandonadas antes de começar uma nova
  for (const fator of fatores) {
    await requisicao(`/auth/v1/factors/${fator.id}`, {method: 'DELETE'})
  }

  return 'configurar'
}

async function iniciarConfiguracao() {
  ErroConfigurar.textContent = ''
  QrConfigurar.innerHTML = ''
  ChaveConfigurar.textContent = ''

  const resposta = await requisicao('/auth/v1/factors', {
    method: 'POST',
    body: JSON.stringify({factor_type: 'totp', friendly_name: `painel-${Date.now()}`, issuer: 'Painel de Placas'})
  })

  if (!resposta) return

  if (!resposta.ok) {
    ErroConfigurar.textContent = 'Não foi possível iniciar a configuração. Tente sair e entrar de novo.'
    return
  }

  const dados = await resposta.json()
  fatorId = dados.id

  try {
    QrConfigurar.innerHTML = criarSvgDoTexto(dados.totp.uri)
  } catch (erro) {
    ErroConfigurar.textContent = 'Não foi possível desenhar o QR. Digite a chave abaixo no app.'
  }

  ChaveConfigurar.textContent = dados.totp.secret
}

async function confirmarCodigo(codigo) {
  const desafio = await requisicao(`/auth/v1/factors/${fatorId}/challenge`, {method: 'POST', body: '{}'})
  if (!desafio || !desafio.ok) return false

  const {id} = await desafio.json()
  const resposta = await requisicao(`/auth/v1/factors/${fatorId}/verify`, {
    method: 'POST',
    body: JSON.stringify({challenge_id: id, code: codigo})
  })

  if (!resposta || !resposta.ok) return false

  guardarSessao(await resposta.json()) // a sessão nova já vem com nível aal2
  return true
}

async function enviarCodigo(evento, campo, erro) {
  evento.preventDefault()
  erro.textContent = ''

  try {
    const confirmou = await confirmarCodigo(campo.value.trim())

    if (!confirmou) {
      erro.textContent = 'Código incorreto ou expirado. Tente o próximo código do app.'
      return
    }

    campo.value = ''
    await iniciarPainel()
  } catch (falha) {
    erro.textContent = 'Sem conexão. Tente de novo.'
  }
}

// ----- Início -----
async function iniciarPainel() {
  const etapa = await etapaDeAcesso()

  if (!sessao) return // a sessão pode ter sido encerrada durante a verificação

  if (etapa == 'codigo') {
    mostrarTela('segundofator')
    return
  }

  if (etapa == 'configurar') {
    mostrarTela('configurar')
    await iniciarConfiguracao()
    return
  }

  if (etapa != 'painel') {
    encerrarSessao()
    return
  }

  mostrarTela('painel')
  await carregarPlacas()

  if (!sessao) return

  // painel?c=k7x2 já abre a placa k7x2 (ou o cadastro dela, se ainda não existir)
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

FormCodigo.addEventListener('submit', (evento) => enviarCodigo(evento, CodigoAcesso, ErroCodigo))
FormConfigurar.addEventListener('submit', (evento) => enviarCodigo(evento, CodigoConfigurar, ErroConfigurar))
Sair.addEventListener('click', encerrarSessao)
Busca.addEventListener('input', mostrarLista)
NovaPlaca.addEventListener('click', () => abrirEditor(''))
GerarCodigo.addEventListener('click', gerarCodigo)
NovoLote.addEventListener('click', abrirLote)
CancelarLote.addEventListener('click', () => DialogoLote.close())
FormLote.addEventListener('submit', gerarLote)
Cancelar.addEventListener('click', fecharEditor)
FecharGaveta.addEventListener('click', fecharEditor)
Excluir.addEventListener('click', () => {
  if (editando) excluirPlaca(editando)
})
BaixarQr.addEventListener('click', baixarQrAtual)
BaixarLote.addEventListener('click', baixarQrsDaLista)
ExportarCsv.addEventListener('click', exportarPlacas)
Editor.addEventListener('submit', salvarPlaca)

for (const chip of Chips) {
  chip.addEventListener('click', () => definirFiltro(chip.dataset.filtro))
}

// fechar o modal por qualquer caminho (Esc, botão ou clique no fundo) limpa a placa aberta
Gaveta.addEventListener('close', () => {
  editando = null
})

// clicar no fundo escuro (o alvo do clique é o próprio <dialog>) fecha o modal
for (const dialogo of [Gaveta, DialogoLote]) {
  dialogo.addEventListener('click', (evento) => {
    if (evento.target == dialogo) dialogo.close()
  })
}

// menu de ações aberto numa linha fecha ao clicar fora ou apertar Esc
document.addEventListener('click', fecharMenuLinha)
document.addEventListener('keydown', (evento) => {
  if (evento.key == 'Escape') fecharMenuLinha()
})

// mostra para onde os QRs vão apontar, para conferir antes de imprimir
DestinoQr.textContent = `Os QRs apontam para: ${urlDaPlaca('codigo')}`

carregarSessao()

if (sessao) {
  iniciarPainel()
} else {
  mostrarTela('login')
}