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
