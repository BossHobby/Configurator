function handleResponse(res) {
  if (res.status != 200) {
    throw new Error(res.text())
  }
  return res.json()
}

export function get(url) {
  return fetch("http://localhost:8000" + url)
    .then(handleResponse)
}

export function post(url, payload) {
  return fetch("http://localhost:8000" + url, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(handleResponse)
}