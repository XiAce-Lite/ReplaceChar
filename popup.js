document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-switch');
  const fontSizeInput = document.getElementById('small-font-size');
  const valignInput = document.getElementById('small-font-valign');
  chrome.storage.sync.get('enabled', ({ enabled }) => {
    toggle.checked = enabled !== false;
  });

  // 極小フォント設定の復元
  chrome.storage.sync.get(['smallFontSize', 'smallFontValign'], (data) => {
    if (data.smallFontSize !== undefined) fontSizeInput.value = data.smallFontSize;
    if (data.smallFontValign !== undefined) valignInput.value = data.smallFontValign;
  });

  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });

  fontSizeInput.addEventListener('change', () => {
    chrome.storage.sync.set({ smallFontSize: fontSizeInput.value });
  });
  valignInput.addEventListener('change', () => {
    chrome.storage.sync.set({ smallFontValign: valignInput.value });
  });
});
