chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getPageInfo") {
    const originalScrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    sendResponse({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      devicePixelRatio: window.devicePixelRatio,
      originalScrollY,
    });
  } else if (msg.action === "scrollTo") {
    window.scrollTo(0, msg.y);
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
    document.documentElement.style.overflow = "";
    window.scrollTo(0, msg.y);
    sendResponse({ done: true });
  }
  return true;
});
