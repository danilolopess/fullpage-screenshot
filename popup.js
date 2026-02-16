const captureBtn = document.getElementById("capture");
const stopBtn = document.getElementById("stop");
const status = document.getElementById("status");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress");

let isCapturing = false;

stopBtn.addEventListener("click", () => {
  isCapturing = false;
  status.textContent = "Stopping...";
});

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

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Small delay to let the content script register its listener
    await delay(100);

    // Get page dimensions
    const pageInfo = await sendMessage(tab.id, { action: "getPageInfo" });
    const { scrollHeight, clientHeight, devicePixelRatio, originalScrollY } =
      pageInfo;
    const dpr = devicePixelRatio;

    const totalSteps = Math.ceil(scrollHeight / clientHeight);
    const captures = [];

    for (let i = 0; i < totalSteps; i++) {
      if (!isCapturing) break;

      const y = i * clientHeight;
      await sendMessage(tab.id, { action: "scrollTo", y });
      // Increased delay to ensure lazy loaded elements are rendered
      await delay(1000);

      if (i > 0) {
        await sendMessage(tab.id, { action: "hideFixedElements" });
      }

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });
      captures.push({ dataUrl, y });

      if (i === 0) {
        await sendMessage(tab.id, { action: "hideFixedElements" });
      }

      progressBar.value = Math.round(((i + 1) / totalSteps) * 100);
      status.textContent = `Capturing ${i + 1}/${totalSteps}...`;
    }

    // Restore scroll position and remove overflow hidden
    await sendMessage(tab.id, { action: "restoreFixedElements" });
    await sendMessage(tab.id, {
      action: "restoreScroll",
      y: originalScrollY,
    });

    if (!isCapturing) {
      status.textContent = "Capture stopped.";
      return;
    }

    status.textContent = "Stitching image...";

    // Load all captured images
    const images = await Promise.all(
      captures.map((c) => loadImage(c.dataUrl))
    );

    // The captured images are already at device pixel dimensions
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
        // Draw full viewport captures at their scroll position
        ctx.drawImage(img, 0, Math.round(captures[i].y * dpr));
      } else {
        // Last frame: may overlap with the previous one.
        // The last scroll position is (totalSteps-1)*clientHeight,
        // but the page ends at scrollHeight. The visible portion at the
        // bottom of this capture is what we haven't drawn yet.
        const lastScrollY = captures[i].y;
        // The actual bottom of the page in canvas coords
        const pageBottom = totalHeight;
        // Where this capture's top sits in canvas coords
        const captureTopInCanvas = Math.round(lastScrollY * dpr);
        // The bottom of this capture in canvas coords
        const captureBottomInCanvas = captureTopInCanvas + captureHeight;
        // How much overflows past the page
        const overflow = captureBottomInCanvas - pageBottom;

        if (overflow > 0) {
          // Crop from the bottom of the source image (skip the overlapping top)
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

    // Download the final image
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fullpage-screenshot-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);

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
