fetch('https://pintacolores.com/dibujo/princesa-con-castillo-gigante-para-colorear-or-dibujo-detallado-y-complejo-de-fantasia')
  .then(res => console.log("Status for newest Neon image:", res.status))
  .catch(err => console.error(err));
