# Placas de avaliação (NFC + QR)

Sistema para placas físicas que levam o cliente direto para a página de avaliação do Google de um comércio. A placa tem um chip NFC e um QR code, e os dois guardam o mesmo link curto. O destino fica num banco de dados e é trocado por um painel, então o chip nunca precisa ser regravado e o QR nunca precisa ser reimpresso.

Feito com HTML, CSS e JavaScript puros, sem framework.

## Como funciona

```
Placa (NFC ou QR)  →  index.html?c=k7x2  →  js/redirecionar.js
                                                  │
                         consulta a função obter_destino no Supabase
                                                  │
              placa ativa  →  página de avaliação do Google
              placa inexistente ou inativa  →  404 com atalho para o WhatsApp
```

Cada placa tem um código curto (`k7x2`). O link vendido ao cliente é sempre `.../?c=k7x2`. Quando o comércio é cadastrado, o painel guarda o Place ID dele e o redirecionamento passa a funcionar na hora, sem deploy.

## O que tem

- **Redirecionamento:** lê o código da URL, pergunta o destino ao banco e redireciona. Se algo falhar, cai na página 404. A página não carrega CSS, fontes nem imagens, para ser o mais rápida possível.
- **Painel de administração** (`html/painel`), com menu lateral e as seções:
  - **Dashboard:** total, ativas, em estoque e inativas, últimas vendas e atalhos;
  - **Placas:** busca, filtros (ativas, em lote, inativas e todas), tabela no computador e cartões no celular; cadastro, edição pelo Place ID (ou link completo, quando o formato for outro), exclusão e QR de cada placa pelo menu da linha;
  - **Estoque e lotes:** geração de lote de códigos inativos (1 a 100), códigos agrupados por lote e busca por código;
  - **Gerador de QR:** QR de uma placa em SVG ou PNG e download em ZIP por grupo (estoque, ativas, inativas ou todas), com o código escrito embaixo de cada QR;
  - **Backup:** todas as placas em CSV;
  - **Configurações:** dados da conta e da sessão.
  - Acesso com e-mail e senha, mais verificação em duas etapas (app autenticador).
- **Página 404:** para endereços inexistentes. Se o endereço tiver `?c=codigo`, pergunta se a placa deveria estar funcionando e mostra um botão que abre o WhatsApp com a mensagem pronta.
- **Tema:** claro por padrão em qualquer aparelho. O tema escuro só é ativado pelo botão do painel e fica salvo apenas naquele aparelho.
- **Workflow do GitHub Actions** que consulta o banco a cada 3 dias, para o projeto gratuito do Supabase não pausar.

## Tecnologias

- HTML, CSS e JavaScript (vanilla)
- [Supabase](https://supabase.com) (Postgres e Auth)
- GitHub Pages
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (licença MIT), incluída em `js/qrcode.js`
- Fontes Inter e JetBrains Mono (Google Fonts)

## Estrutura

```
index.html                página de redirecionamento
404.html                  página de erro (a raiz é o único lugar que o GitHub Pages usa)
html/painel.html          painel de administração
css/
  style.css               tokens, tema claro e escuro, componentes, 404 e painel
  medias-queries.css      breakpoints 481, 768 e 900 e redução de movimento
js/
  redirecionar.js         consulta o banco e redireciona
  painel.js               login, 2FA, lista, cadastro, lote, QR, CSV, dashboard e estoque
  navegacao.js            seções do painel, menu lateral, conta e botão de tema
  tema.js                 tema claro/escuro (carregado no <head>)
  geradorqr.js            QR em SVG e PNG, ZIP e download
  qrcode.js               biblioteca de QR code
  pagina404.js            pergunta e botão do WhatsApp
  contato.js              número de WhatsApp
img/                      mascote da página 404
.github/workflows/        manter-supabase-ativo.yml
```

## Como configurar

1. **Supabase.** Crie um projeto (de preferência na região de São Paulo) e rode o SQL abaixo no SQL Editor.
2. **Usuário admin.** Em Authentication, crie o usuário com a opção de confirmar o e-mail automaticamente e desligue **Allow new users to sign up**.
3. **Chaves.** Cole a Project URL e a Publishable key em `js/redirecionar.js`, `js/painel.js`, no `preconnect` do `index.html` e no workflow. A chave *secret* (`service_role`) nunca vai para o repositório.
4. **WhatsApp.** Em `js/contato.js`, coloque o número (código do país, DDD e número, só dígitos).
5. **GitHub Pages.** Em Settings → Pages, publique a partir da branch `main`, pasta raiz.
6. **Primeiro acesso.** Abra `/html/painel`, entre e configure a verificação em duas etapas. Só depois de confirmar que o login com código funciona, rode a política do SQL que exige o 2FA (já está no script abaixo, no final).

<details>
<summary>SQL do banco</summary>

```sql
create table if not exists public.placas (
  codigo text primary key check (codigo ~ '^[a-z0-9]{3,12}$'),
  cliente text,
  link_avaliacao text check (link_avaliacao is null or link_avaliacao like 'https://%'),
  ativa boolean not null default false,
  data_venda date,
  criado_em timestamptz not null default now()
);

alter table public.placas enable row level security;

-- só o usuário logado com 2FA (aal2) lê e altera a tabela
drop policy if exists "admin gerencia placas" on public.placas;
create policy "admin gerencia placas"
  on public.placas
  for all
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

-- o público só consegue perguntar o destino de uma placa ativa
create or replace function public.obter_destino(p_codigo text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select link_avaliacao
  from public.placas
  where codigo = p_codigo
    and ativa = true
    and link_avaliacao is not null
  limit 1;
$$;

revoke all on function public.obter_destino(text) from public;
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.placas to authenticated;
grant execute on function public.obter_destino(text) to anon, authenticated;
```

Se você ainda não configurou o 2FA, troque as duas condições da política por `true` até terminar a configuração, para não ficar sem acesso ao painel.

</details>

## Segurança

- A Publishable key é feita para ficar no código do navegador. Quem protege os dados são as regras de acesso do banco (RLS), não o segredo da chave.
- A tabela é fechada para o público. Ele só chama a função `obter_destino`, que devolve um único link, e apenas de placas ativas.
- O painel exige senha e código do app autenticador, e o banco confere o nível de acesso (`aal2`) em cada consulta.
- O cadastro público de usuários fica desligado.
- Os dados digitados no painel entram na página como texto, nunca como HTML, e o CSV neutraliza células que começam com `=`, `+`, `-` ou `@`.

## Observações

- No plano gratuito, o Supabase pausa projetos com pouca atividade, e todas as placas param de funcionar até alguém reativar. O workflow em `.github/workflows` evita isso, mas vale conferir a aba Actions de vez em quando. O GitHub também desativa agendamentos de repositórios sem atividade por 60 dias.
- Os QR codes apontam para o endereço em que o painel foi aberto. Se o site mudar de endereço (por exemplo, para um domínio próprio), gere os QR codes de novo antes de imprimir e troque o `<base href>` da `404.html`.
- A exportação em CSV traz até 1000 placas por vez, que é o limite da consulta.
- O endereço do painel não muda ao trocar de seção, e atualizar a página volta para o Dashboard.

## Autor

Miguel Valério ([@mvaleriohub](https://github.com/mvaleriohub))

*Feito por uma mente inquieta.*