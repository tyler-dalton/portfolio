(() => {
  const button = document.getElementById('share-card');
  const status = document.getElementById('share-status');
  const fallback = document.getElementById('share-fallback');
  const urlInput = document.getElementById('card-url');
  const url = new URL('card.html', window.location.href).href;
  button.hidden = false;

  button.addEventListener('click', async () => {
    status.textContent = '';
    fallback.hidden = true;
    button.disabled = true;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Ben Morneau | Digital Business Card', url });
          status.textContent = 'Card shared.';
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(url);
      status.textContent = 'Card link copied. Ready to share.';
    } catch {
      fallback.hidden = false;
      urlInput.value = url;
      urlInput.focus();
      urlInput.select();
      status.textContent = 'Select and copy the link below.';
    } finally {
      button.disabled = false;
    }
  });
})();
