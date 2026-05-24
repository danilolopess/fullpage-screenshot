function detectScroller() {
  const html = document.documentElement;
  const body = document.body;
  const savedWinY = window.scrollY;
  const savedHtmlY = html.scrollTop;
  const savedBodyY = body.scrollTop;
  const probe = 1;

  window.scrollTo(0, probe);
  if (window.scrollY === probe || html.scrollTop === probe) {
    window.scrollTo(0, savedWinY);
    return "window";
  }
  window.scrollTo(0, savedWinY);

  body.scrollTop = probe;
  if (body.scrollTop === probe) {
    body.scrollTop = savedBodyY;
    return "body";
  }
  body.scrollTop = savedBodyY;

  html.scrollTop = probe;
  if (html.scrollTop === probe) {
    html.scrollTop = savedHtmlY;
    return "html";
  }
  html.scrollTop = savedHtmlY;

  return "window";
}

function getScrollY(mode) {
  if (mode === "body") return document.body.scrollTop;
  if (mode === "html") return document.documentElement.scrollTop;
  return window.scrollY;
}

function setScrollY(mode, y) {
  if (mode === "body") {
    document.body.scrollTop = y;
  } else if (mode === "html") {
    document.documentElement.scrollTop = y;
  } else {
    window.scrollTo(0, y);
  }
}

function getScrollMetrics(mode) {
  const html = document.documentElement;
  const body = document.body;
  const scrollHeight = Math.max(html.scrollHeight, body.scrollHeight);
  let clientHeight;
  if (mode === "body") {
    clientHeight = body.clientHeight || window.innerHeight;
  } else {
    clientHeight = html.clientHeight || window.innerHeight;
  }
  return { scrollHeight, clientHeight };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getPageInfo") {
    const originalScrollY = window.scrollY;
    window.__fps_originalScrollY = originalScrollY;
    window.__fps_originalHtmlOverflow = document.documentElement.style.overflow;
    window.__fps_originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";

    const scrollMode = detectScroller();
    window.__fps_scrollMode = scrollMode;

    const metrics = getScrollMetrics(scrollMode);

    sendResponse({
      scrollHeight: metrics.scrollHeight,
      clientHeight: metrics.clientHeight,
      clientWidth:
        document.documentElement.clientWidth || document.body.clientWidth,
      devicePixelRatio: window.devicePixelRatio,
      originalScrollY,
      scrollMode,
    });
  } else if (msg.action === "scrollTo") {
    const mode = window.__fps_scrollMode || "window";
    setScrollY(mode, msg.y);
    sendResponse({ done: true });
  } else if (msg.action === "hideFixedElements") {
    if (!window.hiddenElements) {
      window.hiddenElements = [];
    }
    const elements = document.querySelectorAll("*");
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        (style.position === "fixed" || style.position === "sticky") &&
        style.visibility !== "hidden"
      ) {
        window.hiddenElements.push({
          element: el,
          originalVisibility: el.style.visibility,
        });
        el.style.visibility = "hidden";
      }
    });
    sendResponse({ done: true });
  } else if (msg.action === "restoreFixedElements") {
    if (window.hiddenElements) {
      window.hiddenElements.forEach((item) => {
        item.element.style.visibility = item.originalVisibility;
      });
      window.hiddenElements = [];
    }
    sendResponse({ done: true });
  } else if (msg.action === "restoreScroll") {
    const mode = window.__fps_scrollMode || "window";
    document.documentElement.style.overflow =
      window.__fps_originalHtmlOverflow || "";
    document.body.style.overflow = window.__fps_originalBodyOverflow || "";
    setScrollY(mode, msg.y);
    sendResponse({ done: true });
  }
  return true;
});
