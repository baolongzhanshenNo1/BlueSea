const inBlackEl = (el) => {
  const blackElList = ['pre', 'code'].map((it) => it.toUpperCase());
  if (!el.parentNode) {
    return false;
  }

  if (blackElList.includes(el.nodeName)) {
    return true;
  } else {
    return inBlackEl(el.parentNode);
  }
};

let lastText = '';



const listenMouseup = (e) => {
  console.log('Mouse up event detected');
  if (isYTL(e.target)) {
    console.log('Skipping - clicked on BlueSea element');
    return;
  }
  const selection = window.getSelection();
  console.log('Selection:', selection.toString());

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      let selectText = selection.toString().trim();


      if (lastText === selectText) {
        lastText = '';
        return;
      }

      if (selectText === '') {
        return;
      }

      // 不翻译中文
      if (!/^[^\u4e00-\u9fa5]+$/.test(selectText)) {
        return;
      }

      if (!/.*[a-zA-Z]{3,}.*/.test(selectText)) {
        // console.log('所选内容必须存在连续3个及以上字母时，才展开翻译');
        return;
      }

      const selectTextArr = selectText.split(' ');

      if (selectTextArr.length === 1) {
        // 非句子情况下，仅匹配纯粹单词，如果匹配到特殊符号就跳过，这里是为了避免干扰复制各类命令或url
        const symbolReg = /[~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：""【】、；''，。、]/im;
        if (symbolReg.test(selectText)) {
          console.log('跳过包含特殊符号的单词:', selectText);
          return;
        }
      } else {
        // 句子情况：需要用户确认翻译（避免与复制操作重叠）
        console.log('检测到句子，将显示确认按钮:', selectText);
        // TODO: 这里可以添加句子翻译的确认机制
      }

      // 过滤类似日志文件之类的奇怪玩意。
      // 最长的单词45个字母，Pneumonoultramicroscopicsilicovolcanoconiosis
      if (selectTextArr.some((it) => it.length > 45)) {
        console.log('跳过包含超长字符串的内容（可能是日志或JSON）:', selectText);
        return;
      }

      // 开始和边界不在黑名单标签内
      if (inBlackEl(range.startContainer) || inBlackEl(range.endContainer)) {
        // console.log('选中的内容存在特殊标签内，不展开');
        return;
      }

      const rangeRect = range.getBoundingClientRect();

      selectedAxTip.render(rangeRect, {
        text: selectText,
        onMark: async (youdao) => {
          const material = bluesea.createMaterialObj(youdao.query, youdao);
          await bluesea.addMaterialObj(material);
          selectedAxTip.clear();
        },
      });
    }
  }
};

const listenMousedown = (e) => {
  if (isYTL(e.target)) {
    return;
  }
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    lastText = selection.toString().trim();
  }
  axTip.clear();
  selectedAxTip.clear();
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('BlueSea selection script loaded');
  funCtrl.run(
    '划词翻译',
    () => {
      console.log('BlueSea word selection enabled');
      document.addEventListener('mouseup', listenMouseup);
      document.addEventListener('mousedown', listenMousedown);
    },
    () => {
      console.log('BlueSea word selection disabled');
      selectedAxTip.clear();
      document.removeEventListener('mouseup', listenMouseup);
      document.removeEventListener('mousedown', listenMousedown);
    }
  );
});
