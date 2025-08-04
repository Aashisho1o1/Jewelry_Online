// Add to your client-side API file
// Fetch CSRF token before making POST/PUT/DELETE requests
async function fetchCSRFToken() {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}

// Use the token in your fetch requests
async function postData(url, data) {
  const csrfToken = await fetchCSRFToken();
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
} 