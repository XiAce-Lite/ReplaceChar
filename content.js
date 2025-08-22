// content.js
function replaceChordSpanText() {
  const chordSpans = document.querySelectorAll('span.chord');

  chordSpans.forEach(span => {
    // outerHTML ではなく属性・テキストで判定
    if (
      span.classList.contains('chord') &&
      span.textContent.trim() === '|' &&
      span.getAttribute('onclick') === "javascript:popupImage('/cd/|.png', event);"
    ) {
      const parent = span.parentNode;
      const isFirstChild = parent && parent.firstElementChild === span;

      if (isFirstChild) {
        span.outerHTML = `<span class="wordtop">| </span>`;
      } else {
        span.outerHTML = `<span class="word">| </span>`;
      }
    } else {
      span.textContent = span.textContent
        .replace(/\((?:[#b]?\d+(?:[,.][#b]?\d+)*)\)/g, match => {
          return '{' + match.slice(1, -1) + '}';
        });
    }
  });

  // ✅ 追加処理：<p class="line"> の最初の <span> を wordtop にする
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
  // まず同じ親内で直前の兄弟を探す
  let prev = wordtop.previousElementSibling;
  if (prev && prev.classList && prev.classList.contains('word')) {
    return prev;
  }

  // 直前に見つからなければ、親を遡って <p class="line"> を探す
  let parent = wordtop.parentElement;
  while (parent && !parent.matches('p.line')) {
    parent = parent.parentElement;
  }
  if (!parent) return null;

  // 前の段落（p.line）を探す
  let prevP = parent.previousElementSibling;
  while (prevP && !prevP.matches('p.line')) {
    prevP = prevP.previousElementSibling;
  }
  if (!prevP) return null;

  // 前段落内の最後の .word を返す
  const words = prevP.querySelectorAll('span.word');
  return words.length > 0 ? words[words.length - 1] : null;
}

function changeChordFontAndIndent() {
  const chordElements = document.querySelectorAll('span.chord');

  chordElements.forEach(element => {
    const text = element.textContent.trim();

    if (text.includes('=') || text.includes('>') || text.includes('n.c') || text.includes('N.C')) {
      try {
        element.style.cssText += 'font-family: sans-serif !important; font-weight: bold !important; font-size: 16px !important; color: #3273cd !important;';
      } catch (error) {
        console.error('Style setting failed:', error);
      }
    }

    if (text === '|') {
      const prev = element.previousElementSibling;

      if (prev && prev.classList.contains('wordtop')) {
        // wordtop の場合はテキスト追加のみ
        prev.textContent += '| ';
        element.remove();
      } else {
        // それ以外は word に置換
        const newSpan = document.createElement('span');
        newSpan.className = 'word';
        newSpan.textContent = '|';
        element.replaceWith(newSpan);
      }
    }
  });

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
          prevWord.textContent = prevText.slice(0, -1) + " " + cleanedText;
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

removeEmptyWordtopSpans();
changeChordFontAndIndent();
replaceChordSpanText();
