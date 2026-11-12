const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let currentRole = "user";
let scale = "phq";
let currentCrisis = false;
const LS_KEY = "an-tam-demo-moods-v1";
const scales = {
  phq: [
    "Gần đây, bạn có thấy ít hứng thú với những việc thường làm không?",
    "Bạn có cảm thấy buồn, trống rỗng hoặc mất hy vọng không?",
    "Bạn có gặp khó khăn với giấc ngủ không?",
    "Bạn có thấy thiếu năng lượng trong ngày không?",
    "Bạn có nhận thấy thay đổi trong cảm giác thèm ăn không?",
    "Bạn có tự trách mình hoặc thấy mình không đủ tốt không?",
    "Bạn có khó tập trung vào việc đang làm không?",
    "Bạn có thấy mình chậm chạp hoặc bồn chồn hơn thường lệ không?",
    "Bạn có nghĩ đến việc làm tổn thương bản thân hoặc không muốn sống không?"
  ],
  gad: [
    "Bạn có thấy căng thẳng hoặc bồn chồn khó thư giãn không?",
    "Bạn có khó kiểm soát những điều khiến mình lo lắng không?",
    "Bạn có lo lắng quá nhiều về nhiều việc không?",
    "Bạn có khó thả lỏng cơ thể không?",
    "Bạn có thấy bồn chồn đến mức khó ngồi yên không?",
    "Bạn có dễ cáu gắt hoặc khó chịu hơn thường lệ không?",
    "Bạn có cảm thấy lo sợ rằng điều xấu sắp xảy ra không?"
  ]
};
const dateNode = $('#today-date'); if (dateNode) dateNode.textContent = new Date().toLocaleDateString('vi-VN', {weekday:'long', day:'numeric', month:'long'}).toUpperCase();
const answerLabels = ["Không / hiếm khi", "Vài ngày", "Nhiều ngày", "Gần như mỗi ngày"];

function showPanel(name) {
  $$('.panel').forEach(p => p.classList.toggle('hidden', p.id !== `panel-${name}`));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  window.scrollTo({top: 0, behavior: 'smooth'});
  if (name === 'inbox') refreshCases();
  if (name === 'mood') renderMoods();
}
$$('.nav-item').forEach(b => b.addEventListener('click', () => showPanel(b.dataset.panel)));
$$('[data-go]').forEach(b => b.addEventListener('click', () => showPanel(b.dataset.go)));
$('#role-toggle').addEventListener('click', () => {
  currentRole = currentRole === 'user' ? 'clinician' : 'user';
  $('#user-nav').classList.toggle('hidden', currentRole !== 'user');
  $('#clinician-nav').classList.toggle('hidden', currentRole !== 'clinician');
  $('#role-toggle').textContent = currentRole === 'user' ? 'Chuyển sang Chuyên gia' : 'Quay lại Người dùng';
  showPanel(currentRole === 'user' ? 'home' : 'inbox');
  toast('Đổi vai trò chỉ có tác dụng trình diễn; không phải phân quyền thật.');
});

const modal = $('#limits-modal');
$('#safety-more').addEventListener('click', () => modal.classList.remove('hidden'));
$('#close-modal').addEventListener('click', () => modal.classList.add('hidden'));
$('#accept-limits').addEventListener('click', () => modal.classList.add('hidden'));
$('#screening-crisis-link').addEventListener('click', () => { const box = $('#screening-result'); box.classList.remove('hidden'); box.classList.add('urgent-result'); box.innerHTML = '<strong>Ưu tiên an toàn của bạn</strong><p>Nếu bạn có nguy cơ làm hại bản thân ngay lúc này, hãy gọi <a href="tel:115">115</a> hoặc đến cơ sở cấp cứu gần nhất. Nhờ một người bạn tin cậy ở cạnh bạn.</p><small>Đây là thông tin cấp cứu y tế, không phải hotline chuyên biệt về sức khỏe tinh thần.</small>'; });

function toast(text) {
  const el = $('#toast'); el.textContent = text; el.classList.add('visible');
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}
function api(path, body) {
  return fetch(path, {method: body ? 'POST' : 'GET', headers: {'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined}).then(async r => {
    const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Lỗi kết nối'); return data;
  });
}
function esc(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function addChat(role, text) {
  const box = $('#chat-box'); const row = document.createElement('div'); row.className = `chat-message ${role}`;
  const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = role === 'assistant' ? 'a' : 'b';
  const content = document.createElement('div'); const label = document.createElement('span'); label.className = 'message-label'; label.textContent = role === 'assistant' ? 'An Tâm · bản demo' : 'Bạn';
  const p = document.createElement('p'); p.textContent = text; content.append(label, p); row.append(avatar, content); box.append(row); box.scrollTop = box.scrollHeight;
}
function showUrgentCard(kind, text) {
  currentCrisis = true;
  const box = $('#chat-box');
  const urgent = document.createElement('div'); urgent.className = 'urgent-card';
  const title = kind === 'physical_red_flag' ? 'Có dấu hiệu cần hỗ trợ y tế khẩn' : 'Ưu tiên an toàn của bạn lúc này';
  urgent.innerHTML = `<div class="urgent-label"><span>!</span> ${title}</div><p>${esc(text)}</p><div class="urgent-actions"><a class="call-button" href="tel:115">Gọi 115 · Cấp cứu y tế</a><button class="secondary-button" id="go-inbox">Xem cảnh báo chuyên gia mô phỏng</button></div><small>Bản demo chỉ hiển thị 115 là số cấp cứu y tế theo nguồn liên kết; chưa tích hợp đường dây hỗ trợ tâm lý riêng. Cảnh báo chuyên gia không được theo dõi trực tiếp.</small>`;
  box.append(urgent); box.scrollTop = box.scrollHeight;
  $('#go-inbox').addEventListener('click', () => {currentRole = 'clinician'; $('#user-nav').classList.add('hidden'); $('#clinician-nav').classList.remove('hidden'); $('#role-toggle').textContent = 'Quay lại Người dùng'; showPanel('inbox');});
}
$('#crisis-example').addEventListener('click', () => { $('#chat-input').value = 'Kịch bản diễn tập (giả lập): mình không muốn sống nữa'; $('#chat-input').focus(); toast('Tình huống giả lập đã điền; nhấn Gửi để xem luồng an toàn.'); });
$('#chat-form').addEventListener('submit', async e => {
  e.preventDefault(); const input = $('#chat-input'); const message = input.value.trim(); if (!message) return;
  addChat('user', message); input.value = ''; currentCrisis = false;
  try {
    const result = await api('/api/chat', {message, consent_to_contact: $('#contact-consent').checked});
    addChat('assistant', result.reply);
    if (result.urgent) showUrgentCard(result.kind, result.kind === 'physical_red_flag' ? 'Bạn mô tả dấu hiệu có thể cần được đánh giá khẩn cấp. Bản demo không thể phân loại hay loại trừ cấp cứu. Hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất ngay.' : 'Nếu bạn có nguy cơ làm hại bản thân ngay lúc này, hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất. Nhờ một người bạn tin cậy ở cạnh bạn.');
  } catch (_) { addChat('assistant', 'Mình chưa kết nối được với demo. Nếu đang nguy hiểm tức thời, gọi 115 hoặc đến cơ sở cấp cứu gần nhất.'); }
});

function loadMoods() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
$('#save-mood').addEventListener('click', () => {
  const selected = $('input[name="mood"]:checked'); if (!selected) return toast('Chọn một mức cảm xúc trước nhé.');
  const tags = $$('input[type="checkbox"]:checked', $('.tag-row')).map(x => x.value);
  const items = loadMoods(); items.push({date: new Date().toISOString(), score: Number(selected.value), tags});
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(-30))); renderMoods(); toast('Đã lưu trên trình duyệt này.');
});
$('#clear-moods').addEventListener('click', () => { localStorage.removeItem(LS_KEY); renderMoods(); toast('Đã xóa nhật ký trên thiết bị này.'); });
function renderMoods() {
  const items = loadMoods().slice(-10); const chart = $('#mood-chart'); chart.replaceChildren();
  $('#mood-empty').classList.toggle('hidden', items.length > 0);
  items.forEach(item => {
    const col = document.createElement('div'); col.className = 'mood-col';
    const value = document.createElement('span'); value.className = 'mood-value'; value.textContent = ['','😞','🙁','😐','🙂','😊'][item.score];
    const bar = document.createElement('div'); bar.className = 'mood-bar'; bar.style.height = `${20 + item.score * 24}px`;
    const date = document.createElement('small'); date.textContent = new Date(item.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'});
    col.append(value, bar, date); chart.append(col);
  });
}

function renderQuestions() {
  const wrap = $('#questions'); wrap.replaceChildren(); $('#screening-result').classList.add('hidden');
  scales[scale].forEach((q, i) => {
    const field = document.createElement('fieldset'); field.className = 'question';
    const legend = document.createElement('legend'); legend.innerHTML = `<span>${String(i+1).padStart(2,'0')}</span>${esc(q)}`; field.append(legend);
    const choices = document.createElement('div'); choices.className = 'choice-row';
    answerLabels.forEach((label, val) => {
      const l = document.createElement('label'); l.className = 'choice';
      l.innerHTML = `<input type="radio" name="q${i}" value="${val}" required><span>${label}</span>`; choices.append(l);
    });
    field.append(choices); wrap.append(field);
  });
}
$$('.segment').forEach(button => button.addEventListener('click', () => {
  $$('.segment').forEach(x => x.classList.toggle('active', x === button)); scale = button.dataset.scale; renderQuestions();
}));
$('#screening-form').addEventListener('submit', async e => {
  e.preventDefault(); const answers = scales[scale].map((_, i) => Number($(`input[name="q${i}"]:checked`).value));
  try {
    const result = await api('/api/screening', {kind: scale === 'phq' ? 'phq_demo' : 'gad_demo', answers, consent_to_contact: $('#contact-consent').checked});
    const box = $('#screening-result'); box.classList.remove('hidden');
    box.innerHTML = `<strong>Check-in hoàn tất</strong><p>Tổng điểm mô phỏng: <b>${result.score}</b> · ${result.answered} câu trả lời.</p><p>Con số này không phải điểm PHQ-9/GAD-7 chuẩn hóa, không dùng để chẩn đoán hoặc xác định mức độ an toàn. Nếu bạn thấy lo lắng, hãy trao đổi với chuyên gia.</p>`;
    if (result.urgent) {
      box.classList.add('urgent-result'); box.innerHTML += `<div class="urgent-label"><span>!</span> Ưu tiên hỗ trợ an toàn</div><p>Nếu bạn có nguy cơ làm hại bản thân ngay lúc này, gọi <a href="tel:115">115</a> hoặc đến khoa cấp cứu gần nhất; nhờ người bạn tin cậy ở cạnh bạn.</p><p>Cảnh báo chuyên gia được tạo trong bản demo; không có người trực thật.</p>`;
    } else box.classList.remove('urgent-result');
  } catch (_) { toast('Không thể gửi check-in.'); }
});
renderQuestions();

async function renderResources() {
  const list = $('#resource-list');
  try {
    const resources = await api('/api/resources');
    resources.forEach(item => {
      const card = document.createElement('article'); card.className = 'surface resource-card';
      const icon = document.createElement('span'); icon.className = 'quick-icon mint'; icon.textContent = item.id === 'breathing' ? '≈' : item.id === 'grounding' ? '✳' : '✎';
      const h = document.createElement('h2'); h.textContent = item.title; const p = document.createElement('p'); p.textContent = item.summary;
      const source = document.createElement('small'); source.textContent = item.source; const a = document.createElement('a'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener'; a.className = 'source-link'; a.textContent = 'Mở nguồn ↗';
      card.append(icon,h,p,source,a);
      if (item.id === 'breathing') { const b = document.createElement('button'); b.className = 'secondary-button'; b.textContent = 'Bắt đầu 60 giây'; b.addEventListener('click', () => startBreathing(card)); card.append(b); }
      if (item.id === 'grounding') { const b = document.createElement('button'); b.className = 'secondary-button'; b.textContent = 'Bắt đầu grounding'; b.addEventListener('click', () => startGrounding(card)); card.append(b); }
      if (item.id === 'journal') { const b = document.createElement('button'); b.className = 'secondary-button'; b.textContent = 'Mở check-in'; b.addEventListener('click', () => showPanel('mood')); card.append(b); }
      list.append(card);
    });
  } catch (_) { list.textContent = 'Không tải được thư viện.'; }
}
function startBreathing(card) {
  const old = $('.exercise-live', card); if (old) old.remove();
  const box = document.createElement('div'); box.className = 'exercise-live'; box.innerHTML = '<strong>Thở nhẹ theo nhịp của bạn</strong><p id="breath-count">Hít vào nhẹ nhàng…</p><div class="breath-orb"></div><button class="quiet-button" id="stop-breath">Dừng bài tập</button>';
  card.append(box); let phase = 0; const phases = ['Hít vào nhẹ nhàng…','Thở ra nhẹ nhàng…']; const count = $('#breath-count', box);
  const timer = setInterval(() => { phase = 1 - phase; count.textContent = phases[phase]; }, 4000);
  $('#stop-breath', box).addEventListener('click', () => { clearInterval(timer); box.remove(); });
}
function startGrounding(card) {
  const old = $('.exercise-live', card); if (old) old.remove();
  const box = document.createElement('div'); box.className = 'exercise-live'; box.innerHTML = '<strong>Nhẹ nhàng để ý xung quanh</strong><ol><li>5 điều bạn có thể nhìn thấy</li><li>4 điều bạn có thể cảm nhận bằng cơ thể</li><li>3 âm thanh bạn nghe được</li><li>2 mùi bạn nhận ra</li><li>1 vị bạn cảm nhận được</li></ol><p>Bạn có thể dừng hoặc bỏ qua bước nào không thoải mái.</p><button class="quiet-button">Đóng bài tập</button>';
  card.append(box); $('button', box).addEventListener('click', () => box.remove());
}
renderResources();

$('#redflag-example').addEventListener('click', () => { $('#symptom-input').value = 'Tình huống diễn tập: khó thở đột ngột'; });
$('#redflag-form').addEventListener('submit', async e => {
  e.preventDefault(); const result = await api('/api/red-flag', {symptoms: $('#symptom-input').value}); const box = $('#redflag-result'); box.classList.remove('hidden');
  box.innerHTML = result.urgent ? `<strong>Có tín hiệu khẩn trong quy tắc demo</strong><p>Không dùng kết quả này để phân loại hay loại trừ cấp cứu. Hãy gọi <a href="tel:115">115</a> hoặc đến cơ sở cấp cứu nếu có nguy hiểm tức thời.</p><small>Quy tắc nhận diện: ${esc(result.signals.join(', '))}</small>` : '<strong>Không thấy từ khóa demo.</strong><p>Điều này không chứng minh rằng triệu chứng an toàn. Hãy liên hệ nhân viên y tế khi cần.</p>';
  box.classList.toggle('urgent-result', result.urgent);
  if (result.urgent) { const caseResult = await api('/api/chat', {message: $('#symptom-input').value, consent_to_contact: $('#contact-consent').checked}); if (caseResult.case) toast('Đã tạo cảnh báo diễn tập cho hàng đợi.'); }
});
$('#med-form').addEventListener('submit', async e => {
  e.preventDefault(); const medications = $$('input[name="med"]:checked').map(x => x.value); const result = await api('/api/medication-check', {medications}); const box = $('#med-result'); box.classList.remove('hidden'); box.classList.toggle('urgent-result', result.warning);
  box.innerHTML = `<strong>${result.warning ? 'Cảnh báo tương tác giả lập' : 'Chưa có cơ sở dữ liệu thuốc'}</strong><p>${esc(result.message)}</p><small>Không đưa ra quyết định dùng thuốc dựa trên bản demo.</small>`;
});
$('#load-fhir').addEventListener('click', async () => { const result = await api('/api/fhir/preview'); const out = $('#fhir-output'); out.textContent = JSON.stringify(result, null, 2); out.classList.remove('hidden'); });

async function refreshCases() {
  try {
    const {cases} = await api('/api/cases'); $('#case-count').textContent = cases.length;
    const list = $('#case-list'); list.replaceChildren(); $('#case-empty').classList.toggle('hidden', cases.length > 0);
    cases.forEach(item => {
      const card = document.createElement('article'); card.className = 'case-card';
      const kind = item.kind === 'physical_red_flag' ? 'Cờ đỏ y tế · demo' : 'Tín hiệu khủng hoảng · demo';
      card.innerHTML = `<div class="case-top"><span class="case-tag ${item.status === 'reviewed' ? 'done' : 'new'}">${item.status === 'reviewed' ? 'ĐÃ XEM' : 'MỚI'}</span><time>${new Date(item.created_at).toLocaleString('vi-VN')}</time></div><h3>${kind}</h3><p>${esc(item.summary)}</p><div class="case-meta"><span>Mã ẩn danh ${esc(item.id)}</span><span>Đồng ý liên hệ: ${item.consent_to_contact ? 'Có (mô phỏng)' : 'Không'}</span></div>${item.status === 'new' ? `<button class="secondary-button resolve-case" data-id="${esc(item.id)}">Đánh dấu đã xem</button>` : '<small>Đã xem · không có xử lý chuyên gia thật</small>'}`;
      list.append(card);
    });
    $$('.resolve-case').forEach(b => b.addEventListener('click', async () => { await api('/api/cases/resolve', {id: b.dataset.id}); refreshCases(); }));
  } catch (_) { toast('Không tải được hàng đợi.'); }
}
$('#refresh-cases').addEventListener('click', refreshCases);
$('#contact-consent').addEventListener('change', e => { toast(e.target.checked ? 'Đã bật mô phỏng đồng ý chia sẻ cảnh báo.' : 'Đã tắt mô phỏng đồng ý chia sẻ.'); });
