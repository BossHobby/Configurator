function handleResponse(res) {
  if (res.status != 200) {
    return res.text().then(text => {
      throw new Error(text)
    });

  }
  return res.json()
}

export function get(url) {
  console.log(`>> get ${url} `)
  return fetch("http://localhost:8000" + url)
    .then(handleResponse)
    .then(res => {
      console.log(`<< get ${url}`, res);
      return res
    })
}

export function post(url, payload) {
  console.log(`>> post ${url} `, payload)
  return fetch("http://localhost:8000" + url, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(handleResponse)
    .then(res => {
      console.log(`<< post ${url}`, res);
      return res
    })
}