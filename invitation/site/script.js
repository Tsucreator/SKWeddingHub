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
      // add error logging here.
      console.error('設定ファイルの読み込みに失敗しました。初期設定を使います。');
      console.error(e); // logging error details.
    }
    $('deadline-date').textContent = config.deadline || '未設定';
    // show event date if available
    const eventDateEl = document.getElementById('event-date');
    if(eventDateEl && config.eventDateISO){
      try{
        const d = new Date(config.eventDateISO);
        if(!isNaN(d)) {
          // Format as YYYY.M.D (no leading zeros)
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const day = d.getDate();
          eventDateEl.textContent = `${year}.${month}.${day}`;
        }
      }catch(e){}
    }
    // initialize countdown
    initCountdown(config.eventDateISO);
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
    console.log('Collected form data:', obj);
    return obj;
  }

  function validate(){
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
    // Must have an API endpoint configured that fronts the Lambda (API Gateway)
    if(!config.apiEndpoint){
      showMessage('送信先が設定されていません。config.json の "apiEndpoint" に API Gateway の URL を設定してください。', true);
      $('submit').disabled = false;
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
      $('submit').disabled = false;
    }
  }

  // --- Countdown utility ---
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

  // --- DOMContentLoaded: ページの読み込み完了後に各種機能を初期化 ---
  document.addEventListener('DOMContentLoaded', ()=>{
    console.log('=== DOMContentLoaded fired ===');
    // Start preloading and overlay removal
    removeInitialOverlay();
    loadConfig();

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
    // setupGifReplay('profile-gif'); // TEMPORARILY DISABLED - no image exists
    
    // Profile animation removed - section displays directly
    
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