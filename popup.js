const captureBtn = document.getElementById("capture");
const stopBtn = document.getElementById("stop");
const status = document.getElementById("status");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress");

let isCapturing = false;

// --- Utility Functions ---

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendMessage(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// --- Core Logic ---

async function captureTab(tab) {
  // Inject content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });

  // Small delay to let the content script register its listener
  await delay(100);

  // Get page dimensions
  const pageInfo = await sendMessage(tab.id, { action: "getPageInfo" });
  const { scrollHeight, clientHeight, devicePixelRatio, originalScrollY } = pageInfo;
  const dpr = devicePixelRatio;

  const totalSteps = Math.ceil(scrollHeight / clientHeight);
  const captures = [];

  for (let i = 0; i < totalSteps; i++) {
    if (!isCapturing) break;

    const y = i * clientHeight;
    await sendMessage(tab.id, { action: "scrollTo", y });
    
    // Delay to ensure lazy loaded elements are rendered
    await delay(1000);

    // Hide fixed elements after the first scroll to avoid duplication
    if (i > 0) {
      await sendMessage(tab.id, { action: "hideFixedElements" });
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });
    captures.push({ dataUrl, y });

    // Hide fixed elements on the first screen as well for consistency in subsequent logic if needed,
    // although usually we want the header on the first screen. 
    // The original logic hid it after capture for the first screen.
    if (i === 0) {
      await sendMessage(tab.id, { action: "hideFixedElements" });
    }

    progressBar.value = Math.round(((i + 1) / totalSteps) * 100);
    status.textContent = `Capturing ${i + 1}/${totalSteps}...`;
  }

  // Restore state
  await sendMessage(tab.id, { action: "restoreFixedElements" });
  await sendMessage(tab.id, {
    action: "restoreScroll",
    y: originalScrollY,
  });

  return { captures, scrollHeight, dpr, pageTitle: tab.title };
}

async function stitchImages(captures, scrollHeight, dpr) {
  const images = await Promise.all(
    captures.map((c) => loadImage(c.dataUrl))
  );

  const captureWidth = images[0].width;
  const captureHeight = images[0].height;
  const totalHeight = Math.round(scrollHeight * dpr);

  const canvas = document.createElement("canvas");
  canvas.width = captureWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const isLast = i === images.length - 1;

    if (!isLast) {
      ctx.drawImage(img, 0, Math.round(captures[i].y * dpr));
    } else {
      const lastScrollY = captures[i].y;
      const pageBottom = totalHeight;
      const captureTopInCanvas = Math.round(lastScrollY * dpr);
      const captureBottomInCanvas = captureTopInCanvas + captureHeight;
      const overflow = captureBottomInCanvas - pageBottom;

      if (overflow > 0) {
        const srcY = overflow;
        const srcH = captureHeight - overflow;
        const destY = pageBottom - srcH;
        ctx.drawImage(
          img,
          0,
          srcY,
          captureWidth,
          srcH,
          0,
          destY,
          captureWidth,
          srcH
        );
      } else {
        ctx.drawImage(img, 0, captureTopInCanvas);
      }
    }
  }

  return canvas;
}

async function downloadCanvas(canvas, filename) {
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Sanitize filename
  const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${safeFilename}-${Date.now()}.png`;
  
  link.click();
  URL.revokeObjectURL(url);
}

// --- Event Listeners ---

stopBtn.addEventListener("click", () => {
  isCapturing = false;
  status.textContent = "Stopping...";
});

captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;
  stopBtn.style.display = "block";
  isCapturing = true;
  status.textContent = "Capturing...";
  progressContainer.style.display = "block";
  progressBar.value = 0;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const { captures, scrollHeight, dpr, pageTitle } = await captureTab(tab);

    if (!isCapturing) {
      status.textContent = "Capture stopped.";
      return;
    }

    status.textContent = "Stitching image...";
    const canvas = await stitchImages(captures, scrollHeight, dpr);
    
    await downloadCanvas(canvas, pageTitle);

    status.textContent = "Screenshot saved!";
    progressBar.value = 100;
  } catch (err) {
    status.textContent = "Error: " + err.message;
    console.error(err);
  } finally {
    captureBtn.disabled = false;
    stopBtn.style.display = "none";
  }
});
