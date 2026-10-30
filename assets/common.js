/* Utilitas bersama halaman pengisian & admin */
(function () {
  'use strict';

  async function api(action, payload) {
    const url = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '';
    if (!url || url.indexOf('GANTI_DENGAN') >= 0) throw new Error('URL backend belum diatur di assets/config.js.');
    let res;
    try {
      // text/plain agar tidak memicu preflight CORS ke Apps Script
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action }, payload || {})),
        redirect: 'follow'
      });
    } catch (e) {
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.');
    }
    let j;
    try { j = await res.json(); } catch (e) { throw new Error('Jawaban server tidak terbaca (' + res.status + ').'); }
    if (!j.ok) throw new Error(j.error || 'Terjadi kesalahan.');
    return j.data;
  }

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'value') n.value = v;
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return n;
  }

  function toast(msg, type) {
    let box = document.getElementById('toasts');
    if (!box) { box = el('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(box); }
    const t = el('div', { class: 'toast ' + (type || '') }, msg);
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4300);
  }

  function modal({ title, body, okText, cancelText, danger }) {
    return new Promise(resolve => {
      const close = v => { wrap.remove(); resolve(v); };
      const wrap = el('div', { class: 'modal-wrap', onclick: e => { if (e.target === wrap) close(false); } },
        el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
          el('h3', null, title),
          el('div', { class: 'modal-body' }, body),
          el('div', { class: 'modal-actions' },
            cancelText === null ? null : el('button', { class: 'btn ghost', onclick: () => close(false) }, cancelText || 'Batal'),
            el('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => close(true) }, okText || 'OK'))));
      document.body.appendChild(wrap);
      wrap.querySelector('.modal-actions .btn:last-child').focus();
    });
  }

  function optionsFor(q, jenjang) {
    if (q.type !== 'select') return [];
    if (q.perJenjang) return (q.optionsByJenjang && q.optionsByJenjang[jenjang]) || [];
    return q.options || [];
  }

  const TYPE_LABEL = {
    text: 'Teks singkat', textarea: 'Teks panjang', number: 'Angka', nisn: 'NISN (10 digit)',
    select: 'Pilihan (dropdown)', date: 'Tanggal', phone: 'Nomor HP', system: 'Otomatis'
  };

  function validate(q, v, jenjang) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return q.required ? 'wajib diisi' : '';
    if (q.type === 'nisn' && !/^\d{10}$/.test(s)) return 'harus 10 digit angka';
    if (q.type === 'number' && !/^-?\d+([.,]\d+)?$/.test(s)) return 'harus angka';
    if (q.type === 'phone' && !/^[0-9+\-\s]{8,16}$/.test(s)) return 'nomor HP tidak valid';
    if (q.type === 'select' && optionsFor(q, jenjang).indexOf(s) < 0) return 'pilih salah satu';
    return '';
  }

  function inputFor(q, value, jenjang, onInput) {
    let n;
    if (q.type === 'select') {
      n = el('select', null, el('option', { value: '' }, '— pilih —'),
        optionsFor(q, jenjang).map(o => el('option', { value: o }, o)));
      n.value = value || '';
    } else if (q.type === 'textarea') {
      n = el('textarea', { rows: 2 });
      n.value = value || '';
    } else {
      const attrs = { type: 'text' };
      if (q.type === 'nisn') Object.assign(attrs, { inputmode: 'numeric', maxlength: 10, placeholder: '10 digit' });
      if (q.type === 'number') attrs.inputmode = 'decimal';
      if (q.type === 'phone') Object.assign(attrs, { inputmode: 'tel', placeholder: '08…' });
      if (q.type === 'date') attrs.type = 'date';
      n = el('input', attrs);
      n.value = value || '';
    }
    n.dataset.qid = q.id;
    if (onInput) { n.addEventListener('input', onInput); n.addEventListener('change', onInput); }
    return n;
  }

  function fmtWaktu(s) {
    if (!s) return '';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!m) return s;
    const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${+m[3]} ${bln[+m[2] - 1]} ${m[1]}, ${m[4]}.${m[5]} WIB`;
  }

  function loadScript(src) {
    return new Promise((ok, bad) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => bad(new Error('Gagal memuat ' + src));
      document.head.appendChild(s);
    });
  }

  window.U = { api, el, toast, modal, optionsFor, validate, inputFor, fmtWaktu, loadScript, TYPE_LABEL };
})();
