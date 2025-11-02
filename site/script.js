// Simple client-side logic for RSVP form.
(function(){
  const cfgPath = 'config.json';
  let config = { apiEndpoint: '', deadline: '202X-XX-XX' };

  function $(id){ return document.getElementById(id); }

  async function loadConfig(){
    try{
      const res = await fetch(cfgPath);
      if(res.ok) config = await res.json();
    }catch(e){ /* ignore, use defaults */ }
    $('deadline-date').textContent = config.deadline || '未設定';
  }

  function showMessage(text, isError){
    const el = $('response');
    el.textContent = text;
    el.style.color = isError ? 'crimson' : 'green';
  }

  function collectForm(){
    const form = document.getElementById('rsvp-form');
    const data = new FormData(form);
    const obj = {};
    for(const [k,v] of data.entries()) obj[k] = v;
    // radio attendance may be missing; ensure present
    const att = form.querySelector('input[name="attendance"]:checked');
    obj.attendance = att ? att.value : '';
    return obj;
  }

  function validate(form){
    // rely on HTML5 required + simple email check
    const email = $('email').value.trim();
    if(!email) return 'メールアドレスを入力してください。';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '有効なメールアドレスを入力してください。';
    if(!$('name').value.trim()) return 'お名前を入力してください。';
    if(!$('kana').value.trim()) return 'ふりがなを入力してください。';
    if(!document.querySelector('input[name="attendance"]:checked')) return 'ご出席/ご欠席を選択してください。';
    return '';
  }

  async function submitForm(e){
    e.preventDefault();
    const err = validate();
    if(err){ showMessage(err, true); return; }
    const payload = collectForm();
    $('submit').disabled = true;
    showMessage('送信中…');

    if(config.apiEndpoint){
      try{
        const res = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if(res.ok){
          showMessage('ご回答ありがとうございます。送信が完了しました。');
          document.getElementById('rsvp-form').reset();
        }else{
          const txt = await res.text();
          showMessage('送信に失敗しました: '+ (txt||res.status), true);
        }
      }catch(err){
        showMessage('送信中にエラーが発生しました。ネットワークを確認してください。', true);
      }
    }else{
      // mock behaviour when no backend configured
      await new Promise(r=>setTimeout(r,800));
      console.log('Mock RSVP payload:', payload);
      showMessage('ご回答ありがとうございます（モック送信）。');
      document.getElementById('rsvp-form').reset();
    }

    $('submit').disabled = false;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadConfig();
    const form = document.getElementById('rsvp-form');
    form.addEventListener('submit', submitForm);
  });

})();
