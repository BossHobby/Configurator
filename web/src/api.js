export function get(url) {
  return fetch("http://localhost:8000" + url)
    .then(res => res.json())
}

export function post(url, payload) {
  return fetch("http://localhost:8000" + url, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
}