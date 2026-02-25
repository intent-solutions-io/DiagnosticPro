/**
 * Whop Iframe Embed Detection
 * When loaded inside the Whop experience iframe, hides site nav/footer
 * and applies embedded styling.
 */

/** Detect if running inside a Whop iframe */
export function isInsideWhop(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin restriction means we're in an iframe
    return true;
  }
}

/** Set up embedded mode — call once at app startup */
export function setupWhopEmbed(): void {
  if (!isInsideWhop()) return;

  document.body.classList.add('whop-embedded');

  // The experience URL includes the experienceId
  const path = window.location.pathname;
  const expMatch = path.match(/exp_[a-zA-Z0-9]+/);
  if (expMatch) {
    console.log('Running inside Whop experience:', expMatch[0]);
  }
}
