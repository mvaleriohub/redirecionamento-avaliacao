/* 
Desenvolvido por Miguel Valério (mvaleriohub)
24/11/2026 -- (11/24/2026)
*/

const urlSupabase = 'https://tzkiyfafjivsujrhzhsb.supabase.co'
const chavePublica = 'sb_publishable_8pqTFeUWFOYTjGw0HmqT-Q_KbBfgsgY'
const paginaErro = '404.html'

async function buscarDestino(codigo) {
  const controle = new AbortController()
  const limite = setTimeout(() => controle.abort(), 4000)

  try {
    // GET (a função é stable): sem corpo JSON e sem Content-Type, o navegador negocia menos coisa
    const resposta = await fetch(`${urlSupabase}/rest/v1/rpc/obter_destino?p_codigo=${codigo}`, {
      headers: {'apikey': chavePublica},
      signal: controle.signal
    })

    if (!resposta.ok) return null

    return await resposta.json()
  } catch (erro) {
    return null
  } finally {
    clearTimeout(limite)
  }
}

async function redirecionar() {
  const codigo = new URLSearchParams(location.search).get('c')

  if (!codigo || !/^[a-z0-9]{3,12}$/.test(codigo)) {
    location.replace(paginaErro)
    return
  }

  const destino = await buscarDestino(codigo)

  // só redireciona se o banco devolveu um link https válido
  if (typeof destino == 'string' && destino.startsWith('https://')) {
    location.replace(destino)
  } else {
    // leva o código junto: é ele que faz a 404 mostrar a opção de falar no WhatsApp
    location.replace(`${paginaErro}?c=${codigo}`)
  }
}

redirecionar()