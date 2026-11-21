(() => {
  const kind = document.querySelector('#kind');
  const brief = document.querySelector('#brief');
  const reference = document.querySelector('#reference');
  const prompts = {
    'Site novo': ['O que seu cliente precisa conseguir fazer no site?', 'Ex. Ver o catálogo e pedir pelo WhatsApp'],
    'Redesign': ['Qual é o seu site e o que você gostaria de melhorar?', 'Ex. Quero facilitar os pedidos pelo celular'],
    'Ferramenta sob medida': ['Que tarefa sua equipe faz manualmente hoje?', 'Ex. Copiamos pedidos de uma planilha para outra']
  };
  const drafts = new Map();
  let activeKind = kind.value;
  function update(source = '') {
    drafts.set(activeKind, brief.value);
    activeKind = kind.value;
    brief.value = drafts.get(activeKind) || '';
    const [label, placeholder] = prompts[activeKind];
    document.querySelector('#brief-label').textContent = label;
    brief.placeholder = placeholder;
    reference.textContent = source ? 'Referência: ' + source : '';
    reference.hidden = !source;
  }
  kind.addEventListener('change', () => update());
  document.querySelectorAll('a[href="#orcamento"]').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.kind) kind.value = link.dataset.kind;
      update(link.dataset.reference);
    });
  });
  document.querySelector('#quote-form').addEventListener('submit', event => {
    event.preventDefault();
    const message = ['Olá, Syst! Gostaria de um orçamento.', 'Projeto: ' + kind.value,
      reference.textContent, brief.value.trim()].filter(Boolean).join('\n');
    const phone = document.querySelector('#copy-phone').dataset.phone.replace(/\D/g, '');
    location.assign('https://wa.me/' + phone + '?text=' + encodeURIComponent(message));
  });
})();
