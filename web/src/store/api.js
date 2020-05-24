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

export function get_stream(url, cb) {
  console.log(`>> get_stream ${url} `)

  const td = new TextDecoder("utf-8");
  return fetch("http://localhost:8000" + url)
    .catch(err => console.warn(err))
    .then(async res => {
      if (res.status != 200) {
        return;
      }

      const reader = res.body.getReader();
      let buf = "", done = false;

      while (!done) {
        const p = await reader.read();
        if (p.done) {
          done = true;
          break;
        }

        buf += td.decode(p.value);

        let index = buf.indexOf("\n");
        while (index > 0) {
          try {
            const str = buf.substr(0, index);
            const obj = JSON.parse(str);
            console.log(`<< get_stream ${url}`, obj);
            cb(obj);
            buf = buf.substr(index + 2, buf.length - index - 2)
          } catch (e) {
            console.log(e)
          }
          index = buf.indexOf("\n")
        }
      }
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

export function upload(url, formData) {
  console.log(`>> upload ${url} `, formData)
  return fetch("http://localhost:8000" + url, {
    method: "POST",
    body: formData
  })
    .then(res => {
      console.log(`<< post ${url}`, res);
      return res
    })
}