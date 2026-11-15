# Syst Team — Refatoração visual e motion

## Identidade visual
- Bordo: `#6C151E`
- Green: `#0F3D3A`
- Cream: `#F5DABF`

## O que foi aplicado
- Home: reformulação editorial da hierarquia visual, hero, cards, serviços, projetos, equipe, contato e rodapé.
- Responsividade: uma única folha `style-pc.css` cobre desktop, tablet e mobile. O antigo seletor dinâmico foi removido porque o pacote não continha `style-mobile.css`.
- Navegação mobile: botão semântico, menu expansível, fechamento por link, clique fora e tecla Escape.
- GSAP + ScrollTrigger: entrada do hero e revelação única de seções/cards.
- Lenis: rolagem suave sincronizada ao ticker do GSAP em uma única instância.
- Three.js: notebook 3D montado com geometrias, tela com interface gerada em CanvasTexture, órbitas, cubo/esfera de vidro e animação suave com interação por ponteiro em desktop. A renderização pausa fora da viewport.
- Fallbacks: cena 3D é substituída por composição fotográfica + fundo CSS em telas pequenas, dispositivos com poucos núcleos ou navegadores sem WebGL. `prefers-reduced-motion` mantém a cena estática.
- Login/cadastro: identidade visual atualizada sem alterar a lógica de autenticação existente.
- Checkout: identidade visual atualizada e layout responsivo, preservando o formulário/fluxo atual de cópia do Pix.

## Bibliotecas fixadas
- GSAP + ScrollTrigger: `3.15.1`
- Lenis: `1.3.27`
- Three.js: `0.187.0`

As bibliotecas são carregadas por CDN. O projeto continua estático e não requer Node.js ou etapa de build. O Three.js é carregado como ES module por Import Map.

## Estrutura adicionada
```text
Syst Team/
├── js/
│   ├── motion.js
│   └── three-scene.js
├── style-pc.css
├── Auth/
│   ├── auth.html
│   └── auth.css
└── Pagamentos/
    ├── index.html
    └── style-pagamento-pc.css
```

## Publicação / teste local
Como há módulos ES no Three.js, teste via servidor HTTP ou GitHub Pages, não abrindo `index.html` diretamente por `file://`.

Exemplo com Python, a partir da pasta `Syst Team`:
```bash
python -m http.server 8000
```
Depois abra `http://localhost:8000`.

## Notas de preservação
- `app.js` e os scripts inline de autenticação/cópia foram mantidos, exceto a cor inline de um link de sessão para usar o token da marca.
- As duas páginas-conceito da cafeteria e suas imagens foram preservadas como demonstrações independentes do portfólio.
- As páginas e recursos de pagamento/autenticação não foram removidos.

## Limitação da validação desta entrega
Os arquivos foram verificados com parsers de HTML/CSS e checagem sintática de JavaScript. A captura de tela por navegador automatizado foi bloqueada pelo ambiente, então ainda é recomendável conferir o resultado no navegador real, especialmente com a conexão aos CDNs disponível.

## Ajustes complementares — Hero e portfólio da cafeteria
- Hero: tipografia limitada a uma escala que cabe na coluna de conteúdo; proporção das colunas e espaçamento revistos para impedir que “desenvolvimento” avance sobre o painel de código.
- Portfólio: as prévias “Antes” e “Depois” da cafeteria agora ficam empilhadas em uma coluna; cada prévia mantém sua imagem, descrição e link.
- Portfólio: a coluna lateral agora contém uma explicação do objetivo do redesign, com pontos sobre clareza, consistência e intenção.
- Motion: GSAP revela as prévias em sequência e anima o painel explicativo quando a seção entra na viewport. A animação respeita `prefers-reduced-motion` porque permanece dentro da condição já existente no controlador de movimento.
- Responsividade: a composição vira uma coluna em telas menores, mantendo as prévias empilhadas e o texto logo abaixo.

### Validação desta atualização
- HTML analisado sem IDs duplicados.
- Todos os caminhos locais de `src` e `href` da página inicial conferidos.
- `style-pc.css` analisado sem erros de parsing.
- `js/motion.js` validado com `node --check`.
- A tentativa de screenshot com navegador headless não foi concluída neste ambiente; por isso, a validação visual final deve ser feita no navegador do projeto.


## Atualização visual — Hero Liquid Glass
- Fotografias locais e otimizadas em WebP: `assets/hero-workspace.webp` e `assets/hero-laptop-detail.webp`. A segunda imagem é um recorte de detalhe da mesma fotografia editorial, usado como cartão sobreposto.
- Hero com camadas fotográficas, iluminação ambiente e cartão de código em Liquid Glass (`backdrop-filter`, transparência, bordas de brilho interno e sombras suaves).
- Cartões de apoio translúcidos com informação curta e hierarquia visual ajustada para manter legibilidade.
- Cena Three.js refeita: notebook 3D com corpo, tela, teclado e trackpad; interface decorativa na tela; anéis, objetos translúcidos e partículas animadas.
- A cena acompanha o ponteiro em desktop, pausa quando sai da viewport e respeita `prefers-reduced-motion`. Em mobile e hardware modesto, as fotografias e as superfícies CSS permanecem como fallback sem WebGL.
- O Three.js continua sendo carregado pelo Import Map já existente; não foi adicionada etapa de build nem dependência de Node.js.

### Validação desta atualização
- `node --check` executado em `js/three-scene.js` e `js/motion.js` sem erros de sintaxe.
- Folha CSS analisada sem erros de parsing; IDs HTML duplicados e caminhos locais de imagens/scripts/estilos conferidos.
- A captura automatizada foi bloqueada pelas restrições do navegador no ambiente, então a aparência final e a disponibilidade dos CDNs ainda devem ser conferidas no navegador do projeto.

## Atualização visual — Liquid Glass em todo o produto Syst Team
- Home: o material Liquid Glass foi estendido do hero para navegação desktop/mobile, botão de conta, cartões de serviços, etapas, projetos, equipe, avaliações, formulário de avaliação, contatos e rodapé.
- Autenticação: a tela de login/cadastro agora usa painel de vidro escuro translúcido, iluminação ambiente, bordas especulares, abas e campos de formulário em vidro fosco e botão com acabamento luminoso. A prévia de avatar, alternância de abas e lógica de autenticação foram preservadas.
- Checkout: cabeçalho, cartões de pagamento/entrega, área Pix, campo de copiar código, cartão README e rodapé receberam o mesmo material translúcido, mantendo o layout e a lógica de cópia.
- Identidade: a paleta verde, bordô e cream foi preservada; o efeito é construído com CSS nativo (`backdrop-filter`, gradientes, bordas e sombras), sem nova dependência.
- Escopo: as páginas `Cafeteria_Antes.html` e `Cafeteria_Depois.html` foram mantidas como demonstrações independentes de projetos de clientes, sem alterar a identidade visual própria dessas peças do portfólio.

### Validação desta atualização
- CSS: `style-pc.css`, `Auth/auth.css` e `Pagamentos/style-pagamento-pc.css` analisados sem erros de parsing.
- HTML: home, autenticação e checkout sem IDs duplicados ou referências locais ausentes.
- JavaScript: `app.js`, `js/motion.js`, `js/reviews.js` e `js/three-scene.js` passaram em `node --check`.
- A captura automatizada de navegador foi bloqueada por uma política do ambiente; por isso, a conferência visual final deve ser feita no navegador do projeto.
