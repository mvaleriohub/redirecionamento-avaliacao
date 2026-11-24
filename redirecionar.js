/* 
Desenvolvido por Miguel Valério (mvaleriohub)
24/11/2026 -- (11/24/2026)
*/

const urlSupabase = 'https://ykkabkalndjqcyugkaxm.supabase.co'
const chavePublica = 'sb_publishable_nAGuOOBLvX5CE0A4ICRQnA_gX3sU4J9'
const paginaPadrao = 'https://google.com'

async function buscarDestino(codigo) {
  const controle = new AbortController()
  const limite = setTimeout(() => controle.abort(), 5000)

  try {
    const resposta = await fetch(`${urlSupabase}/rest/v1/rpc/obter_destino`, {
      method: 'POST',
      headers: {
        'apikey': chavePublica,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_codigo: codigo }),
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
    location.replace(paginaPadrao)
    return
  }

  const destino = await buscarDestino(codigo)

  // só redireciona se o banco devolveu um link https válido
  if (typeof destino == 'string' && destino.startsWith('https://')) {
    location.replace(destino)
  } else {
    location.replace(paginaPadrao)
  }
}

redirecionar()