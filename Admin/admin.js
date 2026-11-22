'use strict';
const base = 'https://syst-server.onrender.com/api/v1/admin';
const el = id => document.getElementById(id);
const labels = {pending:'Pendente', approved:'Aprovada', rejected:'Rejeitada'};
let token = '';
let generation = 0;
function lock(message = '') {
  token = '';
  generation++;
  el('list').replaceChildren();
  el('login').reset();
  el('desk').hidden = el('logout').hidden = true;
  el('gate').hidden = false;
  el('notice').textContent = message;
}
async function api(path, method = 'GET', body) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const current = token;
  if (current) headers.Authorization = 'Bearer ' + current;
  const response = await fetch(base + path, {method, headers, body: JSON.stringify(body),
    credentials:'omit', cache:'no-store', redirect:'error'});
  if (!response.ok) {
    if (current && current === token && [401,403].includes(response.status)) {
      lock('Sessão encerrada. Entre novamente.');
      throw Error('Sessão encerrada. Entre novamente.');
    }
    const messages = {401:'Senha incorreta.',403:'Origem sem permissão.',429:'Muitas tentativas. Aguarde antes de tentar novamente.',503:'Acesso administrativo indisponível.'};
    throw Error(messages[response.status] || 'A operação falhou. Tente novamente.');
  }
  return response.status === 204 ? null : response.json();
}
function message(error) {
  el('notice').textContent = error instanceof TypeError ? 'Sem conexão com a API. Tente novamente.' : error.message;
}
function item(tag, text, style) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (style) node.className = style;
  return node;
}
function card(review) {
  const box = document.createElement('article');
  const date = new Date(review.createdAt).toLocaleDateString('pt-BR');
  box.append(item('p', labels[review.status] + ' · ' + review.rating + '/5 · ' + date, 'meta'),
    item('h3',review.title || review.author),item('p',review.author + ' · ' + review.email,'meta'),
    item('p',review.comment));
  const actions = item('div','','actions');
  for (const [status,label] of [['approved','Aprovar'],['rejected','Rejeitar']]) {
    if (status === review.status) continue;
    const button = item('button',label,status === 'approved' ? 'primary':'negative');
    button.onclick = async () => {
      const current = token;
      for (const control of actions.children) control.disabled = true;
      try {
        await api('/reviews/' + encodeURIComponent(review.id),'PATCH',{status});
        if (current === token) await reload('Avaliação ' + labels[status].toLowerCase() + '.');
      } catch (error) {
        if (current === token) message(error);
        for (const control of actions.children) control.disabled = false;
      }
    };
    actions.append(button);
  }
  box.append(actions);
  return box;
}
async function reload(note = '') {
  const id = ++generation;
  el('list').replaceChildren();
  el('notice').textContent = 'Carregando avaliações…';
  try {
    const {data} = await api('/reviews?status=' + el('filter').value);
    if (id !== generation) return;
    el('list').replaceChildren(...data.map(card));
    el('notice').textContent = [note, data.length ? (data.length === 1 ? '1 avaliação exibida.' : data.length + ' avaliações exibidas.') : 'Nenhuma avaliação neste filtro.'].filter(Boolean).join(' ');
  } catch (error) { if (id === generation) message(error); }
}
el('login').onsubmit = async event => {
  event.preventDefault();
  const button = el('login').querySelector('button');
  button.disabled = true;
  const password = el('password').value;
  el('password').value = '';
  el('notice').textContent = 'Verificando acesso…';
  try {
    ({token} = await api('/login','POST',{password}));
    el('gate').hidden = true;
    el('desk').hidden = el('logout').hidden = false;
    el('filter').value = 'pending';
    await reload();
  } catch (error) { message(error); }
  finally { button.disabled = false; }
};
el('filter').onchange = () => reload();
el('refresh').onclick = () => reload();
el('logout').onclick = async () => {
  const request = api('/logout','POST');
  lock();
  try { await request; } catch { if (!token) el('notice').textContent = 'Acesso local encerrado. A revogação no servidor não foi confirmada.'; }
};
window.addEventListener('pagehide', () => lock());
