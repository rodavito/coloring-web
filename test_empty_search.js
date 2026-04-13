fetch('https://pintacolores.com/search?q=')
  .then(res => {
      console.log("Status Empty Search:", res.status);
  })
  .catch(err => console.error(err));
