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
- Three.js: objeto geométrico 3D no hero, com interação por ponteiro em desktop e pausa fora da viewport.
- Fallbacks: cena 3D é substituída por fundo CSS em telas pequenas, dispositivos com poucos núcleos, navegadores sem WebGL ou quando o usuário pede movimento reduzido.
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
