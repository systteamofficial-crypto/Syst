'use strict';
const base = 'https://syst-server.onrender.com/api/v1/admin';
const el = id => document.getElementById(id);
const labels = {pending:'Pendente', approved:'Aprovada', rejected:'Rejeitada'};
let token = '';
let generation = 0;
let offset = 0;
function lock(message = '') {
  token = '';
  offset = 0;
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
  for (const [status,label] of [['approved','Aprovar'],['rejected',review.status === 'approved' ? 'Desativar sem prazo' : 'Rejeitar']]) {
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
  const remove = item('button','Excluir avaliação','negative');
  remove.onclick = async () => {
    if (!confirm('Excluir permanentemente esta avaliação de ' + review.author + '?')) return;
    try { await api('/reviews/'+encodeURIComponent(review.id),'DELETE'); await reload('Avaliação excluída.'); }
    catch (error) { message(error); }
  };
  actions.append(remove);
  box.append(actions);
  return box;
}
async function reload(note = '') {
  const id = ++generation;
  el('list').replaceChildren();
  el('notice').textContent = 'Carregando…';
  try {
    const accounts = el('section').value === 'accounts';
    el('filter').closest('label').hidden = accounts;
    el('prev').disabled = el('next').disabled = true;
    const path = accounts ? '/accounts?' : '/reviews?status='+el('filter').value+'&';
    const {data,hasMore} = await api(path+'offset='+offset);
    if (id !== generation) return;
    if (!data.length && offset) { offset -= 200; return reload(note); }
    el('list').replaceChildren(...data.map(accounts ? accountCard : card));
    el('prev').disabled = offset === 0;
    el('next').disabled = !hasMore;
    el('page').textContent = 'Página '+(1+offset/200);
    el('notice').textContent = note || (data.length ? '' : 'Nenhum registro encontrado.');
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
el('filter').onchange = el('section').onchange = () => { offset=0; reload(); };
el('prev').onclick = () => { offset-=200; reload(); };
el('next').onclick = () => { offset+=200; reload(); };
el('refresh').onclick = () => reload();
el('logout').onclick = async () => {
  const request = api('/logout','POST');
  lock();
  try { await request; } catch { if (!token) el('notice').textContent = 'Acesso local encerrado. A revogação no servidor não foi confirmada.'; }
};
window.addEventListener('pagehide', () => lock());

const levels = [
  ['Leve',1,'Primeiro envio de spam'],
  ['Moderada',3,'Spam repetido após aviso'],
  ['Grave',7,'Assédio direcionado'],
  ['Crítica',30,'Ameaças ou divulgação de dados pessoais']
];
function accountCard(account) {
  const box = item('article','');
  const deleting = account.action === 'delete';
  const state = deleting ? 'Exclusão agendada' : account.action ? 'Suspensa' : 'Ativa';
  box.append(item('p',state,'overline'),item('h3',account.first_name+' '+account.last_name),item('p',account.email));
  const path = '/accounts/'+encodeURIComponent(account.id);
  if (account.action) {
    box.append(item('p',account.severity+' · '+account.reason),
      item('p',(deleting ? 'Exclusão definitiva em ' : 'Suspensa até ')+new Date(account.until).toLocaleString('pt-BR')));
    const restore = item('button',deleting ? 'Reverter exclusão' : 'Reativar conta');
    restore.onclick = async () => {
      try { await api(path,'PATCH',{action:'restore'}); await reload('Conta reativada.'); }
      catch (error) { message(error); }
    };
    box.append(restore);
  }
  if (deleting) return box;
  const details = item('details','');
  details.append(item('summary','Gerenciar conta'));
  const form = item('form','');
  function field(title,control) {
    const label = item('label',title+' ');
    label.append(control);
    form.append(label);
    return control;
  }
  function option(select,value,text) { select.add(new Option(text,value)); }
  const action = field('Ação',item('select',''));
  option(action,'suspend','Suspender temporariamente');
  option(action,'delete','Excluir com prazo de reversão de 30 dias');
  const severity = field('Gravidade',item('select',''));
  levels.forEach(([level]) => option(severity,level,level));
  const hint = item('p','','meta');
  form.append(hint);
  const days = field('Duração em dias',item('input',''));
  days.type='number'; days.min=1; days.max=365; days.required=true;
  function suggest() {
    const [name,duration,example] = levels[severity.selectedIndex];
    hint.textContent = name+' · '+example+'. Suspensão sugerida de '+duration+' dia(s).';
    days.value=duration;
  }
  suggest();
  severity.onchange=suggest;
  action.onchange=() => { days.disabled=days.parentElement.hidden=action.value==='delete'; };
  const reason=field('Motivo',item('textarea',''));
  reason.required=true; reason.maxLength=500;
  form.append(item('button','Aplicar à conta','primary'));
  form.onsubmit=async event => {
    event.preventDefault();
    const deletingNow=action.value==='delete';
    if (!reason.value.trim()) { reason.focus(); return; }
    if (!confirm((deletingNow ? 'Agendar exclusão definitiva em 30 dias para ' : 'Aplicar suspensão a ')+account.email+'?')) return;
    const payload={action:action.value,severity:severity.value,reason:reason.value.trim()};
    if (!deletingNow) payload.days=Number(days.value);
    try { await api(path,'PATCH',payload); await reload('Alteração salva.'); }
    catch (error) { message(error); }
  };
  details.append(form); box.append(details);
  return box;
}
