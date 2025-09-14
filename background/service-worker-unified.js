console.log('BlueSea Unified Service Worker starting...');

// 保持Service Worker活跃
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// 扩展的本地翻译字典（作为备用）
const localTranslations = {
  'test': '测试', 'hello': '你好', 'world': '世界', 'computer': '计算机', 'work': '工作',
  'challenge': '挑战', 'trial': '试验', 'examination': '考试', 'enactment': '法令制定',
  'beautiful': '美丽的', 'important': '重要的', 'language': '语言', 'translation': '翻译',
  'dictionary': '字典', 'study': '学习', 'book': '书籍', 'read': '阅读', 'write': '写作',
  'please': '请', 'thank': '谢谢', 'you': '你', 'good': '好的', 'bad': '坏的',
  'make': '制作', 'do': '做', 'go': '去', 'come': '来', 'see': '看见', 'know': '知道',
  'think': '思考', 'say': '说', 'tell': '告诉', 'give': '给', 'take': '拿', 'get': '得到',
  'have': '有', 'want': '想要', 'need': '需要', 'like': '喜欢', 'help': '帮助',
  'try': '尝试', 'use': '使用', 'learn': '学习', 'teach': '教', 'understand': '理解',
  'big': '大的', 'small': '小的', 'new': '新的', 'old': '旧的', 'long': '长的', 'short': '短的',
  'high': '高的', 'low': '低的', 'hot': '热的', 'cold': '冷的', 'fast': '快的', 'slow': '慢的',
  'happy': '快乐的', 'sad': '悲伤的', 'easy': '容易的', 'difficult': '困难的', 'hard': '困难的',
  'time': '时间', 'day': '天', 'year': '年', 'home': '家', 'school': '学校', 'life': '生活',
  'people': '人们', 'person': '人', 'man': '男人', 'woman': '女人', 'child': '孩子',
  'place': '地方', 'thing': '东西', 'way': '方法', 'water': '水', 'food': '食物'
};

// 缓存
const translationCache = new Map();

// Google Translate免费API（使用公开端点）
async function translateWithGoogle(text) {
  try {
    // 使用Google Translate的公开API端点
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh&dt=t&q=${encodeURIComponent(text)}`;
    
    console.log(`Trying Google Translate for: ${text}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Google Translate返回的格式：[[[翻译结果, 原文, null, null, 0]], null, "en"]
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translation = data[0][0][0];
        console.log(`Google Translate success: ${text} -> ${translation}`);
        return translation;
      }
    }
  } catch (error) {
    console.warn('Google Translate failed:', error);
  }
  
  throw new Error('Google Translate failed');
}

// 备用翻译方法：使用Microsoft Translator（免费）
async function translateWithMicrosoft(text) {
  try {
    // Microsoft Translator的公开API（有限制但免费）
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    
    console.log(`Trying Microsoft Translator for: ${text}`);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.responseData && data.responseData.translatedText) {
        const translation = data.responseData.translatedText;
        console.log(`Microsoft Translator success: ${text} -> ${translation}`);
        return translation;
      }
    }
  } catch (error) {
    console.warn('Microsoft Translator failed:', error);
  }
  
  throw new Error('Microsoft Translator failed');
}

// 智能翻译函数
async function getTranslation(text) {
  const lowerText = text.toLowerCase().trim();
  
  // 1. 检查本地字典
  if (localTranslations[lowerText]) {
    console.log(`Local translation: ${lowerText} -> ${localTranslations[lowerText]}`);
    return localTranslations[lowerText];
  }
  
  // 2. 检查缓存
  if (translationCache.has(lowerText)) {
    const cached = translationCache.get(lowerText);
    console.log(`Cache hit: ${lowerText} -> ${cached}`);
    return cached;
  }
  
  // 3. 尝试在线翻译
  const translationMethods = [translateWithGoogle, translateWithMicrosoft];
  
  for (const method of translationMethods) {
    try {
      const translation = await method(text);
      if (translation && translation !== text) {
        translationCache.set(lowerText, translation);
        return translation;
      }
    } catch (error) {
      console.warn(`Translation method failed:`, error);
      continue;
    }
  }
  
  // 4. 如果所有方法都失败，返回原文
  console.warn(`No translation found for: ${text}`);
  return text;
}

// Free Dictionary API调用
async function fetchFromFreeDictionaryAPI(word) {
  try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    console.log(`Fetching dictionary data for: ${word}`);
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Dictionary API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Dictionary API failed:', error);
    throw error;
  }
}

// 转换并统一数据格式
async function createUnifiedWordData(word, apiData = null) {
  console.log(`Creating unified data for: ${word}`);
  
  // 获取中文翻译
  const translation = await getTranslation(word);
  
  let phonetics = { us: '', uk: '' };
  let audioUrls = { us: '', uk: '' };
  let explains = [];
  let partOfSpeeches = [];
  
  if (apiData && Array.isArray(apiData) && apiData.length > 0) {
    const entry = apiData[0];
    
    // 提取音标和音频
    const phoneticData = entry.phonetics || [];
    phoneticData.forEach(p => {
      const text = p.text || '';
      const audio = p.audio || '';
      
      if (audio.includes('us') || audio.includes('US')) {
        phonetics.us = text;
        audioUrls.us = audio;
      } else if (audio.includes('uk') || audio.includes('UK')) {
        phonetics.uk = text;
        audioUrls.uk = audio;
      } else if (!phonetics.us && text) {
        phonetics.us = text;
        if (audio) audioUrls.us = audio;
      }
    });
    
    if (!phonetics.uk && phonetics.us) phonetics.uk = phonetics.us;
    if (!phonetics.us && phonetics.uk) phonetics.us = phonetics.uk;
    
    // 提取释义和词性
    const meanings = entry.meanings || [];
    for (const meaning of meanings.slice(0, 3)) {
      const pos = meaning.partOfSpeech || '';
      if (pos && !partOfSpeeches.includes(pos)) {
        partOfSpeeches.push(pos);
      }
      
      const definitions = meaning.definitions || [];
      for (const def of definitions.slice(0, 2)) {
        if (def.definition) {
          let explainText = '';
          if (pos) explainText += `${pos}. `;
          explainText += def.definition;
          
          // 尝试翻译释义
          try {
            const defTranslation = await getTranslation(def.definition);
            if (defTranslation !== def.definition && defTranslation !== word) {
              explainText += ` (${defTranslation})`;
            }
          } catch (error) {
            console.warn('Failed to translate definition');
          }
          
          explains.push(explainText);
        }
      }
    }
  }
  
  // 如果没有API数据，创建基本结构
  if (explains.length === 0) {
    explains.push(`${word} (${translation})`);
  }
  
  if (partOfSpeeches.length === 0) {
    partOfSpeeches.push('noun');
  }
  
  // 如果没有音频，使用有道音频（优先英式发音）
  if (!audioUrls.uk) {
    audioUrls.uk = `https://dict.youdao.com/dictvoice?audio=${word}&type=2`;
  }
  if (!audioUrls.us) {
    audioUrls.us = `https://dict.youdao.com/dictvoice?audio=${word}&type=1`;
  }
  
  return {
    query: word,
    translation: [translation],
    basic: {
      'us-phonetic': phonetics.us.replace(/[\/\[\]]/g, ''),
      'uk-phonetic': phonetics.uk.replace(/[\/\[\]]/g, ''),
      explains: explains,
      phonetic: phonetics.us.replace(/[\/\[\]]/g, '')
    },
    audioUrls: audioUrls,
    partOfSpeeches: partOfSpeeches,
    source: apiData ? 'dictionary-api-with-translation' : 'translation-only',
    timestamp: Date.now()
  };
}

// 主要的翻译处理函数
async function handleTranslation(word) {
  console.log(`Starting unified translation for: ${word}`);
  
  try {
    // 尝试获取完整的字典数据
    let apiData = null;
    try {
      apiData = await fetchFromFreeDictionaryAPI(word);
      console.log('Dictionary API successful');
    } catch (error) {
      console.warn('Dictionary API failed, using translation only');
    }
    
    // 创建统一的数据结构
    const result = await createUnifiedWordData(word, apiData);
    console.log('Unified translation result:', result);
    return result;
    
  } catch (error) {
    console.error('Translation completely failed:', error);
    
    // 最后的备用方案
    return {
      query: word,
      translation: [word],
      basic: {
        'us-phonetic': '',
        'uk-phonetic': '',
        explains: [`${word} 的释义（暂无翻译）`],
        phonetic: ''
      },
      audioUrls: {
        us: `https://dict.youdao.com/dictvoice?audio=${word}&type=1`,
        uk: `https://dict.youdao.com/dictvoice?audio=${word}&type=2`
      },
      partOfSpeeches: ['noun'],
      source: 'fallback',
      timestamp: Date.now()
    };
  }
}

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  const { type, payload } = message;
  
  if (type === 'tf') {
    console.log(`Translation request for: "${payload}"`);
    
    // 异步处理但确保响应
    handleTranslation(payload)
      .then(result => {
        console.log('Translation completed:', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Translation failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // 保持消息通道开放
  }
  
  if (type === 'calcEls') {
    sendResponse({ success: true, data: [] });
    return false;
  }
  
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

console.log('BlueSea Unified Service Worker loaded successfully!');
