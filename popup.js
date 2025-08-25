document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-switch');
  const fontSizeInput = document.getElementById('small-font-size');
  const valignInput = document.getElementById('small-font-valign');
  const labelFontSize = document.getElementById('label-font-size');
  const labelFontValign = document.getElementById('label-font-valign');
  const adjustSwitch = document.getElementById('adjust-chordpos-switch');
  const labelAdjust = document.getElementById('label-adjust-chordpos-main');
  const mnotoSwitch = document.getElementById('mnoto-switch');
  const labelMnoto = document.getElementById('label-mnoto-main');

  chrome.storage.sync.get(['enabled', 'adjustChordPos', 'mnotoEnabled'], (data) => {
    toggle.checked = data.enabled !== false;
    setFontInputsEnabled(toggle.checked);
    adjustSwitch.checked = data.adjustChordPos !== false;
    setAdjustSwitchEnabled(toggle.checked);
    mnotoSwitch.checked = data.mnotoEnabled !== false;
    setMnotoSwitchEnabled(toggle.checked);
  });

  // 極小フォント設定の復元
  chrome.storage.sync.get(['smallFontSize', 'smallFontValign'], (data) => {
    if (data.smallFontSize !== undefined) fontSizeInput.value = data.smallFontSize;
    if (data.smallFontValign !== undefined) valignInput.value = data.smallFontValign;
  });

  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
    setFontInputsEnabled(toggle.checked);
    setAdjustSwitchEnabled(toggle.checked);
    setMnotoSwitchEnabled(toggle.checked);
  });
  mnotoSwitch.addEventListener('change', () => {
    chrome.storage.sync.set({ mnotoEnabled: mnotoSwitch.checked }, () => {
      if (chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });
  function setMnotoSwitchEnabled(enabled) {
    mnotoSwitch.disabled = !enabled;
    if (labelMnoto) labelMnoto.style.color = enabled ? '' : '#aaa';
  }

  adjustSwitch.addEventListener('change', () => {
    chrome.storage.sync.set({ adjustChordPos: adjustSwitch.checked }, () => {
      // 設定変更後にタブをリロード
      if (chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
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

  function setAdjustSwitchEnabled(enabled) {
    adjustSwitch.disabled = !enabled;
    if (labelAdjust) labelAdjust.style.color = enabled ? '' : '#aaa';
  }
});
