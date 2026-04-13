fetch('https://pintacolores.com/')
  .then(res => {
      console.log("Status Home:", res.status);
  })
  .catch(err => console.error(err));
