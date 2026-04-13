fetch('http://localhost:3000/buscar?q=perro')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 100)))
  .catch(err => console.error(err));
