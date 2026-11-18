# SEO técnico — Syst Team

## Já incluído no site

- Verificação Google por meta tag no `index.html`.
- `robots.txt` liberando o rastreamento público e apontando para o sitemap.
- `sitemap.xml` com a URL pública principal.
- URL canônica, meta description, Open Graph e Twitter Card.
- Dados estruturados `Organization` e `WebSite` em JSON-LD.
- `noindex, follow` nas páginas de login, checkout e demonstrações conceituais, para manter o foco de indexação na página comercial principal.
- `og-syst-team.png` para prévias quando o endereço for compartilhado.

## Google Search Console

1. Abra o Google Search Console e selecione a propriedade de prefixo de URL `https://syst-smd9.onrender.com/`.
2. Escolha a verificação por **tag HTML**. O token `CA0VzA0Bib6mSuVAqlOuA_3rxEQ58H7vMlrT8MIpDcg` já está no `<head>` do `index.html`.
3. Depois de publicar os arquivos, use **Verificar**.
4. Em **Sitemaps**, envie `https://syst-smd9.onrender.com/sitemap.xml`.
5. Em **Inspeção de URL**, teste a página inicial e solicite indexação depois que a publicação estiver no ar.

### Sobre o segundo token recebido

O valor `google-site-verification=fZo7DN4mxnq5tSPbcST36yMqc8IXLjGwxmNI6Ue_150` é para verificação por **registro TXT de DNS**. Ele não é um arquivo HTML e não deve ser adicionado ao `robots.txt`. Para usá-lo, é necessário ter um domínio próprio e acesso ao painel DNS que controla esse domínio. No provedor DNS, crie um registro TXT com o nome/host indicado pelo Google (geralmente `@`) e o valor completo acima. O domínio padrão `onrender.com` é administrado pela Render, portanto você não controla os registros DNS dele.

## Bing Webmaster Tools

Depois da publicação, adicione a mesma URL ao Bing Webmaster Tools e importe a propriedade do Google Search Console, quando essa opção estiver disponível. Se preferir verificação por meta tag, use o código específico fornecido pelo Bing; não reutilize o token do Google.

## Divulgação orgânica e manutenção

- Compartilhe a página principal com o link direto, acompanhado de uma descrição curta e consistente com o conteúdo real.
- Mantenha links para o site no perfil oficial do Instagram e no perfil/README do GitHub.
- Publique estudos de caso reais no portfólio, descrevendo o problema, as decisões de interface, o resultado e imagens próprias com texto alternativo descritivo.
- Use títulos e descrições únicos nas novas páginas; evite repetir palavras-chave artificialmente.
- Comprima imagens, preserve dimensões explícitas e acompanhe desempenho móvel no PageSpeed Insights.
- Confira o relatório de indexação e os Core Web Vitals no Search Console periodicamente.

**Importante:** sitemap, dados estruturados e verificação ajudam os mecanismos de busca a descobrir e interpretar o site, mas não garantem posição, tráfego ou indexação imediata. O conteúdo útil, a experiência da página, a reputação e a divulgação consistente continuam importantes.

## Ao trocar de domínio

Se o site passar para um domínio próprio, atualize o endereço `https://syst-smd9.onrender.com/` em `index.html`, `robots.txt`, `sitemap.xml` e neste arquivo. Depois, adicione e verifique a nova propriedade no Search Console.
