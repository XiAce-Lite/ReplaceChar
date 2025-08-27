// コードとして成立するもの（m7-5, m9-5, D#m7-5 なども許可）
// 複数の括弧付きテンションにも対応
const chordAllowed = /^[A-G](#|b)?((m|M|maj|min|sus[0-9]*|add[0-9]*|dim|aug)?[0-9]*(?:-[0-9]+)?)(?:\([^)]+\)|\{[^}]+\})*(?:\/[A-G](#|b)?(?:\([^)]+\)|\{[^}]+\})*)?$/i;
// 極小フォント設定のデフォルト
let SMALL_FONT_SIZE = 14;
let SMALL_FONT_VALIGN = 7;

// span.chordの直後のspan.word/wordtopの左位置が大きくずれている場合、近づける
function adjustWordLeftToChord() {
  const chordSpans = document.querySelectorAll('span.chord');
  chordSpans.forEach(chord => {
    // 次の兄弟要素でspan.wordまたはspan.wordtopを探す
    let next = chord.nextElementSibling;
    while (next && !(next.classList && (next.classList.contains('word') || next.classList.contains('wordtop')))) {
      next = next.nextElementSibling;
  }
  if (!next) return;
  // テキストが空、または > と - のみ（複合・連続含む）、または1文字のみなら対象外
  const trimmed = next.textContent.trim();
  if (trimmed === '' || /^([>\-]+)$/.test(trimmed) || trimmed.length === 1) return;

  // span.chordのテキストがコード名の場合のみ調整
  if (!chordAllowed.test(chord.textContent.trim())) return;
    // 位置取得
    const chordLeft = chord.getBoundingClientRect().left;
    const wordLeft = next.getBoundingClientRect().left;
    const diff = wordLeft - chordLeft;
    // ずれが20px以上なら、diffの半分だけ近づける。ただし連続するchord間は1.5rem(24px)以上空ける
    if (diff > 20) {
      const minChordGap = 24; // 1.5rem=24px想定
      let allowShift = true;
      let nextChord = next.nextElementSibling;
      while (nextChord && !(nextChord.classList && nextChord.classList.contains('chord'))) {
        nextChord = nextChord.nextElementSibling;
      }
      if (nextChord) {
        const nextChordLeft = nextChord.getBoundingClientRect().left;
            const newWordLeft = wordLeft + (-diff * 0.75);
        if (nextChordLeft - newWordLeft < minChordGap) {
          allowShift = false;
        }
      }
      if (allowShift) {
            let shift = -diff * 0.75;
        if (Math.abs(shift) > 20) {
          shift = shift < 0 ? -16 : 16;
        }
        const currentMargin = parseFloat(window.getComputedStyle(next).marginLeft) || 0;
        next.style.marginLeft = (currentMargin + shift) + 'px';
      }
    }
  });
}

// 設定をchrome.storageから取得
function loadSmallFontSettings(callback) {
  chrome.storage && chrome.storage.sync.get(['smallFontSize', 'smallFontValign'], (data) => {
    SMALL_FONT_SIZE = Number(data.smallFontSize) || 14;
    SMALL_FONT_VALIGN = Number(data.smallFontValign) || 7;
    if (callback) callback();
  });
}
// content.js

// MNoto Sans フォント対応部分
function replaceMNotoSansText() {
  const chordSpans = document.querySelectorAll('span.chord');
    chordSpans.forEach(span => {
      // 半角・全角スペースで分割
      const parts = span.textContent.split(/[ 　]+/).filter(s => s !== '');
      let fragment = document.createDocumentFragment();
      parts.forEach((part, idx1) => {
        // コード部分と非コード部分をさらに分割
        // 先頭からコード部分を抽出
        let rest = part;
        let match = rest.match(/^([A-G](#|b)?((m|M|maj|min|sus|add|dim|aug)?[0-9]*(?:-[0-9]+)?)(?:\([^)]+\)|\{[^}]+\})*(?:\/[A-G](#|b)?(?:\([^)]+\)|\{[^}]+\})*)?)/i);
        if (match && match[0].length > 0) {
          // コード部分
          const codeSpan = document.createElement('span');
          codeSpan.className = 'chord';
          codeSpan.textContent = match[0];
          fragment.appendChild(codeSpan);
          rest = rest.slice(match[0].length);
        }
        // 残りがあれば（記号等）
        if (rest.length > 0) {
          const specialSpan = document.createElement('span');
          specialSpan.className = 'chord';
          specialSpan.textContent = rest;
          fragment.appendChild(specialSpan);
        }
        // スペース挿入（最後以外）
        if (idx1 < parts.length - 1) fragment.appendChild(document.createTextNode(' '));
      });
      span.replaceWith(fragment);
  });

  // 2回目: 分割後の全span.chordに対してフォント指定等の処理
  const chordSpans2 = document.querySelectorAll('span.chord');
  chordSpans2.forEach(span => {
    const text = span.textContent.trim();
    const specialSymbols = ['-', '=', '>', '≫', '≧', 'n.c', 'N.C','＞'];
    const onlyTildeOrSpace = /^[~\s]+$/.test(text);
    if (onlyTildeOrSpace) console.log("only tilde or space:", onlyTildeOrSpace, text);
    if ((specialSymbols.some(s => text.includes(s)) && !chordAllowed.test(text)) || onlyTildeOrSpace) {
      try {
        span.style.cssText += 'font-family: "Arial Narrow", Arial, "Roboto Condensed", "Helvetica Neue Condensed" !important; color: #3273cd !important;';
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
        .replace(/\((?:[#b+\-]?\d+(?:[,.][#b+\-]?\d+)*)\)/g, match => {
          // ()内に7が含まれる場合は7を'に変換し、{}で囲む
          if (/7/.test(match)) {
            return '{' + match.slice(1, -1).replace(/7/g, "'") + '}';
          }
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
      // 先頭の半角スペースを除去
      if (typeof firstSpan.textContent === 'string') {
        firstSpan.textContent = firstSpan.textContent.replace(/^\s+/, '');
      }
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
    const text = span.textContent.trim();

    // ->≧=≫ のいずれかのみで構成され、かつコード名として認識されない場合は極小フォント
    if (/^[\-≧=≫>]+$/.test(text) && !chordAllowed.test(text)) {
      // 極小フォント＋指定px上に表示
      span.style.setProperty('font-size', SMALL_FONT_SIZE + 'px', 'important');
      span.style.setProperty('vertical-align', SMALL_FONT_VALIGN + 'px', 'important');
    }

    if (
      span.classList.contains('chord') &&
      text.includes('|') &&
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
        // 末尾にテキストノードで'| 'を追加
        prev.appendChild(document.createTextNode('| '));
        element.remove();
      } else {
        const newSpan = document.createElement('span');
        newSpan.className = 'word';
        newSpan.appendChild(document.createTextNode(' |'));
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
        // 子要素ごとfragmentで移動
        const fragment = document.createDocumentFragment();
        while (wordtop.firstChild) {
          fragment.appendChild(wordtop.firstChild);
        }

        // 末尾が|のテキストノードのみを部分的に置換し、子要素は絶対に消さない
        let lastTextNode = null;
        for (let i = prevWord.childNodes.length - 1; i >= 0; i--) {
          const node = prevWord.childNodes[i];
          if (node.nodeType === 3 && /\|\s*$/.test(node.textContent)) {
            lastTextNode = node;
            break;
          }
        }
        if (lastTextNode) {
          // |を除去しスペース2つに置換
          lastTextNode.textContent = lastTextNode.textContent.replace(/\|\s*$/, '  ');
          // テキストノードの直後にfragmentをinsert
          if (lastTextNode.nextSibling) {
            prevWord.insertBefore(fragment, lastTextNode.nextSibling);
          } else {
            prevWord.appendChild(fragment);
          }
        } else {
          prevWord.appendChild(document.createTextNode(' '));
          prevWord.appendChild(fragment);
        }
        // wordtopを完全に空にしてから'| 'を追加
        while (wordtop.firstChild) wordtop.removeChild(wordtop.firstChild);
        wordtop.appendChild(document.createTextNode('| '));
      }
    }
  });
}



function replaceCharMain(adjustChordPos = true, mnotoEnabled = true) {
  removeEmptyWordtopSpans();
  processChordBarsAndWordtops();
  if (mnotoEnabled) replaceMNotoSansText(); // MNoto Sans フォント対応とフォント指定
  setFirstSpanToWordtop();
  if (adjustChordPos) adjustWordLeftToChord(); // 位置調整を最後に実施
}

// ページロード時に有効状態なら実行
chrome.storage.sync.get(['enabled', 'adjustChordPos', 'mnotoEnabled'], ({ enabled, adjustChordPos, mnotoEnabled }) => {
  if (enabled !== false) {
    loadSmallFontSettings(() => replaceCharMain(adjustChordPos !== false, mnotoEnabled !== false));
  }
});

// enabledやフォント設定、adjustChordPosの変化を監視し、即時反映
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      let adjustChordPos, mnotoEnabled;
      if (changes.adjustChordPos) {
        adjustChordPos = changes.adjustChordPos.newValue !== false;
      }
      if (changes.mnotoEnabled) {
        mnotoEnabled = changes.mnotoEnabled.newValue !== false;
      }
      if (changes.enabled) {
        if (changes.enabled.newValue !== false) {
          chrome.storage.sync.get(['adjustChordPos', 'mnotoEnabled'], ({ adjustChordPos, mnotoEnabled }) => {
            loadSmallFontSettings(() => replaceCharMain(adjustChordPos !== false, mnotoEnabled !== false));
          });
        } else {
          location.reload();
        }
      } else if (changes.smallFontSize || changes.smallFontValign || changes.adjustChordPos || changes.mnotoEnabled) {
        chrome.storage.sync.get(['adjustChordPos', 'mnotoEnabled'], ({ adjustChordPos, mnotoEnabled }) => {
          loadSmallFontSettings(() => replaceCharMain(adjustChordPos !== false, mnotoEnabled !== false));
        });
      }
    }
  });
}
