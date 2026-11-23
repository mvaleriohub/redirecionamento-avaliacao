/* 
Desenvolvido por Miguel Valério (mvaleriohub)
23/11/2026 -- (11/23/2026)
*/

const destinos = {
  a001: 'https://search.google.com/local/writereview?placeid=ChIJbV3_fsmXzJMRdoVOLDux9Eg'
}

const padrao = 'https://google.com'

const codigo = new URLSearchParams(location.search).get('c')

// replace não deixa a página de redirecionamento no histórico (botão voltar)
location.replace(destinos[codigo] || padrao)