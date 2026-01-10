(function(){
  const config = { apiEndpoint: '', deadline: '202X-XX-XX', eventDateISO: '' };
  const $ = id => document.getElementById(id);


  async function loadConfig(){
    try{
      const res = await fetch('config.json');
      if(res.ok){
        Object.assign(config, await res.json());
      }
    }catch(e){
      // エラー時はデフォルト設定を使用
      console.error('設定ファイルの読み込みに失敗しました。初期設定を使います。');
      console.error(e); // logging error details.
    }
    $('deadline-date').textContent = config.deadline || '未設定';
    // イベント日表示を更新
    const eventDateEl = document.getElementById('event-date');
    if(eventDateEl && config.eventDateISO){
      try{
        const d = new Date(config.eventDateISO);
        if(!isNaN(d)) {
          // Format as YYYY.M.D (e.g., 2026.3.20)
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const day = d.getDate();
          eventDateEl.textContent = `${year}.${month}.${day}`;
        }
      }catch(e){}
    }
    
    // RSVPフォーム内の締切日表示を更新
    const rsvpDeadline = document.getElementById('rsvp-deadline-date');
    if(rsvpDeadline && config.deadline) {
      // 2026-03-20 のような形式を "2026年3月20日" に変換して表示
      try {
         const d = new Date(config.deadline);
         if(!isNaN(d)) {
            rsvpDeadline.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
         } else {
            rsvpDeadline.textContent = config.deadline;
         }
      } catch(e) {
         rsvpDeadline.textContent = config.deadline;
      }
    }
    // カウントダウン初期化
    initCountdown(config.eventDateISO);
  }

  // メッセージ表示
  function showMessage(text, isError){
    const el = document.getElementById('form-response');
    if(el){
        el.textContent = text;
        el.style.color = isError ? '#d9534f' : '#333'; // エラー時は赤、成功時は黒
    }
  }

  // フォームデータ収集
  function collectForm(){
    const form = document.getElementById('rsvp-form');
    const formData = new FormData(form);
    
    const obj = {};
    
    // 1. Python仕様に合わせる項目 (必須)
    // attendanceはHTML修正により 'attend' か 'absent' が入ります
    obj.attendance = formData.get('attendance') || ''; 
    
    // 名前: Python仕様では 'name' キー
    obj.name = (formData.get('name_sei') || '') + ' ' + (formData.get('name_mei') || '');
    
    // かな: Python仕様では 'kana' キー
    obj.kana = (formData.get('kana_sei') || '') + ' ' + (formData.get('kana_mei') || '');
    
    // メール: Python仕様では 'email' キー
    obj.email = formData.get('email') || '';
    
    // アレルギー: Python仕様では 'allergy' キー
    const allergies = formData.getAll('allergy[]');
    const allergyOther = formData.get('allergy_other');
    if(allergyOther) allergies.push(`その他(${allergyOther})`);
    obj.allergy = allergies.length > 0 ? allergies.join(', ') : 'なし';
    
    // メッセージ: Python仕様では 'message' キー
    obj.message = formData.get('message') || '';

    // 2. 今回の要件で追加された項目 (Lambda側での対応が必要)
    obj.guest_side = formData.get('guest_side') || ''; // 新郎ゲスト/新婦ゲスト
    obj.gender = formData.get('gender') || '';         // 男性/女性/回答しない
    obj.phone = formData.get('phone') || '';           // 電話番号
    
    // 住所結合
    const zip = formData.get('zip_code') || '';
    const pref = formData.get('pref') || '';
    const city = formData.get('city') || '';
    const street = formData.get('street') || '';
    obj.address = `〒${zip} ${pref}${city}${street}`;

    // 送信日時
    obj.submitted_at = new Date().toISOString();

    console.log('Sending payload:', obj);
    return obj;
  }

  // フォームバリデーション
  function validate(){
    const form = document.getElementById('rsvp-form');
    const formData = new FormData(form);

    // 必須項目のチェック
    if(!formData.get('attendance')) return 'ご出欠を選択してください。';
    if(!formData.get('guest_side')) return '新郎ゲスト・新婦ゲストのいずれかを選択してください。';
    
    if(!formData.get('name_sei') || !formData.get('name_mei')) return 'お名前を入力してください。';
    if(!formData.get('kana_sei') || !formData.get('kana_mei')) return 'ふりがなを入力してください。';
    
    const email = formData.get('email');
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '有効なメールアドレスを入力してください。';
    
    if(!formData.get('zip_code') || !formData.get('pref') || !formData.get('city') || !formData.get('street')) {
        return 'ご住所をすべて入力してください。';
    }
    if(!formData.get('phone')) return '電話番号を入力してください。';

    return '';
  }

  async function submitForm(e){
    e.preventDefault();
    const err = validate();
    if(err){ showMessage(err, true); return; }
    const payload = collectForm();
    $('submit-btn').disabled = true;
    showMessage('送信中…');
    // Must have an API endpoint configured that fronts the Lambda (API Gateway)
    if(!config.apiEndpoint){
      showMessage('送信先が設定されていません。config.json の "apiEndpoint" に API Gateway の URL を設定してください。', true);
      $('submit-btn').disabled = false;
      return;
    }

    try{
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Attempt to parse JSON response when possible
      let data = null;
      const text = await res.text();
      try{ data = text ? JSON.parse(text) : null; }catch(e){ data = null; }

      if(res.ok){
        const message = (data && data.message) ? data.message : 'ご回答ありがとうございます。送信が完了しました。';
        showMessage(message);
        document.getElementById('rsvp-form').reset();
      }else{
        const errMsg = (data && data.error) ? data.error : (text || res.status);
        showMessage('送信に失敗しました: ' + errMsg, true);
      }
    }catch(err){
      console.error('Submit error:', err);
      showMessage('送信中にエラーが発生しました。ネットワークを確認してください。', true);
    }finally{
      $('submit-btn').disabled = false;
    }
  }

  // カウントダウンタイマー
  let countdownTimer = null;
  function parseDateLike(input){
    // accepts ISO or 'YYYY年MM月DD日' or plain YYYY-MM-DD
    if(!input) return null;
    // try ISO first
    const asISO = new Date(input);
    if(!isNaN(asISO)) return asISO;
    // try extracting numbers
    const m = input.match(/(\d{4}).*?(\d{1,2}).*?(\d{1,2})/);
    if(m){ return new Date(Number(m[1]), Number(m[2])-1, Number(m[3])); }
    return null;
  }

  function initCountdown(dateInput){
    console.log('Initializing countdown with dateInput:', dateInput);
    const container = document.getElementById('countdown');
    if(!container) {
      console.error('Countdown container not found');
      return;
    }
    const target = parseDateLike(dateInput);
    console.log('Parsed target date:', target);
    if(!target) { 
      console.error('Failed to parse target date:', dateInput);
      container.style.display = 'none'; 
      return; 
    }

    function tick(){
      const now = new Date();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000*60*60*24));
      diff -= days * (1000*60*60*24);
      const hours = Math.floor(diff / (1000*60*60));
      diff -= hours * (1000*60*60);
      const mins = Math.floor(diff / (1000*60));
      diff -= mins * (1000*60);
      const secs = Math.floor(diff / 1000);

      // アニメーション付きで数字を更新する関数
      function updateNumber(id, newValue, prevValue, shouldPad = false) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(newValue)) {
          el.classList.add('flip');
          setTimeout(() => {
            el.textContent = shouldPad ? String(newValue).padStart(2,'0') : String(newValue);
            setTimeout(() => el.classList.remove('flip'), 100);
          }, 150);
        }
      }

      // 前回の値を保存して比較
      if (!tick.prev) tick.prev = {days: -1, hours: -1, mins: -1, secs: -1}; // 初期化
      
      updateNumber('cd-days', days, tick.prev.days, false); // 日数は0埋めしない
      updateNumber('cd-hours', hours, tick.prev.hours, true);
      updateNumber('cd-mins', mins, tick.prev.mins, true);
      updateNumber('cd-secs', secs, tick.prev.secs, true);

      tick.prev = {days, hours, mins, secs};

      // 日付が0になったら表示を変更
      if (diff <= 0) {
        document.getElementById('countdown').innerHTML = '<div class="countdown-item special"><span class="num">Happy</span><span class="label">Wedding Day!</span></div>';
      }
    }

    tick();
    if(countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(tick, 1000); // 1秒ごとに更新
  }

  // --- Preload all images and GIFs before showing content ---
  function preloadAssets() {
    return new Promise((resolve) => {
      const assetsToLoad = [];
      
      // Welcome GIF
      const welcomeGif = document.querySelector('.welcome-animation');
      if (welcomeGif && welcomeGif.src) {
        assetsToLoad.push(welcomeGif.src);
      }
      
      // Message GIF
      const messageGif = document.getElementById('message-gif');
      if (messageGif && messageGif.dataset.src) {
        assetsToLoad.push(messageGif.dataset.src);
      }
      
      // Profile GIF
      const profileGif = document.getElementById('profile-gif');
      if (profileGif && profileGif.dataset.src) {
        assetsToLoad.push(profileGif.dataset.src);
      }
      
      // Hero image
      const heroImage = document.querySelector('.hero-img');
      if (heroImage && heroImage.src) {
        assetsToLoad.push(heroImage.src);
      }
      
      // Preload all assets
      let loadedCount = 0;
      const totalAssets = assetsToLoad.length;
      
      if (totalAssets === 0) {
        resolve();
        return;
      }
      
      assetsToLoad.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount >= totalAssets) {
            // All assets loaded, wait a tiny bit for rendering
            setTimeout(resolve, 100);
          }
        };
        img.src = src;
      });
      
      // Safety timeout: remove overlay after 10 seconds regardless
      setTimeout(resolve, 10000);
    });
  }

  // Remove initial overlay after assets are loaded AND minimum 3.5 seconds
  async function removeInitialOverlay() {
    const minDisplayTime = 3500;
    const video = document.querySelector('.welcome-animation');
    
    // Wait for video to end or minimum time, whichever is longer
    await Promise.all([
      preloadAssets(),
      new Promise(resolve => {
        if (video && video.tagName === 'VIDEO') {
          const checkVideoEnd = () => {
            if (window.videoEnded || video.ended) {
              setTimeout(resolve, Math.max(0, minDisplayTime - video.currentTime * 1000));
            } else {
              setTimeout(checkVideoEnd, 100);
            }
          };
          checkVideoEnd();
        } else {
          setTimeout(resolve, minDisplayTime);
        }
      })
    ]);
    
    const overlay = document.querySelector('.initial-overlay');
    if (overlay) {
      overlay.classList.add('loaded');
      setTimeout(() => {
        overlay.remove();
      }, 1200);
    }
  }

/* =========================================
    Gallery Initialization
========================================= */
function initGallery() {
  // 画像が存在しない場合にエラーにならないようチェック
  if(!document.querySelector('.main-gallery-slider')) return;

  // 1. サムネイル用スライダーの設定
  const thumbsSwiper = new Swiper('.thumbs-gallery-slider', {
    spaceBetween: 10,
    slidesPerView: 'auto',  // 固定数ではなくCSSに任せる
    freeMode: true,
    watchSlidesProgress: true,
    breakpoints: {
      768: { slidesPerView: 5 }
    }
  });

  // 2. メインスライダーの設定
  const mainSwiper = new Swiper('.main-gallery-slider', {
    loop: true,               // 無限ループ
    speed: 800,               // アニメーション速度（800msでぬるっとさせる）
    spaceBetween: 0,          // スライド間の余白（CSSのscaleで調整するため0でOK）
    centeredSlides: true,     // アクティブな画像を中央に
    slidesPerView: 'auto',    // CSSで指定した幅に従う
    grabCursor: true,         // PCで掴めるカーソル表示
    
    // サムネイルとの連携
    thumbs: {
      swiper: thumbsSwiper,
    },
    
    // ナビゲーションボタン
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
}

  // --- DOMContentLoaded: ページの読み込み完了後に各種機能を初期化 ---
  document.addEventListener('DOMContentLoaded', ()=>{
    console.log('=== DOMContentLoaded fired ===');
    // Start preloading and overlay removal
    removeInitialOverlay();
    loadConfig();
    initGallery();


    const form = document.getElementById('rsvp-form');
    if(form) form.addEventListener('submit', submitForm);
    console.log('=== RSVP form submit Event listener for form submission set up ===');

    // Initialize photo slider
    const options = {
      root: null, 
      rootMargin: "0px 0px -15% 0px", 
      threshold: 0 
    };

    // 2. IntersectionObserver
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          console.log('Section revealed:', entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // 3. Scroll Animation
    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach(section => {
      observer.observe(section);
    });    
    console.log('=== Scroll animation IntersectionObserver set up ===');

    // --- GIF replay helper function ---
    function setupGifReplay(elementId) {
      const el = document.getElementById(elementId);
      if(!el || !el.dataset.src) return;
      
      let isFirstLoad = true;
      function bust(url){ return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(); }

      const observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            if(el.dataset.playing === '1') return;
            el.dataset.playing = '1';
            
            // First load: use preloaded image directly (no cache bust)
            if(isFirstLoad) {
              el.src = el.dataset.src;
              isFirstLoad = false;
            } else {
              // Subsequent loads: cache-bust for replay
              const nextUrl = bust(el.dataset.src);
              const pre = new Image();
              pre.decoding = 'sync';
              pre.onload = ()=>{
                el.src = nextUrl;
              };
              pre.src = nextUrl;
            }
          } else {
            el.dataset.playing = '0';
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
      observer.observe(el);
    }
    
    // Setup GIF replay for Message and Profile
    setupGifReplay('message-gif');
    setupGifReplay('profile-gif');
     
    // Mobile viewport height fix for address bar visibility changes
    function setViewportHeight() {
      // Get actual viewport height and set CSS custom property
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Set initial viewport height
    setViewportHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });
    
    // Smooth scrolling enhancement for better UX
    // Polyfill for older browsers that don't support scroll-behavior: smooth
    if (!CSS.supports('scroll-behavior', 'smooth')) {
      const links = document.querySelectorAll('a[href^="#"]');
      links.forEach(link => {
        link.addEventListener('click', function(e) {
          const targetId = this.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    }
  });

})();