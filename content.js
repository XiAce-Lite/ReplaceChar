// content.js

// MNoto Sans フォント対応部分
function replaceMNotoSansText() {
  const chordSpans = document.querySelectorAll('span.chord');
  chordSpans.forEach(span => {
    // フォント指定（特殊な文字が含まれる場合）
    const text = span.textContent.trim();
    if (text.includes('=') || text.includes('>') || text.includes('n.c') || text.includes('N.C')) {
      try {
        span.style.cssText += 'font-family: sans-serif !important; font-weight: bold !important; font-size: 16px !important; color: #3273cd !important;';
      } catch (error) {
        console.error('Style setting failed:', error);
      }
    }
    // MNoto Sans フォント対応
    if (!(
      span.classList.contains('chord') &&
      span.textContent.trim().includes('|') &&
      span.getAttribute('onclick') && span.getAttribute('onclick').includes('|')
    )) {
      span.textContent = span.textContent
        .replace(/\((?:[#b]?\d+(?:[,.][#b]?\d+)*)\)/g, match => {
          return '{' + match.slice(1, -1) + '}';
        });
    }
  });
}

// <p class="line"> の最初の <span> を wordtop にする処理
function setFirstSpanToWordtop() {
  const lines = document.querySelectorAll('p.line');
  lines.forEach(p => {
    const firstSpan = Array.from(p.children).find(child => child.tagName === 'SPAN');
    if (firstSpan && !firstSpan.classList.contains('wordtop')) {
      firstSpan.classList.add('wordtop');
      firstSpan.classList.remove('word'); // もし word が付いていたら削除
    }
  });
}

// 全角スペース除去＋trimの共通関数
function cleanText(text) {
  return text.replace(/　/g, '').trim();
}

// 全角スペース除去後に空の要素を削除する。
function removeEmptyWordtopSpans() {
  const wordtopSpans = document.querySelectorAll('span.wordtop');

  wordtopSpans.forEach(span => {
  const cleaned = cleanText(span.textContent);
    if (cleaned === '') {
      span.remove();
    }
  });
}

// 指定した要素の直前の .word を探す（段落をまたいで探索）
function findPreviousWordElement(wordtop) {
  // 直前の兄弟をたどり、.wordまたは.wordtopが見つかるまで繰り返す
  let prev = wordtop.previousElementSibling;
  while (prev) {
    if (
      prev.classList &&
      (prev.classList.contains('word') || prev.classList.contains('wordtop'))
    ) {
      return prev;
    }
    prev = prev.previousElementSibling;
  }

  // 直前に見つからなければ、親を遡って <p class="line"> を探す
  let parent = wordtop.parentElement;
  while (parent && !parent.matches('p.line')) {
    parent = parent.parentElement;
  }
  if (!parent) return null;

  // 前の段落（p.line かつ p.comment でない）を探す
  let prevP = parent.previousElementSibling;
  while (prevP && (!prevP.matches('p.line') || prevP.matches('p.comment'))) {
    prevP = prevP.previousElementSibling;
  }
  if (!prevP) return null;

  // 前段落内の最後の .wordまたは.wordtop を返す
  const words = prevP.querySelectorAll('span.word, span.wordtop');
  return words.length > 0 ? words[words.length - 1] : null;
}

// chord spanの|処理と wordtop整理を統合
function processChordBarsAndWordtops() {
  // 1. span.chordの|置換→word or wordtopに要素を変える＝歌詞の行に小節線を移行する。
  const chordSpans = document.querySelectorAll('span.chord');
  chordSpans.forEach(span => {
    if (
      span.classList.contains('chord') &&
      span.textContent.trim().includes('|') &&
      span.getAttribute('onclick') && span.getAttribute('onclick').includes('|')
    ) {
      const parent = span.parentNode;
      const isFirstChild = parent && parent.firstElementChild === span;
      if (isFirstChild) {
        span.outerHTML = `<span class="wordtop">| </span>`;
      } else {
        span.outerHTML = `<span class="word"> | </span>`;
      }
    }
  });

  // 2. 歌詞の行に移行された小節線のスペースを調整する処理
  const chordElements = document.querySelectorAll('span.word, span.wordtop');
  chordElements.forEach(element => {
    const text = element.textContent.trim();
    if (text === '|') {
      const prev = element.previousElementSibling;
      if (prev && prev.classList.contains('wordtop')) {
        prev.textContent += '| ';
        element.remove();
      } else {
        const newSpan = document.createElement('span');
        newSpan.className = 'word';
        newSpan.textContent = ' |';
        element.replaceWith(newSpan);
      }
    }
  });

  // 3. 行頭にはみ出た歌詞を、前の行に移動する処理
  const wordtopElements = document.querySelectorAll('span.wordtop');
  wordtopElements.forEach(wordtop => {
    let cleanedText = cleanText(wordtop.textContent);
    if (cleanedText === '|') {
      wordtop.textContent = '| ';
      return;
    }
    if (cleanedText.length > 1 && cleanedText.endsWith('|') && /[^|]/.test(cleanedText) && !cleanedText.startsWith('|')) {
      let prevWord = findPreviousWordElement(wordtop);
      if (prevWord) {
        let prevText = prevWord.textContent.trim();
        if (prevText.endsWith('|') || (prevText.length === 1 && prevText === '|')) {
          prevWord.textContent = prevText.slice(0, -1) + " " + cleanedText.replace("|", " |");
          console.log("Updated previous word with cleaned text:", prevWord.textContent);
        } else {
          cleanedText = cleanedText.replace("|", "");
          prevWord.textContent += " " + cleanedText;
        }
        wordtop.textContent = "| ";
      }
    }
  });
}

function replaceCharMain() {
  removeEmptyWordtopSpans();
  processChordBarsAndWordtops();
  replaceMNotoSansText(); // MNoto Sans フォント対応とフォント指定
  setFirstSpanToWordtop(); // 最後に実施
}

// ページロード時に有効状態なら実行
chrome.storage.sync.get('enabled', ({ enabled }) => {
  if (enabled !== false) {
    replaceCharMain();
  }
});

// enabledの変化を監視し、即時反映
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.enabled) {
      if (changes.enabled.newValue !== false) {
        replaceCharMain();
      } else {
        location.reload();
      }
    }
  });
}
