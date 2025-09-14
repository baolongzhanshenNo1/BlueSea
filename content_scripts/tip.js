// 注册html组件
document.addEventListener('DOMContentLoaded', () => {
  fetch(chrome.runtime.getURL('content_scripts/d-loading.html'))
    .then((raw) => raw.text())
    .then((res) => {
      let fragment = document.createElement('div');
      fragment.innerHTML = res;
      class DLoading extends HTMLElement {
        constructor() {
          super();
          var shadow = this.attachShadow({ mode: 'closed' });
          var content = fragment.childNodes[0].content.cloneNode(true);
          shadow.appendChild(content);
        }
      }
      window.customElements.define('d-loading', DLoading);
    });
});

function setPos(boxWrap, rangeRect) {
  // 设定位置
  document.documentElement.appendChild(boxWrap);
  
  // 限制tooltip最大宽度
  boxWrap.style.maxWidth = '350px';
  boxWrap.style.width = 'auto';
  
  // 强制重新计算尺寸
  boxWrap.offsetHeight;
  
  const containerWidth = Math.min(boxWrap.offsetWidth, 350);
  const containerHeight = boxWrap.offsetHeight;
  const rangeWidth = rangeRect.right - rangeRect.left;
  const rangeLeft = rangeRect.left + window.pageXOffset;
  const rangeTop = rangeRect.top + window.pageYOffset;
  
  // 计算选中文字的中心点
  const rangeCenterX = rangeLeft + rangeWidth / 2;
  
  // 弹窗理想位置：以选中文字为中心
  let containerLeft = rangeCenterX - containerWidth / 2;
  
  // 记录原始的中心位置，用于箭头定位
  const originalCenterX = rangeCenterX;
  
  // 获取视窗尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportLeft = window.pageXOffset;
  const viewportTop = window.pageYOffset;
  const margin = 15; // 距离边界的最小间距
  
  // 水平边界检查和调整
  if (containerLeft < viewportLeft + margin) {
    containerLeft = viewportLeft + margin;
  } else if (containerLeft + containerWidth > viewportLeft + viewportWidth - margin) {
    containerLeft = viewportLeft + viewportWidth - containerWidth - margin;
  }

  // 计算箭头相对于弹窗的偏移
  const arrowOffset = originalCenterX - containerLeft;
  const arrowOffsetPercent = Math.max(15, Math.min(85, (arrowOffset / containerWidth) * 100));

  // 垂直位置计算
  let pos;
  let isBottom = false;
  
  // 优先选择显示在上方还是下方
  const spaceAbove = rangeRect.top - viewportTop;
  const spaceBelow = viewportTop + viewportHeight - rangeRect.bottom;
  
  if (spaceAbove >= containerHeight + 15 && spaceAbove >= spaceBelow) {
    // 显示在上方
    pos = {
      left: containerLeft,
      top: rangeTop - containerHeight - 10,
    };
    isBottom = false;
  } else if (spaceBelow >= containerHeight + 15) {
    // 显示在下方
    pos = {
      left: containerLeft,
      top: rangeTop + rangeRect.height + 10,
    };
    isBottom = true;
  } else {
    // 空间不够，选择空间更大的一边，并限制高度
    if (spaceBelow >= spaceAbove) {
      // 下方显示，限制高度
      const maxHeight = spaceBelow - 20;
      boxWrap.style.maxHeight = maxHeight + 'px';
      boxWrap.style.overflowY = 'auto';
      pos = {
        left: containerLeft,
        top: rangeTop + rangeRect.height + 10,
      };
      isBottom = true;
    } else {
      // 上方显示，限制高度
      const maxHeight = spaceAbove - 20;
      boxWrap.style.maxHeight = maxHeight + 'px';
      boxWrap.style.overflowY = 'auto';
      pos = {
        left: containerLeft,
        top: viewportTop + 10,
      };
      isBottom = false;
    }
  }

  // 设置弹窗位置
  boxWrap.style.left = pos.left + 'px';
  boxWrap.style.top = pos.top + 'px';
  boxWrap.style.bottom = 'auto'; // 清除可能的bottom设置
  
  // 调整箭头位置和方向
  const arrow = boxWrap.querySelector('[data-arrow]');
  if (arrow) {
    arrow.style.left = arrowOffsetPercent + '%';
    arrow.style.transform = 'translateX(-50%) rotate(45deg)';
    
    // 根据tooltip位置调整箭头方向
    if (isBottom) {
      arrow.style.top = '-4px';
      arrow.style.bottom = 'auto';
    } else {
      arrow.style.bottom = '-4px';
      arrow.style.top = 'auto';
    }
  }
  
  console.log(`Tooltip positioned: left=${pos.left}, top=${pos.top}, arrow=${arrowOffsetPercent}%, isBottom=${isBottom}`);
}

const forPhonetic = (text) => {
  if (!text) {
    return '';
  }
  return text.split(';')[0].split(',')[0];
};

// 音频播放函数
const playAudio = (audioUrl) => {
  if (!audioUrl) {
    console.warn('No audio URL provided');
    return;
  }
  
  try {
    console.log('Playing audio:', audioUrl);
    const audio = new Audio(audioUrl);
    audio.volume = 0.7;
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      // 如果原始URL失败，尝试通过代理播放
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${audioUrl}`;
      const proxyAudio = new Audio(proxyUrl);
      proxyAudio.volume = 0.7;
      proxyAudio.play().catch(err => {
        console.error('Proxy audio also failed:', err);
      });
    });
    
    audio.play().catch(error => {
      console.error('Direct audio playback failed:', error);
    });
  } catch (error) {
    console.error('Audio creation error:', error);
  }
};

function makeTipEl(root, options, isBottom) {
  const App = () => {
    // 仅单词时发音
    const isOneWord = options.text.split(' ').length === 1;

    const audioRef = useRef();
    const [tfData, setTfData] = useState(null);
    const [ableTranslation, setAbleTranslation] = useState(true); // 强制启用翻译用于调试
    
    console.log('Tip component initialized:', {
      text: options.text,
      isOneWord,
      ableTranslation
    });

    useEffect(() => {
      if (ableTranslation) {
        // 防止重复请求的标识
        const requestId = `${options.text}-${Date.now()}`;
        console.log(`Starting translation request [${requestId}] for:`, options.text);
        
        // 设置加载状态
        setTfData({ loading: true });
        
        const startTime = Date.now();
        
        try {
          chrome.runtime.sendMessage(
            { type: 'tf', payload: options.text },
            (response) => {
              const endTime = Date.now();
              console.log(`Translation completed [${requestId}] in ${endTime - startTime}ms`);
              
              if (chrome.runtime.lastError) {
                console.error(`Chrome runtime error [${requestId}]:`, chrome.runtime.lastError.message);
                setTfData(null);
                return;
              }
              
              console.log(`Translation response [${requestId}]:`, response);
              if (response && response.success) {
                setTfData(response.data);
              } else {
                console.error(`Translation failed [${requestId}]:`, response?.error || 'Unknown error');
                setTfData(null);
              }
            }
          );
        } catch (error) {
          console.error(`Message send error [${requestId}]:`, error);
          setTfData(null);
        }
      }
    }, [ableTranslation, options.text]); // 添加options.text依赖

    const config = bluesea.useConfig();

    if (!ableTranslation) {
      return html`<div
        style="
      position: relative;
      border-radius: 4px;
      font-size: 14px;
      color: #222;
      box-sizing: border-box;
      min-height: 130px;
    "
      >
        <div
          style="position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: ${isBottom ? '0' : 'initial'};
        width: 36px;
        height: 24px;
        line-height: 24px;
        background: #f5f5d5;
        text-align: center;
        cursor: pointer;
        border-radius: 2px;
        border: 1px solid #444;"
          onClick=${() => {
            setAbleTranslation(true);
          }}
        >
          译
        </div>
        <div
          data-arrow
          style="position: absolute;
        z-index: -1;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        bottom: ${isBottom && '-4px'};
        top: ${!isBottom && '-4px'};
        width: 20px;
        height: 20px;
        background: #f5f5d5;
        border: 1px solid #444;"
        ></div>
      </div>`;
    }

    if (!tfData || !config) {
      return html`<div
        style="
        position: relative;
        background: #f5f5d5;
        border-radius: 4px;
        font-size: 14px;
        color: #222;
        border: 1px solid #444;
        box-sizing: border-box;
        min-height: 130px;
      "
      >
        <d-loading />
        <div
          data-arrow
          style="position: absolute;
          z-index: -1;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          bottom: ${isBottom && '-4px'};
          top: ${!isBottom && '-4px'};
          width: 20px;
          height: 20px;
          background: #f5f5d5;
          border: 1px solid #444;"
        ></div>
      </div>`;
    }
    
    // 处理加载状态
    if (tfData.loading) {
      return html`<div class="bluesea-tip notranslate" translate="no">
        <div style="padding: 20px; text-align: center;">
          <div style="
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #1890ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
          "></div>
          <div style="color: #666; font-size: 12px;">
            正在获取翻译数据...
          </div>
          <div style="color: #999; font-size: 11px; margin-top: 4px;">
            包含英文释义和中文翻译
          </div>
        </div>
        <div
          data-arrow
          style="position: absolute;
          z-index: -1;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          bottom: ${isBottom && '-4px'};
          top: ${!isBottom && '-4px'};
          width: 20px;
          height: 20px;
          background: #f5f5d5;
          border: 1px solid #444;"
        ></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>`;
    }

    return html`<div class="bluesea-tip notranslate" translate="no">
      ${isOneWord
        ? config['自动发音']
          ? html`<audio
              src="${tfData.audioUrls?.uk || tfData.audioUrls?.us || `https://dict.youdao.com/dictvoice?audio=${tfData.query}&type=2`}"
              ref=${audioRef}
              autoplay="true"
            ></audio>`
          : html`<audio
              src="${tfData.audioUrls?.uk || tfData.audioUrls?.us || `https://dict.youdao.com/dictvoice?audio=${tfData.query}&type=2`}"
              ref=${audioRef}
              preload="true"
            ></audio>`
        : ''}
      <!-- <d-loading /> -->
      <div style="flex: 1;padding: 8px;">
        ${isOneWord
          ? html`<div class="bluesea-tip-row">
              <div style="font-size: 18px;font-weight: bold;">
                ${tfData.returnPhrase ? tfData.returnPhrase[0] : tfData.query}
              </div>
              <svg
                style="margin-left: 4px;margin-bottom: -3px;cursor: pointer;"
                t="1606215479613"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="1940"
                width="16"
                height="16"
                onClick=${() => {
                  // 优先播放英式发音
                  const audioUrl = tfData.audioUrls?.uk || tfData.audioUrls?.us || `https://dict.youdao.com/dictvoice?audio=${tfData.query}&type=2`;
                  playAudio(audioUrl);
                }}
              >
                <path
                  d="M552.96 152.064v719.872c0 16.11776-12.6976 29.184-28.3648 29.184a67.4816 67.4816 0 0 1-48.39424-20.64384l-146.8416-151.12192A74.5472 74.5472 0 0 0 275.8656 706.56h-25.3952C146.08384 706.56 61.44 619.45856 61.44 512s84.64384-194.56 189.0304-194.56h25.3952c20.0704 0 39.30112-8.192 53.47328-22.79424l146.8416-151.1424A67.4816 67.4816 0 0 1 524.61568 122.88C540.2624 122.88 552.96 135.94624 552.96 152.064z m216.96512 101.5808a39.936 39.936 0 0 1 0-57.42592 42.25024 42.25024 0 0 1 58.7776 0c178.4832 174.40768 178.4832 457.15456 0 631.56224a42.25024 42.25024 0 0 1-58.7776 0 39.936 39.936 0 0 1 0-57.40544 359.50592 359.50592 0 0 0 0-516.75136z m-103.38304 120.23808a39.7312 39.7312 0 0 1 0-55.23456 37.51936 37.51936 0 0 1 53.94432 0c104.30464 106.78272 104.30464 279.92064 0 386.70336a37.51936 37.51936 0 0 1-53.94432 0 39.7312 39.7312 0 0 1 0-55.23456c74.48576-76.288 74.48576-199.94624 0-276.23424z"
                  p-id="1941"
                  fill="#666"
                ></path>
              </svg>
            </div>`
          : ''}

        <div class="flex: 1">
          <!-- 音标和发音 -->
          ${tfData.basic && (tfData.basic['uk-phonetic'] || tfData.basic['us-phonetic'])
            ? html` <div class="bluesea-tip-row">
                ${tfData.basic['uk-phonetic'] ? html`
                <span style="margin-right: 12px;">
                  <span>英</span>
                  <span style="color: #f00; margin-left: 2px">
                    [${forPhonetic(tfData.basic['uk-phonetic'])}]
                  </span>
                  ${tfData.audioUrls?.uk ? html`
                    <svg
                      style="margin-left: 4px; margin-bottom: -2px; cursor: pointer;"
                      width="14" height="14" viewBox="0 0 24 24"
                      onClick=${() => playAudio(tfData.audioUrls.uk)}
                    >
                      <path fill="#666" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  ` : ''}
                </span>
                ` : ''}
                ${tfData.basic['us-phonetic'] ? html`
                <span>
                  <span>美</span>
                  <span style="color: #f00; margin-left: 2px">
                    [${forPhonetic(tfData.basic['us-phonetic'])}]
                  </span>
                  ${tfData.audioUrls?.us ? html`
                    <svg
                      style="margin-left: 4px; margin-bottom: -2px; cursor: pointer;"
                      width="14" height="14" viewBox="0 0 24 24"
                      onClick=${() => playAudio(tfData.audioUrls.us)}
                    >
                      <path fill="#666" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  ` : ''}
                </span>
                ` : ''}
              </div>`
            : ''}

          <!-- 分割 -->
          <div style="height: 4px;"></div>
          
          <!-- 词性标签 -->
          ${tfData.partOfSpeeches && tfData.partOfSpeeches.length > 0 ? html`
            <div class="bluesea-tip-row" style="margin-bottom: 6px;">
              ${tfData.partOfSpeeches.map(pos => html`
                <span style="
                  display: inline-block;
                  background: #e8f4fd;
                  color: #1890ff;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 11px;
                  margin-right: 4px;
                  margin-bottom: 2px;
                ">${pos}</span>
              `)}
            </div>
          ` : ''}
          
          <!-- 中文翻译（简洁版） -->
          ${tfData.translation && tfData.translation.length > 0 ? html`
            <div class="bluesea-tip-row" style="margin-bottom: 8px;">
              <div style="font-weight: bold; color: #1890ff;">
                ${tfData.translation.join('；')}
              </div>
            </div>
          ` : ''}
          
          <!-- 详细释义 -->
          ${tfData.basic && tfData.basic.explains
            ? tfData.basic.explains.map((explain, index) => {
                return html`<div class="bluesea-tip-row" style="
                  margin-bottom: 4px;
                  padding: 2px 0;
                  font-size: 13px;
                  line-height: 1.4;
                ">${explain}</div>`;
              })
            : ''}
          
        </div>
      </div>

      ${options.isExist
        ? html`<div class="bluesea-tip-row">
            <div style="flex:1"></div>
            <div class="bluesea-tip-btn-wrap">
              <div
                class="bluesea-tip-btn"
                style="color: #888; cursor: not-allowed; "
              >
                编辑
              </div>
            </div>
          </div>`
        : html`<div class="bluesea-tip-row">
            <div style="flex:1"></div>
            <div class="bluesea-tip-btn-wrap">
              <div
                class="bluesea-tip-btn"
                style="color: #888; cursor: not-allowed; "
              >
                编辑
              </div>
              <div
                style="
                  width: 1px;
                  height: 16px;
                  background: #666;
                  "
              ></div>
              <div
                style=${{
                  color: !isOneWord && '#888',
                  cursor: !isOneWord && 'not-allowed',
                }}
                class="bluesea-tip-btn"
                onclick=${() => {
                  if (isOneWord) {
                    options.onMark(tfData);
                  }
                }}
              >
                收藏
              </div>
            </div>
          </div>`}

      <div
        data-arrow
        style="position: absolute;
          z-index: -1;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          bottom: ${isBottom && '-4px'};
          top: ${!isBottom && '-4px'};
          width: 20px;
          height: 20px;
          background: #f5f5d5;
          border: 1px solid #444;"
      ></div>
      <style>
        .bluesea-tip {
          position: relative;
          background: #f5f5d5;
          border-radius: 4px;
          font-size: 14px;
          color: #222;
          border: 1px solid #444;
          box-sizing: border-box;
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .bluesea-tip > * {
          font-size: 14px;
          box-sizing: border-box;
        }
        .bluesea-tip-row {
          display: flex;
          align-items: center;
        }
        .bluesea-tip-btn-wrap {
          display: flex;
          align-items: center;
          display: flex;
          align-items: center;
          border-radius: 4px;
        }
        .bluesea-tip-btn {
          flex: 1;
          text-align: center;
          cursor: pointer;
          padding: 6px 8px;
          transition: 200ms all;
        }
        /* 覆盖chrome翻译的默认小按钮 */
        #gtx-trans {
          z-index: 2147483646;
        }
      </style>
    </div>`;
  };

  const result = render(html`<${App} />`, root);
  return result;
}

class AxTip {
  constructor(wrapName) {
    this.wrapName = wrapName || 'bluesea-box-wrap';
  }
  render(rect, props) {
    if (!rect.top && !rect.left) {
      return;
    }
    const tipRoot = document.createElement('div');
    tipRoot.classList.add('bluesea', this.wrapName);
    tipRoot.style.width = '250px';
    tipRoot.style.position = 'absolute';
    tipRoot.style.zIndex = 2147483647;
    tipRoot.style.userSelect = 'none';

    makeTipEl(tipRoot, props, rect.top >= 150);

    setPos(tipRoot, rect);

    return tipRoot;
  }
  clear() {
    const boxWraps = document.querySelectorAll(`.${this.wrapName}`);
    boxWraps.forEach((it) => {
      document.documentElement.removeChild(it);
    });
  }
}

window.AxTip = AxTip;

const axTip = new window.AxTip();
const selectedAxTip = new window.AxTip('bluesea-selected-box-wrap');
