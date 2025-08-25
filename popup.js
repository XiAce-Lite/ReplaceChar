document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-switch');
  const fontSizeInput = document.getElementById('small-font-size');
  const valignInput = document.getElementById('small-font-valign');
  const labelFontSize = document.getElementById('label-font-size');
  const labelFontValign = document.getElementById('label-font-valign');

  chrome.storage.sync.get('enabled', ({ enabled }) => {
    toggle.checked = enabled !== false;
    setFontInputsEnabled(toggle.checked);
  });

  // 極小フォント設定の復元
  chrome.storage.sync.get(['smallFontSize', 'smallFontValign'], (data) => {
    if (data.smallFontSize !== undefined) fontSizeInput.value = data.smallFontSize;
    if (data.smallFontValign !== undefined) valignInput.value = data.smallFontValign;
  });

  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
    setFontInputsEnabled(toggle.checked);
  });

  fontSizeInput.addEventListener('change', () => {
    chrome.storage.sync.set({ smallFontSize: fontSizeInput.value });
  });
  valignInput.addEventListener('change', () => {
    chrome.storage.sync.set({ smallFontValign: valignInput.value });
  });

  function setFontInputsEnabled(enabled) {
    fontSizeInput.disabled = !enabled;
    valignInput.disabled = !enabled;
    if (labelFontSize) labelFontSize.style.color = enabled ? '' : '#aaa';
    if (labelFontValign) labelFontValign.style.color = enabled ? '' : '#aaa';
  }
});
