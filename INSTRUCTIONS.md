# Guía de Instalación y Configuración

¡Bienvenido! Esta guía te ayudará a poner en marcha tu web de dibujos para colorear paso a paso.

## 1. Requisitos Previos
- Instalar **Node.js** (LTS recomendado) desde [nodejs.org](https://nodejs.org/).
- Instalar **PostgreSQL** desde [postgresql.org](https://www.postgresql.org/download/).

---

## 2. Instalación de PostgreSQL
1. Descarga el instalador para Windows.
2. Durante la instalación, establece una contraseña para el usuario `postgres` (¡no la olvides!).
3. Abre **pgAdmin 4** (se instala con PostgreSQL).
4. Haz clic derecho en "Servers" -> "Register" -> "Server" (si no está ya).
5. Crea una nueva base de datos llamada `dibujos_db`:
   - En pgAdmin, clic derecho en `Databases` -> `Create` -> `Database...`.
   - Nombre: `dibujos_db`.

---

## 3. Configurar la Base de Datos
Ejecuta el script SQL para crear las tablas:
1. En pgAdmin, selecciona `dibujos_db`.
2. Busca el icono de **Query Tool** (una pequeña lupa/consola).
3. Copia y pega el contenido de `database/schema.sql` y presiona el botón de **Play** (Ejecutar).

---

## 4. Conectar el Backend
1. Abre el archivo `.env` en la raíz del proyecto.
2. Asegúrate de que los datos coincidan con tu instalación:
   ```env
   DATABASE_URL=postgres://postgres:TU_CONTRASEÑA@localhost:5432/dibujos_db
   ```
3. (Opcional) Cambia `ADMIN_USER` y `ADMIN_PASS` para tu primer login.

---

## 5. Iniciar el Proyecto
1. Abre una terminal en la carpeta `coloring-web`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
4. Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 6. Realizar Backups
Para exportar tu base de datos y no perder los dibujos:
1. Abre la terminal de comandos (CMD).
2. Usa el comando `pg_dump`:
   ```bash
   pg_dump -U postgres dibujos_db > backup_dibujos.sql
   ```
Para restaurar:
   ```bash
   psql -U postgres dibujos_db < backup_dibujos.sql
   ```

---

## 7. Cómo abrir la Terminal
Para ejecutar comandos, necesitas abrir la terminal (consola) en la carpeta del proyecto:
- **En VS Code (Recomendado):** Presiona `Ctrl + Ñ` (o `Ctrl + ` `) o ve al menú superior: `Terminal` -> `New Terminal`.
- **En Windows:** Abre la carpeta `coloring-web`, haz clic derecho en un espacio vacío mientras presionas la tecla `Shift` y elige "Abrir ventana de PowerShell aquí" o "Abrir terminal aquí".

## 8. Cambiar Usuario y Contraseña del Admin
Si deseas cambiar los datos de acceso al panel administrador:
1. Abre el archivo `.env` y cambia los valores de `ADMIN_USER` y `ADMIN_PASS`.
2. Abre la terminal en la carpeta del proyecto y ejecuta:
   ```bash
   node scripts/update-admin.js
   ```
¡Listo! Los datos se han actualizado en la base de datos.

---

## 9. Consejos de Uso
- **Panel Admin:** Entra en `/admin` (o la ruta que hayas definido en `ADMIN_PATH`).
- **Imágenes:** Al subir una imagen, el sistema crea automáticamente una versión WEBP para la web (rápida) y una JPG para que los niños la descarguen e impriman.
- **Categorías:** Crea categorías antes de subir imágenes para tener todo organizado.
