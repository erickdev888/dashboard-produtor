# Dashboard do produtor

Dashboard em React 18 e Framer Motion com temas Claro, Escuro e Glass, navegação lateral e áreas de produtos, vendas, clientes e reembolsos.

## Executar

Instale as dependências com `pnpm install --frozen-lockfile` e gere o JavaScript com `node build.cjs`. Sirva a pasta `dist` com um servidor HTTP estático.

O código editável fica em `src`; as folhas de estilo e o HTML estão em `dist`. O bundle de produção é minificado e não inclui source maps.

## Dados

Os indicadores são demonstrativos. Produtos criados e preferências de aparência são guardados no navegador. Não há integração com pagamentos ou dados reais de clientes.

Reembolsos têm uma seção própria com quantidade diária por mês e taxas das janelas de 30, 60, 90 e 365 dias. Cada janela é comparada aos dias imediatamente anteriores de mesma duração. A variação é expressa em pontos percentuais.

## Privacidade do código

Mantenha este repositório privado e conceda acesso apenas a pessoas autorizadas. O JavaScript de um site é necessariamente enviado ao navegador dos visitantes autorizados. Nunca inclua senhas, tokens ou segredos no frontend.

---

# Painel administrativo do e-commerce (Vitrine Admin)

Segunda dashboard do repositório: painel **administrativo e financeiro** para uma loja no estilo dos grandes varejistas de eletrônicos, eletrodomésticos e casa. Visual "liquid glass" com fontes da Apple (SF Pro em Mac/iPhone/iPad, Inter como alternativa nos demais sistemas), animações em todas as telas e barras de rolagem personalizadas.

- Código: `admin/src` (React 18 + Framer Motion, JSX)
- HTML e CSS: `admin/public`
- Build publicado: `docs/admin` → no GitHub Pages fica em `/admin/`

## Executar

```bash
pnpm install --frozen-lockfile
node build.cjs              # gera dist/app.js e docs/admin/
python3 -m http.server -d docs 8000   # abra http://localhost:8000/admin/
```

## Telas

| Seção | Telas |
|---|---|
| Painel | Visão geral, Relatórios (funil, estados, canais, mapa de calor por hora), Tarefas |
| Pessoas | Equipe, Funções e acesso (matriz de permissões), Clientes (LTV), Atendimento (tickets com conversa), Comunicados |
| Negócio | **Produtos (faturamento por produto e período)**, Pedidos, Moderação de anúncios de sellers, Financeiro (repasses e taxas), Cobrança |
| Sistema | Log de atividades, Integrações, Sistema (uptime e latência), Configurações |

Extras: busca global com `⌘K`/`Ctrl+K` (ou `/`), notificações, insights da semana, 4 temas (Oceano, Aurora, Névoa, Grafite), toasts com "desfazer", layout responsivo com menu em gaveta no celular e respeito à opção "reduzir movimento".

## Faturamento por produto

Em **Produtos** escolha o período (Hoje, Ontem, 7 dias, 30 dias, Este mês, 90 dias, Este ano, 12 meses ou datas personalizadas). Para cada produto aparecem faturamento, unidades, ticket médio, variação contra o período anterior de mesma duração, participação no total, minitendência e estoque. A tabela ordena por qualquer coluna, filtra por categoria e busca por nome ou SKU, e o botão **Exportar CSV** baixa exatamente o que está na tela (separador `;`, abre direto no Excel). Clicar em um produto abre o detalhe com gráfico diário, canais de venda, últimos 12 meses e cobertura de estoque.

"Hoje" é comparado a ontem no mesmo horário, para não comparar um dia parcial com um dia inteiro.

## Dados

Os números são demonstrativos e gerados de forma determinística em `admin/src/data.js` (730 dias de vendas por produto com sazonalidade do varejo brasileiro: Black Friday, Natal, Dia das Mães, Dia dos Pais e verão para ar-condicionado). Para ligar a uma loja real, substitua as funções desse arquivo por chamadas à sua API mantendo os mesmos formatos (`PRODUCTS[i].revenue/units` diários, `ORDERS`, `PAYOUTS` etc.).
