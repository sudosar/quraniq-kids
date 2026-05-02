import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";

const GITHUB_TOKEN = "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";
const REPO_OWNER = "sudosar";
const REPO_NAME = "quraniq-kids";

interface BugNubState {
  isOpen: boolean;
  isCapturing: boolean;
  isSubmitting: boolean;
  screenshot: string | null;
  submitted: boolean;
}

export function BugNub() {
  const [state, setState] = useState<BugNubState>({
    isOpen: false,
    isCapturing: false,
    isSubmitting: false,
    screenshot: null,
    submitted: false,
  });
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const captureScreenshot = useCallback(async () => {
    setState((s) => ({ ...s, isCapturing: true }));
    try {
      // Hide the bug nub itself during capture
      const nubEl = document.getElementById("bug-nub-container");
      if (nubEl) nubEl.style.display = "none";

      let dataUrl: string | null = null;
      try {
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 0.5,
          logging: false,
          imageTimeout: 3000,
          onclone: (clonedDoc) => {
            // Remove problematic cross-origin background images from clone
            const els = clonedDoc.querySelectorAll('[style*="background"]');
            els.forEach((el) => {
              const style = (el as HTMLElement).style;
              if (style.backgroundImage && style.backgroundImage.includes('http')) {
                style.backgroundColor = '#e8f4f8';
                style.backgroundImage = 'none';
              }
            });
          },
        });
        dataUrl = canvas.toDataURL("image/png", 0.7);
      } catch (canvasErr) {
        console.warn("html2canvas failed, proceeding without screenshot:", canvasErr);
      }

      if (nubEl) nubEl.style.display = "";
      setState((s) => ({ ...s, isCapturing: false, isOpen: true, screenshot: dataUrl }));
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      if (document.getElementById("bug-nub-container")) {
        document.getElementById("bug-nub-container")!.style.display = "";
      }
      setState((s) => ({ ...s, isCapturing: false, isOpen: true, screenshot: null }));
    }
  }, []);

  const submitBug = useCallback(async () => {
    const description = descriptionRef.current?.value?.trim() || "No description provided";
    setState((s) => ({ ...s, isSubmitting: true }));

    try {
      // Upload screenshot as base64 in the issue body
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      const screenSize = `${window.innerWidth}x${window.innerHeight}`;

      let body = `## Bug Report\n\n`;
      body += `**Description:** ${description}\n\n`;
      body += `**URL:** ${currentUrl}\n`;
      body += `**Screen:** ${screenSize}\n`;
      body += `**Time:** ${timestamp}\n`;
      body += `**Device:** ${userAgent}\n\n`;

      if (state.screenshot) {
        // Upload the image to the repo as a blob and get a URL
        const base64Data = state.screenshot.split(",")[1];
        
        // Create a unique filename
        const filename = `bug-screenshots/bug-${Date.now()}.png`;
        
        // Upload to repo
        const uploadResp = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Bug screenshot: ${description.slice(0, 50)}`,
              content: base64Data,
              branch: "main",
            }),
          }
        );

        if (uploadResp.ok) {
          const uploadData = await uploadResp.json();
          const imageUrl = uploadData.content.download_url;
          body += `## Screenshot\n\n![Screenshot](${imageUrl})\n`;
        } else {
          // Fallback: embed as base64 (GitHub renders it but it's large)
          body += `## Screenshot\n\n<details><summary>Click to view screenshot</summary>\n\n![Screenshot](${state.screenshot})\n\n</details>\n`;
        }
      }

      // Create the issue
      const issueResp = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `🐛 Bug: ${description.slice(0, 80)}`,
            body,
            labels: ["bug", "user-reported"],
          }),
        }
      );

      if (issueResp.ok) {
        setState((s) => ({ ...s, isSubmitting: false, submitted: true }));
        setTimeout(() => {
          setState({ isOpen: false, isCapturing: false, isSubmitting: false, screenshot: null, submitted: false });
        }, 2000);
      } else {
        const errData = await issueResp.json();
        console.error("Failed to create issue:", errData);
        alert("Failed to submit bug report. Please try again.");
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    } catch (err) {
      console.error("Bug submission error:", err);
      alert("Failed to submit bug report. Please try again.");
      setState((s) => ({ ...s, isSubmitting: false }));
    }
  }, [state.screenshot]);

  const close = () => {
    setState({ isOpen: false, isCapturing: false, isSubmitting: false, screenshot: null, submitted: false });
  };

  return (
    <div id="bug-nub-container" className="fixed z-[9999]">
      {/* Floating Bug Button */}
      {!state.isOpen && (
        <button
          onClick={captureScreenshot}
          disabled={state.isCapturing}
          className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 shadow-lg flex items-center justify-center transition-all duration-200 border-2 border-red-300"
          title="Report a bug"
        >
          {state.isCapturing ? (
            <span className="animate-spin text-white text-lg">⏳</span>
          ) : (
            <span className="text-white text-xl">🐛</span>
          )}
        </button>
      )}

      {/* Bug Report Modal */}
      {state.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                🐛 Report Bug
              </h3>
              <button onClick={close} className="text-white/80 hover:text-white text-xl font-bold">
                ✕
              </button>
            </div>

            {state.submitted ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-lg font-semibold text-green-600">Bug reported!</p>
                <p className="text-sm text-gray-500 mt-1">Thank you for helping us improve.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Screenshot Preview */}
                {state.screenshot && (
                  <div className="rounded-lg overflow-hidden border-2 border-gray-200 max-h-40">
                    <img
                      src={state.screenshot}
                      alt="Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    What went wrong?
                  </label>
                  <textarea
                    ref={descriptionRef}
                    placeholder="Describe the bug briefly..."
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitBug}
                  disabled={state.isSubmitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {state.isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Submitting...
                    </>
                  ) : (
                    <>📤 Submit Bug Report</>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Screenshot + page info will be attached automatically
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
