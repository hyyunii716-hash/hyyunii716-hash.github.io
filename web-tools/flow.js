// 四個工具共用的上傳、處理與結果流程。所有影像都在瀏覽器本機處理。
(function () {
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  if (!steps.length) return;

  var tool = document.querySelector('main[data-tool]')?.getAttribute('data-tool') || '';
  var timer;
  var files = [];
  var outputBlob = null;
  var outputName = 'abandon-result.png';
  var previewUrls = [];
  var outputPromise = Promise.resolve(null);
  var userPhoto = null;
  var cameraMessage = '';
  var flipImage = null;

  function fitFlipStage() {
    var stage = document.querySelector('[data-flip-stage]');
    if (!stage || !flipImage || !flipImage.naturalWidth || !flipImage.naturalHeight) return;
    var hostWidth = stage.parentElement ? stage.parentElement.clientWidth : 850;
    var ratio = flipImage.naturalWidth / flipImage.naturalHeight;
    var maxWidth = Math.min(850, hostWidth);
    var maxHeight = Math.min(window.innerHeight * 0.68, 720);
    var width = Math.min(maxWidth, maxHeight * ratio);
    stage.style.width = Math.round(width) + 'px';
    stage.style.height = Math.round(width / ratio) + 'px';
  }

  window.addEventListener('resize', fitFlipStage);

  function step(name) {
    return steps.filter(function (item) { return item.getAttribute('data-step') === name; })[0];
  }

  function clearPreviews() {
    previewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    previewUrls = [];
  }

  function show(name) {
    var target = step(name);
    if (!target) return;
    clearTimeout(timer);
    if (name === 'upload') resetFlow();
    steps.forEach(function (item) { item.hidden = item !== target; });
    document.body.classList.toggle('is-remover-result', tool === 'remover' && name === 'download');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var heading = target.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
    var next = target.getAttribute('data-auto');
    if (next) {
      var delay = Number(target.getAttribute('data-ms')) || 3000;
      timer = setTimeout(function () {
        outputPromise.then(function () { show(next); }).catch(function (error) { reportError(error); });
      }, delay);
    }
    if (name === 'download') updateResult();
    if (name === 'startchat') populateGroup();
    if (name === 'ringing') populateRinging();
    if (name === 'call') populateCall();
    if (name === 'removed') populateRemoved();
  }

  function resetFlow() {
    clearPreviews();
    files = [];
    window.abandonUploadFiles = [];
    userPhoto = null;
    cameraMessage = '';
    outputBlob = null;
    outputPromise = Promise.resolve(null);
    document.body.classList.remove('is-remover-result');
    document.body.classList.remove('is-mic-muted', 'is-camera-off');
    var removedTitle = document.querySelector('[data-removed-title]');
    if (removedTitle) removedTitle.textContent = '你已被移出群組';
    var flip = document.querySelector('[data-flip-stage]');
    flipImage = null;
    if (flip) {
      flip.classList.remove('is-flipped');
      flip.style.width = '';
      flip.style.height = '';
    }
    document.querySelectorAll('[data-flip-trigger]').forEach(function (el) { el.hidden = false; });
    document.querySelectorAll('[data-flip-complete]').forEach(function (el) { el.hidden = true; });
    document.querySelectorAll('[data-call-toggle]').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); });
  }

  function reportError(error) {
    var feedback = document.querySelector('[data-upload-feedback]');
    if (feedback) {
      feedback.textContent = '無法讀取這張圖片，請改用 JPG、PNG 或 WebP 檔案。';
      feedback.hidden = false;
    }
    console.error('Abandon image tool:', error);
  }

  function readBitmap(file) {
    if ('createImageBitmap' in window) return createImageBitmap(file, { imageOrientation: 'from-image' });
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
  }

  function canvasBlob(canvas, type) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('無法輸出圖片')); }, type || 'image/png');
    });
  }

  function canvasFor(bitmap, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width || bitmap.width;
    canvas.height = height || bitmap.height;
    var context = canvas.getContext('2d', { willReadFrequently: tool === 'remover' });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function prepareOutput() {
    if (!files.length) return Promise.resolve(null);
    var file = files[0];
    if (tool === 'remover') {
      outputName = file.name;
      outputBlob = file;
      return Promise.resolve(file);
    }
    outputName = 'abandon-' + tool + '-' + file.name.replace(/\.[^.]+$/, '') + '.png';
    if (tool === 'group') return Promise.resolve(null);
    return readBitmap(file).then(function (bitmap) {
      var canvas;
      if (tool === 'compress') {
        canvas = canvasFor(bitmap, bitmap.width, Math.max(1, Math.round(bitmap.height * 0.2)));
      } else {
        canvas = canvasFor(bitmap);
        if (tool === 'flip') {
          var context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        }
      }
      return canvasBlob(canvas, 'image/png').then(function (blob) {
        outputBlob = blob;
        bitmap.close?.();
        return blob;
      });
    });
  }

  function makeImage(file, className) {
    var image = document.createElement('img');
    var url = URL.createObjectURL(file);
    previewUrls.push(url);
    image.src = url;
    image.alt = file.name || '使用者照片';
    image.className = className || '';
    return image;
  }

  function updateResult() {
    var preview = document.querySelector('[data-result-preview]');
    if (preview && files[0]) {
      var resultFile = outputBlob && !(outputBlob instanceof File) ? new File([outputBlob], outputName, { type: 'image/png' }) : (outputBlob || files[0]);
      preview.replaceChildren(makeImage(resultFile, 'result-preview__image'));
      preview.classList.toggle('is-checkerboard', tool === 'remover');
      preview.classList.toggle('is-flattened', tool === 'compress');
    }
    if (tool === 'flip' && files[0]) {
      var front = document.querySelector('[data-flip-front]');
      if (front) {
        flipImage = makeImage(files[0], 'flip-card__image');
        front.replaceChildren(flipImage);
        if (flipImage.complete) fitFlipStage();
        else flipImage.addEventListener('load', fitFlipStage, { once: true });
      }
    }
  }

  function photoSlot(container, file, className, label) {
    var slot = document.createElement('span');
    slot.className = className;
    slot.setAttribute('aria-label', label || (file && file.name) || '圖片位置');
    if (file) slot.appendChild(makeImage(file, 'group-upload-image'));
    return slot;
  }

  function populateGroup() {
    var avatars = document.querySelector('[data-group-avatars]');
    if (avatars) {
      avatars.replaceChildren();
      files.forEach(function (file) { avatars.appendChild(photoSlot(avatars, file, 'avatar')); });
      avatars.appendChild(photoSlot(avatars, userPhoto, 'avatar avatar--self-photo', '您的相機照片'));
    }
    var names = document.querySelector('[data-group-names]');
    if (names) names.textContent = files.map(function (file) { return file.name; }).join(', ');
    var selfAvatar = document.querySelector('[data-group-self]');
    if (selfAvatar) {
      selfAvatar.replaceChildren();
      if (files[0]) selfAvatar.appendChild(makeImage(files[0], 'group-upload-image'));
    }
    var message = document.querySelector('[data-camera-feedback]');
    if (message) message.textContent = cameraMessage;
  }

  function populateRinging() {
    var avatars = document.querySelector('[data-ringing-avatars]');
    if (avatars) {
      avatars.replaceChildren();
      files.forEach(function (file) { avatars.appendChild(photoSlot(avatars, file, 'avatar')); });
    }
  }

  function populateCall() {
    var tiles = document.querySelector('[data-call-tiles]');
    if (tiles) {
      tiles.replaceChildren();
      var count = Math.min(files.length, 4);
      tiles.classList.remove('call-tiles--1', 'call-tiles--2', 'call-tiles--3', 'call-tiles--4');
      if (count) tiles.classList.add('call-tiles--' + count);
      files.slice(0, 4).forEach(function (file) { tiles.appendChild(photoSlot(tiles, file, 'tile', file.name)); });
    }
    var self = document.querySelector('[data-call-self]');
    if (self) {
      self.querySelectorAll('.call-self__image').forEach(function (image) { image.remove(); });
      if (userPhoto) self.prepend(makeImage(userPhoto, 'call-self__image'));
    }
  }

  function populateRemoved() {
    var avatars = document.querySelector('[data-removed-avatars]');
    if (avatars) {
      avatars.replaceChildren();
      files.forEach(function (file) { avatars.appendChild(photoSlot(avatars, file, 'avatar')); });
    }
    var selfAvatar = document.querySelector('[data-removed-self]');
    if (selfAvatar) {
      selfAvatar.replaceChildren();
      if (files[0]) selfAvatar.appendChild(makeImage(files[0], 'group-upload-image'));
    }
    var names = document.querySelector('[data-removed-names]');
    if (names) names.textContent = files.map(function (file) { return file.name; }).join(', ') + ' 沒有您';
  }

  function captureCameraPhoto() {
    cameraMessage = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraMessage = '請在安全連線中開啟相機權限，才能加入您的照片。';
      return Promise.resolve(null);
    }
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function (stream) {
      var video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      return video.play().then(function () {
        return new Promise(function (resolve, reject) {
          function takePhoto() {
            if (!video.videoWidth || !video.videoHeight) { requestAnimationFrame(takePhoto); return; }
            var canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            canvasBlob(canvas, 'image/jpeg').then(function (blob) {
              userPhoto = blob;
              resolve(blob);
            }, reject);
          }
          requestAnimationFrame(takePhoto);
        });
      }).finally(function () { stream.getTracks().forEach(function (track) { track.stop(); }); });
    }).catch(function () {
      cameraMessage = '相機未開啟，請允許相機權限以加入您的照片。';
      return null;
    });
  }

  function setupUpload() {
    var uploadStep = step('upload');
    if (!uploadStep) return;
    var trigger = uploadStep.querySelector('[data-upload-trigger]');
    var input = uploadStep.querySelector('[data-file-input]');
    var feedback = uploadStep.querySelector('[data-upload-feedback]');
    if (!trigger || !input) return;
    var maxFiles = Number(input.getAttribute('data-max-files')) || 1;
    var maxBytes = (Number(input.getAttribute('data-max-size-mb')) || 50) * 1024 * 1024;
    var dragDepth = 0;

    function report(message) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.hidden = !message;
    }
    function isImage(file) {
      return (file.type && file.type.indexOf('image/') === 0) || /\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/i.test(file.name);
    }
    function acceptFiles(fileList) {
      var selected = Array.prototype.slice.call(fileList || []);
      if (!selected.length) return;
      if (selected.length > maxFiles) { report('最多可選擇 ' + maxFiles + ' 張圖片。'); input.value = ''; return; }
      if (selected.some(function (file) { return !isImage(file); })) { report('請選擇圖片檔案。'); input.value = ''; return; }
      if (selected.some(function (file) { return file.size > maxBytes; })) { report('每張圖片大小不可超過 ' + Math.round(maxBytes / 1024 / 1024) + ' MB。'); input.value = ''; return; }
      report('');
      clearPreviews();
      files = selected;
      window.abandonUploadFiles = files;
      input.value = '';
      outputBlob = null;
      outputPromise = prepareOutput();
      outputPromise.catch(reportError);
      if (tool === 'group') {
        captureCameraPhoto().then(function () {
          if (!step('startchat')?.hidden) populateGroup();
          if (!step('call')?.hidden) populateCall();
        });
      }
      if (tool === 'flip') show('download');
      else show('processing');
    }

    trigger.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { acceptFiles(input.files); });
    trigger.addEventListener('dragenter', function (event) { event.preventDefault(); dragDepth++; trigger.classList.add('is-dragover'); });
    trigger.addEventListener('dragover', function (event) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; trigger.classList.add('is-dragover'); });
    trigger.addEventListener('dragleave', function (event) { event.preventDefault(); dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) trigger.classList.remove('is-dragover'); });
    trigger.addEventListener('drop', function (event) { event.preventDefault(); dragDepth = 0; trigger.classList.remove('is-dragover'); acceptFiles(event.dataTransfer && event.dataTransfer.files); });
  }

  setupUpload();

  document.addEventListener('click', function (event) {
    var hangup = event.target.closest('[data-call-hangup]');
    if (hangup) {
      var removedTitle = document.querySelector('[data-removed-title]');
      if (removedTitle) removedTitle.textContent = '你已被移出群組';
      show('removed');
      return;
    }
    var flip = event.target.closest('[data-flip-trigger]');
    if (flip) {
      var stage = document.querySelector('[data-flip-stage]');
      if (stage) stage.classList.add('is-flipped');
      flip.hidden = true;
      document.querySelectorAll('[data-flip-complete]').forEach(function (el) { el.hidden = false; });
      return;
    }
    var toggle = event.target.closest('[data-call-toggle]');
    if (toggle) {
      var state = toggle.getAttribute('data-call-toggle');
      var pressed = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(pressed));
      document.body.classList.toggle(state === 'mic' ? 'is-mic-muted' : 'is-camera-off', pressed);
      return;
    }
    var go = event.target.closest('[data-goto]');
    if (go) { show(go.getAttribute('data-goto')); return; }
    var download = event.target.closest('[data-download]');
    if (download) {
      outputPromise.then(function (blob) {
        if (!blob) throw new Error('尚未產生可下載的圖片');
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = outputName;
        link.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      }).catch(reportError);
    }
  });
})();
