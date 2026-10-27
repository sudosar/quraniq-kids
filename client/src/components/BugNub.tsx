import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas-pro";

const REPO_OWNER = "sudosar";
const REPO_NAME = "quraniq-kids";

interface BugNubState {
  isOpen: boolean;
  isCapturing: boolean;
  isSubmitting: boolean;
  screenshot: string | null;
  submitted: boolean;
  issueUrl: string | null;
  error: string | null;
}

const INITIAL_STATE: BugNubState = {
  isOpen: false,
  isCapturing: false,
  isSubmitting: false,
  screenshot: null,
  submitted: false,
  issueUrl: null,
  error: null,
};

export function BugNub() {
  const [state, setState] = useState<BugNubState>(INITIAL_STATE);
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

  // Primary path: POST to the bug-reporter service on this origin, which
  // files the GitHub issue server-side. No account or token in the app.
  const submitBug = useCallback(async () => {
    const description = descriptionRef.current?.value?.trim() || "No description provided";
    setState((s) => ({ ...s, isSubmitting: true, error: null }));
    try {
      const resp = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          url: window.location.href,
          screen: `${window.innerWidth}x${window.innerHeight}`,
          time: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenshot: state.screenshot,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        const code = data?.error as string | undefined;
        const message =
          code === "reporter_not_configured"
            ? "The reporter isn't fully set up yet. You can still send it via GitHub below."
            : code === "rate_limited"
              ? "Lots of reports just now — wait a minute and try again, or use GitHub below."
              : "Couldn't send the report. Check your connection, or use GitHub below.";
        setState((s) => ({ ...s, isSubmitting: false, error: message }));
        return;
      }
      setState((s) => ({ ...s, isSubmitting: false, submitted: true, issueUrl: data.url || null }));
      setTimeout(() => setState(INITIAL_STATE), 4000);
    } catch (err) {
      console.error("Bug report submit failed:", err);
      setState((s) => ({
        ...s,
        isSubmitting: false,
        error: "Couldn't send the report. Check your connection, or use GitHub below.",
      }));
    }
  }, [state.screenshot]);

  // Fallback path: open a pre-filled GitHub issue (needs a GitHub
  // account) and download the screenshot for manual attaching.
  const submitViaGitHub = useCallback(() => {
    const description = descriptionRef.current?.value?.trim() || "No description provided";

    let body = `## Bug Report\n\n`;
    body += `**Description:** ${description}\n\n`;
    body += `**URL:** ${window.location.href}\n`;
    body += `**Screen:** ${window.innerWidth}x${window.innerHeight}\n`;
    body += `**Time:** ${new Date().toISOString()}\n`;
    body += `**Device:** ${navigator.userAgent}\n\n`;
    if (state.screenshot) {
      body += `## Screenshot\n\n_A screenshot was downloaded to your device — drag or paste it here._\n`;
    }

    const params = new URLSearchParams({
      title: `🐛 Bug: ${description.slice(0, 80)}`,
      body,
      labels: "bug,user-reported",
    });
    window.open(`https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?${params}`, "_blank", "noopener");

    if (state.screenshot) {
      const a = document.createElement("a");
      a.href = state.screenshot;
      a.download = `bug-${Date.now()}.png`;
      a.click();
    }
  }, [state.screenshot]);

  const close = () => setState(INITIAL_STATE);

  return (
    <div id="bug-nub-container" className="fixed z-[9999]">
      {/* Floating Bug Button */}
      {!state.isOpen && (
        <button
          onClick={captureScreenshot}
          disabled={state.isCapturing}
          className="fixed bottom-24 right-3 w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 shadow-lg flex items-center justify-center transition-all duration-200 border-2 border-red-300"
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
                <p className="text-lg font-semibold text-green-600">Report sent!</p>
                <p className="text-sm text-gray-500 mt-1">Thanks — the developers have it now.</p>
                {state.issueUrl && (
                  <a
                    href={state.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 underline mt-2 inline-block"
                  >
                    View the report
                  </a>
                )}
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

                {state.error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {state.error}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  onClick={submitBug}
                  disabled={state.isSubmitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {state.isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Sending...
                    </>
                  ) : (
                    <>📤 Submit Report</>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Goes straight to the developers — no account needed
                </p>

                {state.error && (
                  <button
                    onClick={submitViaGitHub}
                    className="w-full text-sm text-gray-500 underline py-1"
                  >
                    Or open it on GitHub instead
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
