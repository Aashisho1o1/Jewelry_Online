// "Go Live" button: shows what changed, then publishes it after a confirmation.
const el = (tag, style, text) => {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  if (text !== undefined) node.textContent = text;
  return node;
};
const GREEN = { background: '#1f4d3a', color: '#fff', border: 0, borderRadius: '8px', padding: '12px 20px', font: '600 15px Arial', cursor: 'pointer' };
const PLAIN = { ...GREEN, background: '#eee', color: '#222' };

const call = async (action, body) => {
  // The custom header keeps other websites from triggering this.
  const res = await fetch(`/admin/go-live/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Go-Live': '1' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};

const open = el('button', { ...GREEN, position: 'fixed', right: '20px', bottom: '20px', zIndex: 99998, boxShadow: '0 2px 8px #0004' }, 'Go Live');
const panel = el('div', { display: 'none', position: 'fixed', right: '20px', bottom: '76px', zIndex: 99999, width: 'min(420px, calc(100vw - 40px))', maxHeight: '75vh', overflow: 'auto', background: '#fff', border: '1px solid #ccc', borderRadius: '10px', padding: '18px', boxSizing: 'border-box', font: '14px/1.5 Arial', color: '#222', boxShadow: '0 6px 24px #0003' });
document.body.append(open, panel);

let working = false;
const title = text => panel.append(el('div', { font: '700 17px Arial', marginBottom: '8px' }, text));
const line = (text, style) => panel.append(el('div', style || {}, text));

function button(label, style, onClick) {
  const node = el('button', { ...style, marginTop: '12px', marginRight: '8px' }, label);
  node.addEventListener('click', onClick);
  panel.append(node);
  return node;
}

function show(heading, text, color) {
  panel.replaceChildren();
  title(heading);
  line(text, { color: color || '#222' });
}

async function run(action, body) {
  working = true;
  show('Updating the website...', 'Checking, saving and deploying. This takes about a minute. Keep this page open.');
  try {
    const result = await call(action, body);
    if (result.verified) show('Live ✓', 'Your changes are on aashishjewellers.com.np.', '#1f4d3a');
    else show('Deployed', 'The update was deployed, but the live shop did not confirm it yet. Check the website in a minute.', '#8a5a00');
    if (action === 'undo') line('Refresh this page to see the previous version here.');
  } catch (error) {
    show('Not updated', error.message, '#b00020');
    button('Back', PLAIN, refresh);
  }
  working = false;
}

async function refresh() {
  show('Go Live', 'Looking for changes...');
  let data;
  try {
    data = await call('preview');
  } catch (error) {
    show('Go Live', error.message, '#b00020');
    return;
  }
  panel.replaceChildren();
  title('Go Live');
  if (data.pending) {
    line('The last update was saved but not deployed.', { color: '#b00020' });
    button('Try again', GREEN, () => run('retry'));
    return;
  }
  if (!data.items.length && !data.errors.length) line('Everything published here is already live.');
  for (const item of data.items) {
    line(item.title, { fontWeight: 700, marginTop: '8px' });
    item.lines.forEach(text => line(text, { paddingLeft: '10px' }));
  }
  data.errors.forEach(text => line(`Fix first: ${text}`, { color: '#b00020', marginTop: '8px' }));

  let box;
  if (data.warnings.length && !data.errors.length) {
    const wrap = el('div', { background: '#fff4d6', borderRadius: '6px', padding: '10px', marginTop: '12px' });
    data.warnings.forEach(text => wrap.append(el('div', {}, `⚠ ${text}`)));
    const label = el('label', { display: 'block', marginTop: '8px', fontWeight: 700 });
    box = el('input', { marginRight: '8px' });
    box.type = 'checkbox';
    label.append(box, 'I checked this and it is correct');
    wrap.append(label);
    panel.append(wrap);
  }
  if (data.files.length && !data.errors.length) {
    const go = button('Go Live now', GREEN, () => run('publish', { fingerprint: data.fingerprint, confirmed: box ? box.checked : false }));
    if (box) {
      const sync = () => { go.disabled = !box.checked; go.style.opacity = box.checked ? 1 : 0.4; };
      box.addEventListener('change', sync);
      sync();
    }
  }
  if (data.canUndo) {
    const undo = button('Undo last update', PLAIN, () => {
      if (undo.textContent === 'Undo last update') undo.textContent = 'Click again to undo on the live shop';
      else run('undo');
    });
  }
}

open.addEventListener('click', () => {
  const showing = panel.style.display === 'block';
  panel.style.display = showing ? 'none' : 'block';
  if (!showing && !working) refresh();
});
