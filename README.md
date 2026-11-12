# Presupuestos MR

PWA mínima para armar presupuestos de alquiler de pantallas LED y compartirlos como PDF. Sin build ni dependencias: HTML, CSS y JS planos, más jsPDF en `vendor/`.

## Correr local

```sh
python3 -m http.server 8765
```

Abrir http://localhost:8765. Para instalarla en el celular hay que servirla por HTTPS (GitHub Pages, Netlify, etc.).

## Cómo funciona

- Los presupuestos y los datos del emisor (⚙) se guardan en el `localStorage` del dispositivo.
- "Compartir PDF" usa el menú nativo de compartir (WhatsApp, mail…); si el navegador no lo soporta, descarga el archivo.
- El importe en letras se calcula del monto, pero se puede editar; ↺ lo recalcula.
- El service worker pide primero a la red y usa la caché solo sin conexión, así que los cambios llegan al abrir la app. Si agregás un archivo nuevo, sumalo a `SHELL` en `sw.js` y subí `CACHE`.
- Marca: negro `#0B0B0B` / `#1F1F1F`, azul `#00AEEF`, verde `#39FF14`, Montserrat (subconjunto latino en `fonts/`, TTF para el PDF y woff2 para la web). Los logos salen de las JPEG de `brand/`; con el original en PNG o SVG se verían más nítidos.
- El texto de los botones azules va en negro: blanco sobre `#00AEEF` da 2,53:1 y no llega al 4,5:1 de WCAG AA.

## Datos del emisor

Los datos del emisor (nombre, CUIT, N° de proveedor del Estado, dirección, mail, teléfono, ciudad, firma en cursiva y DNI) no están en el código: cada teléfono los carga una vez desde ⚙ «Mis datos» y quedan solo en ese dispositivo.
