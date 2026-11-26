/* 
Desenvolvido por Miguel Valério (mvaleriohub)
24/11/2026 -- (11/24/2026)
*/

// Depende do qrcode.js (biblioteca qrcode-generator, licença MIT), carregado antes deste arquivo

const tamanhoModulo = 10
const margemModulos = 4 // área branca em volta do QR (o mínimo do padrão)
const faixaCodigo = 50 // espaço extra embaixo para o código da placa escrito

// ----- QR -----
function urlDaPlaca(codigo) {
  // o painel fica na raiz, junto do index.html do redirecionamento, então "./" já é a raiz do site
  // (se o site mudar de endereço, os QRs gerados depois mudam junto)
  return `${new URL('./', location.href).href}?c=${codigo}`
}

function criarSvgQr(codigo) {
  return desenharQr(urlDaPlaca(codigo), codigo)
}

// QR de um texto qualquer, sem código escrito embaixo (usado no 2FA do painel)
function criarSvgDoTexto(texto) {
  return desenharQr(texto, '')
}

function desenharQr(texto, rotulo) {
  if (typeof qrcode == 'undefined') {
    throw new Error('o arquivo qrcode.js não carregou; confira se ele está no repositório')
  }

  const qr = qrcode(0, 'Q') // correção de erro Q: aguenta placa riscada ou gasta
  qr.addData(texto)
  qr.make()

  const modulos = qr.getModuleCount()
  const lado = (modulos + margemModulos * 2) * tamanhoModulo
  const altura = lado + (rotulo ? faixaCodigo : 0)
  let quadrados = ''

  for (let linha = 0; linha < modulos; linha++) {
    for (let coluna = 0; coluna < modulos; coluna++) {
      if (!qr.isDark(linha, coluna)) continue

      const x = (coluna + margemModulos) * tamanhoModulo
      const y = (linha + margemModulos) * tamanhoModulo
      quadrados += `M${x} ${y}h${tamanhoModulo}v${tamanhoModulo}h-${tamanhoModulo}z`
    }
  }

  // o código escrito embaixo identifica o QR mesmo depois de impresso
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${altura}" width="${lado}" height="${altura}">` +
    `<rect width="${lado}" height="${altura}" fill="#fff"/>` +
    `<path d="${quadrados}" fill="#000" shape-rendering="crispEdges"/>` +
    (rotulo ? `<text x="${lado / 2}" y="${lado + 32}" text-anchor="middle" font-family="monospace" font-size="30" font-weight="bold" fill="#000">${rotulo}</text>` : '') +
    `</svg>`
}

function svgParaPng(svg) {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image()

    imagem.onload = () => {
      // escala inteira (e sem suavização) para os quadradinhos ficarem com borda nítida
      const escala = Math.ceil(1000 / imagem.width)
      const tela = document.createElement('canvas')
      tela.width = imagem.width * escala
      tela.height = imagem.height * escala

      const contexto = tela.getContext('2d')
      contexto.imageSmoothingEnabled = false
      contexto.fillStyle = '#fff'
      contexto.fillRect(0, 0, tela.width, tela.height)
      contexto.drawImage(imagem, 0, 0, tela.width, tela.height)
      tela.toBlob((arquivo) => arquivo ? resolver(arquivo) : rejeitar(new Error('png')), 'image/png')
    }

    imagem.onerror = () => rejeitar(new Error('svg'))
    imagem.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

async function criarArquivoQr(codigo, formato) {
  const svg = criarSvgQr(codigo)

  if (formato == 'png') return await svgParaPng(svg)

  return new Blob([svg], {type: 'image/svg+xml'})
}

// ----- ZIP (sem compressão, o suficiente para juntar os arquivos) -----
const tabelaCrc = (() => {
  const tabela = []

  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    }
    tabela.push(c >>> 0)
  }

  return tabela
})()

function calcularCrc(bytes) {
  let crc = 0xFFFFFFFF

  for (const byte of bytes) {
    crc = tabelaCrc[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  }

  return (crc ^ 0xFFFFFFFF) >>> 0
}

function criarZip(arquivos) {
  const codificador = new TextEncoder()
  const partes = []
  const diretorio = []
  let deslocamento = 0

  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.nome)
    const tamanho = arquivo.dados.length
    const crc = calcularCrc(arquivo.dados)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // nome em UTF-8
    local.setUint16(12, 0x21, true) // data 01/01/1980
    local.setUint32(14, crc, true)
    local.setUint32(18, tamanho, true)
    local.setUint32(22, tamanho, true)
    local.setUint16(26, nome.length, true)

    const central = new DataView(new ArrayBuffer(46))
    central.setUint32(0, 0x02014b50, true)
    central.setUint16(4, 20, true)
    central.setUint16(6, 20, true)
    central.setUint16(8, 0x0800, true)
    central.setUint16(14, 0x21, true)
    central.setUint32(16, crc, true)
    central.setUint32(20, tamanho, true)
    central.setUint32(24, tamanho, true)
    central.setUint16(28, nome.length, true)
    central.setUint32(42, deslocamento, true)

    partes.push(local.buffer, nome, arquivo.dados)
    diretorio.push(central.buffer, nome)
    deslocamento += 30 + nome.length + tamanho
  }

  let tamanhoDiretorio = 0
  for (const parte of diretorio) tamanhoDiretorio += parte.byteLength

  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, arquivos.length, true)
  fim.setUint16(10, arquivos.length, true)
  fim.setUint32(12, tamanhoDiretorio, true)
  fim.setUint32(16, deslocamento, true)

  return new Blob([...partes, ...diretorio, fim.buffer], {type: 'application/zip'})
}

// ----- Download -----
function baixarArquivo(nome, arquivo) {
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')

  link.href = endereco
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(endereco), 1000)
}

async function baixarQr(codigo, formato) {
  baixarArquivo(`qr-${codigo}.${formato}`, await criarArquivoQr(codigo, formato))
}

async function baixarLoteQr(codigos, formato) {
  const arquivos = []

  for (const codigo of codigos) {
    const arquivo = await criarArquivoQr(codigo, formato)
    arquivos.push({nome: `qr-${codigo}.${formato}`, dados: new Uint8Array(await arquivo.arrayBuffer())})
  }

  baixarArquivo(`qr-placas-${new Date().toLocaleDateString('en-CA')}.zip`, criarZip(arquivos))
}