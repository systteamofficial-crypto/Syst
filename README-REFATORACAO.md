# Syst Team — refatoração mobile-first

- `style-pc.css`: folha desktop original preservada como base de PC.
- `style.css`: mantém compatibilidade com o nome legado e contém a mesma folha desktop.
- `style-mobile.css`: experiência mobile independente, com composição vertical editorial, navegação em painel, hero reorganizado, cards de preço, etapas, projetos, avaliações e contato redesenhados para toque e leitura em telas estreitas.

O `index.html` carrega `style-pc.css` em viewports a partir de 821px e `style-mobile.css` até 820px. A estrutura HTML e os scripts foram preservados para manter funcionalidades existentes.
