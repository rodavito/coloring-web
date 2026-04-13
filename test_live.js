fetch('https://pintacolores.com/search?q=perro')
  .then(res => {
      console.log("Status:", res.status);
      return res.text();
  })
  .then(text => console.log(text.substring(0, 500)))
  .catch(err => console.error(err));
