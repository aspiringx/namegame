export async function fetchScript() {
  const response = await fetch('/docs/scripts/speed-of-love-intro-preferred.md');
  return await response.text();
}
