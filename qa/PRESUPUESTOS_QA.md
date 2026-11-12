# QA — Presupuestos MR (PWA)

Registro de QA manual de la PWA. Fuera del workspace Toteat; no tiene apéndice en `/qa-mcp-devtools`.

## Oráculos de este registro

- **Claims-DOC**: el presupuesto original `SET DE TV.docx`, con su formato, textos y el total en letras.
- **Claims-USR**: lo que pidió el usuario: PWA muy simple, se usa en el celular y el PDF se manda por WhatsApp; el PDF lleva el logo nuevo con el mismo formato; el look es el del manual de marca MR.
- **Claims-UI**: el copy de la propia app, por ejemplo «Se completa solo con el monto. Si lo editás, ↻ lo recalcula.»
- **Purpose**: armar y mandar un presupuesto sin perder datos y sin que el monto salga distinto del que se escribió.
- **Statutes-WCAG**: contraste AA de 4,5:1 para texto y 3:1 para texto grande y controles, y objetivos táctiles de 44px.

### Casos nuevos y a re-correr · versión inicial con la marca MR · 2026-11-11

Rama `master`: commit `afd04e9` más los cambios sin commitear del rebrand (app oscura, logo y Montserrat en el PDF, service worker que va primero a la red). No hay backend: la «relectura» es recargar la página y releer `localStorage` (`presupuestos.budgets` y `presupuestos.issuer`).

Los casos se corren en Chrome con el MCP, a 390×844 y con touch. Los marcados `inalcanzable hoy` necesitan HTTPS y un teléfono real, así que se agrupan para cuando haya deploy.

**Nuevos:**

| ID | Área | Caso | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| LI-01 | Lista | Primer uso con `localStorage` vacío | Aparece el estado vacío «Todavía no hay presupuestos» con la grilla LED; la barra inferior muestra solo «+ Nuevo presupuesto»; no hay botón Volver ni indicador «Guardado». | Pass | P3 · Claims-UI · borrar las claves en la consola · sin datos |
| LI-02 | Lista | Crear, editar el evento, volver a la lista y recargar | La tarjeta muestra el evento, «sección · días» y el total en azul con formato `$ 24.000.000`. La editada queda primera (orden por `updatedAt` descendente). Después de recargar, `localStorage` tiene el mismo contenido. | Pass | P1 · Purpose (follow the data) · sin datos |
| LI-03 | Lista | Tarjeta con evento de 120 caracteres y sin sección ni días, a 320px | El nombre hace salto de línea sin desbordar (`scrollWidth` = ancho del viewport). Sin evento se lee «Sin nombre de evento». Sin sección ni días, no queda la línea `sub` vacía. | Pass | P3 · ataque strings largos / null · sin datos |
| ED-01 | Editor | Escribir en cada campo y recargar a mitad de la edición | Cada tecla persiste: después de recargar, abrir la tarjeta muestra exactamente lo escrito en los 5 campos y en los ítems. El indicador dice «Guardado». | Pass | P1 · Purpose · sin datos |
| ED-02 | Editor | Botón atrás del navegador o de Android estando en el editor | Vuelve a la lista de la app, sin salir de la app ni ir a la página anterior. | Falla | P2 · User expectations (Android) · ataque back a mitad de flujo · `history.back()` en la emulación · sin datos |
| ED-03 | Editor | Duplicar y editar la copia | La copia se abre con un toast que lo avisa, tiene `id` nuevo, la fecha de cierre de hoy y los mismos ítems. Cambiar un ítem o el monto de la copia **no** cambia el original (se relee `localStorage`: el original queda intacto). | Pass | P1 · Purpose (datos) · la copia comparte arrays si el clon falla · sin datos |
| ED-04 | Editor | Eliminar → Cancelar, y después Eliminar → Aceptar | Con Cancelar no se borra nada. Con Aceptar vuelve a la lista, la tarjeta desaparece y la clave ya no tiene ese `id`. Si era el último, aparece el estado vacío. | Pass | P2 · CRUD · `dialogAction` del MCP · sin datos |
| ED-05 | Editor | Dos pestañas: crear el presupuesto A en la pestaña 1, después escribir en un presupuesto ya abierto en la pestaña 2 | A sigue existiendo después de escribir en la pestaña 2 (Purpose: no perder datos). Si hoy se pierde, es un hallazgo de last-write-wins sobre el array entero. | Falla | P2 · ataque dos pestañas · 2 páginas del MCP en el mismo contexto · sin datos |
| ED-06 | Editor | `presupuestos.budgets` con JSON corrupto al abrir la app | La app no se rompe. El dato corrupto **no** se pisa sin aviso en el primer guardado (Purpose). | Falla | P2 · **Robustez**: solo la app escribe esa clave · sembrar `localStorage.setItem(k,'{')` · sin datos |
| ED-07 | Editor | `localStorage` lleno o que tira error al escribir | El indicador pasa a «No se pudo guardar» en rojo y la app sigue usable. Al volver a escribir sin error vuelve a «Guardado». | Pass | P2 · Claims-UI · parchear `Storage.prototype.setItem` para que tire · sin datos |
| IT-01 | Ítems | Agregar, subir, bajar y quitar en primera, media y última posición | El orden en pantalla, en `localStorage` y en el PDF coincide. El primero no tiene ↑ y el último no tiene ↓. Al agregar, el foco va al ítem nuevo. | Pass | P2 · ataque posición · sin datos |
| IT-02 | Ítems | Quitar todos los ítems y generar el PDF | El PDF sale sin ítems y sin errores: título, evento y total, sin un hueco roto. | Pass | P3 · count 0 · sin datos |
| IT-03 | Ítems | Dejar un ítem nuevo con el texto por defecto «Alquiler de » sin completar | El PDF **no** debería imprimir un renglón suelto «Alquiler de». Si lo imprime, va como pregunta al producto. | Falla | P2 · Purpose · sin datos |
| IT-04 | Ítems | Ítem con «4x3 m², 30°, ñ, “comillas”, € y 😀» | En el PDF salen bien ², °, ñ, comillas y €. Para el emoji, ver pregunta abierta; nunca debe romper la generación. | Falla | P2 · ataque strings · las medidas reales usan m² · sin datos |
| IT-05 | Ítems | Ítem de 400 caracteres y un token de 80 caracteres sin espacios | El textarea crece sin scroll interno. En el PDF el texto corta dentro de los márgenes, sin pasarse del borde derecho. | Pass | P3 · ataque strings largos · sin datos |
| IT-06 | Ítems | 25 ítems de 2 líneas | El PDF pasa a una 2ª página sin cortar un ítem al pie. El total y la fecha no quedan pisados ni fuera de la hoja. | Pass | P2 · count muchos · sin datos |
| TO-01 | Total | Tabla de montos → letras: 1, 15, 16, 21, 100, 101, 1.000, 1.001, 21.000, 31.000, 100.000, 1.000.000, 2.000.000, 21.000.000, 24.000.000, 1.000.000.000 | Uno, Quince, Dieciséis, Veintiuno, Cien, Ciento Uno, Mil, Mil Uno, Veintiún Mil, Treinta y Un Mil, Cien Mil, Un Millón, Dos Millones, Veintiún Millones, Veinticuatro Millones, Mil Millones. | Pass | P1 · Claims-DOC (letras) · Statutes RAE · llamar `numberToTitleWords` en la consola · sin datos |
| TO-02 | Total | Escribir «24.000.000,50» o «24000000.5» | El monto **no** se multiplica por 100 (no queda `$ 2.400.000.050`). Lo esperable es redondear o ignorar los decimales y que quede `$ 24.000.000`. | Falla | P1 · plata · Purpose · sin datos |
| TO-03 | Total | Monto ≥ 1.000.000.000.000 (13 dígitos o más) | Las letras nunca muestran «undefined»: o salen bien o la app avisa que el monto excede el máximo. | Falla | P3 · borde · sin datos |
| TO-04 | Total | Editar las letras a mano y después cambiar el monto | Por Claims-UI las letras **no** cambian; ↻ las recalcula desde el monto. El PDF muestra exactamente lo que dicen los dos campos. Ver pregunta abierta sobre la discrepancia. | Pass | P1 · plata · Claims-UI · sin datos |
| TO-05 | Total | Borrar el monto, y escribir «abc» o «-5» | Monto vacío → total 0 y letras vacías (si no se editaron). El PDF muestra «$ 0.-». «-5» queda como 5 sin signo. | Pass | P3 · ataque números · sin datos |
| TO-06 | Total | Blur del monto, foco de nuevo y escribir un dígito al final | El formato `$ 24.000.000` no impide editar. Al agregar un 0 queda 240.000.000 y las letras pasan a «Doscientos Cuarenta Millones». | Pass | P2 · sin datos |
| DA-01 | Mis datos | Abrir ⚙, cambiar el teléfono y Cancelar; también Esc; también clic afuera | No se guarda en ninguno de los tres casos. Al reabrir aparece el valor anterior. | Pass | P2 · regresión del ciclo anterior (`returnValue` viejo) · sin datos |
| DA-02 | Mis datos | Cambiar todos los campos, Guardar con Enter en el teclado y recargar | Enter guarda (toast «Datos guardados»). Después de recargar, `presupuestos.issuer` tiene los valores nuevos y el siguiente PDF los usa. La ciudad nueva solo afecta a los presupuestos **nuevos**. | Pass | P1 · Purpose · sin datos |
| DA-03 | Mis datos | Vaciar CUIT y teléfono | El PDF omite esas líneas, sin «C.U.I.T.: » ni «Teléfono: » vacíos. | Pass | P3 · null · sin datos |
| DA-04 | Mis datos | `presupuestos.issuer` guardado por la versión anterior, con `tagline` | No aparece en el diálogo ni en el PDF y no rompe nada. | Pass | P3 · **Robustez** · migración entre versiones · sembrar la clave · sin datos |
| PD-01 | PDF | PDF del caso del docx (6 ítems, $ 24.000.000) | Una sola hoja A4, con el mismo orden de bloques que el docx: logo MR nuevo arriba a la izquierda, datos del emisor, «PRESUPUESTO», Evento, Días, sección, ítems, total con letras y lugar y fecha a la derecha. Lleva Montserrat y acentos azules. Pesa menos de 200 KB. | Pass | P1 · Claims-DOC · Claims-USR · sin datos |
| PD-02 | PDF | Nombre del archivo con evento `Fiesta "Sol" / 2026: final?` y con evento vacío | Sin `/ : * ? " < > \|`. Con el evento vacío queda «Presupuesto - presupuesto.pdf». | Pass | P3 · ataque strings · sin datos |
| PD-03 | PDF | Evento que el usuario ya escribió entre comillas, `“Fiesta”` | El PDF no muestra comillas dobles duplicadas. | Falla | P3 · Claims-DOC · sin datos |
| PD-04 | PDF | Lugar y fecha de 150 caracteres | El texto no se pasa del margen izquierdo ni se superpone con otros elementos. | Falla | P3 · strings largos · sin datos |
| PD-05 | PDF | Falla la carga de una fuente o del logo (request bloqueado) | Aparece el toast «No se pudo generar el PDF: …». No hay descarga ni share colgados. Al desbloquear vuelve a andar sin recargar. | Falla | P2 · ataque request que falla · bloquear `fonts/*.ttf` · sin datos |
| PD-06 | PDF | Doble toque rápido en «Compartir PDF» | Se genera un solo share o una sola descarga. No aparece una descarga extra por el error «earlier share has not yet completed». | Falla | P2 · ataque doble click · sin datos (escritorio); confirmar en el teléfono |
| PD-07 | PDF | Compartir a WhatsApp desde Android Chrome y desde iOS Safari, con la app instalada | Se abre la hoja de compartir del sistema con el PDF adjunto, y WhatsApp lo recibe con el nombre correcto. No falla por perder la activación del usuario mientras se genera el PDF (fuentes y logo). | Pass | P1 · Claims-USR · **inalcanzable hoy**: necesita HTTPS y un teléfono |
| OF-01 | Offline | Primera visita con red, después avión, recarga y generar PDF | La app abre desde la caché. El PDF se genera con Montserrat y el logo (todo en `SHELL`). | Pass | P1 · Claims-USR (celular en un evento sin señal) · emulación Offline · sin datos |
| OF-02 | Offline | Publicar un cambio con la app ya instalada, con red | El cambio aparece al abrir o recargar una vez, sin quedar atado a la versión vieja. | Pass | P2 · regresión de la estrategia cache-first anterior · editar un archivo y recargar · sin datos |
| OF-03 | Instalación | Manifest e íconos | El manifest es válido, con `theme_color` y `background_color` en `#0b0b0b` e íconos de 192 y 512 que cargan con status 200. Lighthouse no marca errores de installability. | Pass | P2 · Claims-USR · sin datos |
| UI-01 | Marca | Colores, tipografía y logo contra el manual MR | El fondo es `#0B0B0B`, las superficies `#1F1F1F` y el acento `#00AEEF`. Los títulos y montos usan Montserrat 800 cargada (`document.fonts.check`). El logo se ve sin un recuadro de fondo distinto del header. | Pass | P2 · Claims-USR (manual de marca) · sin datos |
| UI-02 | Accesibilidad | Contraste AA de todas las combinaciones de texto: texto, muted, placeholder, hint, botones y estado | Todo el texto ≥ 4,5:1, incluidos el placeholder `#6f6f6f` sobre `#1f1f1f` y el hint. Los bordes de los inputs ≥ 3:1 contra el fondo, o el campo se distingue por su relleno. | Falla | P2 · Statutes-WCAG · medir con un script los colores computados · sin datos |
| UI-03 | Accesibilidad | Objetivos táctiles y nombres accesibles | Todo botón visible mide ≥ 44×44. Los botones de ícono (volver, ⚙, ↑ ↓ ✕, ↻) tienen `aria-label`. El diálogo toma el foco al abrir y lo devuelve a ⚙ al cerrar. | Pass | P2 · Statutes-WCAG · snapshot a11y · sin datos |
| UI-04 | Presentación | 320px y 800px, con título largo en el editor | No hay scroll horizontal. El título hace ellipsis sin empujar «Guardado» ni ⚙ fuera de la pantalla. Los botones de la barra inferior entran en una línea. | Falla | P3 · ataque anchos intermedios · sin datos |
| UI-05 | Presentación | El último control del editor (Eliminar) con la barra fija abajo | Se puede scrollear hasta ver Eliminar entero por encima de la barra, con `safe-area` incluido. | Pass | P2 · thumb zone vs contenido tapado · sin datos |
| UI-06 | Presentación | Teclado abierto en el teléfono editando un ítem de abajo | El campo con foco no queda tapado por la barra fija ni por el teclado. | Pendiente | P2 · **inalcanzable hoy** en emulación: necesita un teléfono |

**No se re-corre:** no hay ronda previa; es el primer registro de la app.

**Cubierto por tests:** nada. El repo no tiene tests automáticos y TO-01 reemplaza al test unitario de `numero-a-letras.js` que falta.

**Del otro lado:** fuera de alcance. Sin backend; los datos viven en el dispositivo.

**Si sólo alcanza para 5:** TO-02, TO-01, ED-03, PD-01, OF-01.

**Preguntas al producto (respondidas el 2026-11-11):**
1. TO-04, letras que no coinciden con el monto → **se avisa**: aviso debajo del campo y confirmación al generar el PDF.
2. IT-04, emoji en ítems → **se quitan**.
3. ED-05, más de un dispositivo → **por ahora solo el teléfono**. Con un solo dispositivo alcanza con `localStorage`; igual se cubre el caso de dos pestañas o ventanas.
4. IT-03, ítem que quedó solo con «Alquiler de » → **se omite** del PDF.

## Ronda 1 · 2026-11-11 · MCP chrome-devtools

**27 Pass · 13 Falla · 0 Bloqueado · 2 Pendiente**

**Entorno:**
- `python3 -m http.server 8765` sirviendo la carpeta, sobre el commit `afd04e9` más el rebrand sin commitear.
- Chrome con el MCP, contexto aislado `qa-r1` (`localStorage` vacío), en 390×844 con touch, 320×640 y 800×900.
- Los datos de prueba llevan el prefijo `QA-R1` y viven solo en ese contexto aislado, que se descarta.

**Evidencia por caso:**

| ID | Evidencia medida |
|---|---|
| LI-01 | `localStorage` en `null`. Se ven el estado vacío y su grilla. `list-bar` visible; `edit-bar`, Volver y estado ocultos. |
| LI-02 | Tarjeta «QA-R1 Fiesta… / SET DE TELEVISIÓN · 20;21… / $ 24.000.000». Orden: al editar la copia queda `[Copia, Original]`; al editar el original, `[Original, Copia]`. |
| LI-03 | A 320px, `scrollWidth` es 320 con un nombre de 150 caracteres. Sin evento se lee «Sin nombre de evento\n$ 0», con 0 líneas `.sub`. |
| ED-01 | Después de recargar, los 5 campos y los ítems coinciden con lo escrito (se releyó `localStorage` y la pantalla). |
| ED-02 | `history.back()` desde el editor deja la pestaña en `about:blank`: se sale de la app. → H-02 |
| ED-03 | La copia tiene `id` nuevo, el toast «Copia creada…» y la fecha de cierre de hoy. Después de editarla, el original releído sigue con `item0` y total 24.000.000 intactos. |
| ED-04 | Con `confirm` en falso queda en `localStorage`. Con verdadero desaparece, `count` pasa de 2 a 1 y vuelve a la lista. |
| ED-05 | En la pestaña 1 se crea A (`[Orig, A]`). Al escribir en la pestaña 2 queda `[Orig]`: A se perdió. → H-03 |
| ED-06 | Sembrado `'[{"id":"x","event":"QA-R1 dato real"'`: la app arranca vacía y el primer guardado escribe `[{"id":"mwci…` sobre el dato. → H-08 |
| ED-07 | Con `setItem` tirando error se lee «No se pudo guardar» en `rgb(255,107,107)`. Al restaurarlo vuelve a «Guardado». |
| IT-01 | El foco va al ítem nuevo. El primero tiene [Bajar, Quitar], el del medio los 3, el último [Subir, Quitar]. Secuencia ABC→ACB→CAB→CB, igual en `localStorage`. |
| IT-02 | PDF de 1 página sin ítems, sin hueco roto (captura mirada). |
| IT-03 | El PDF imprime un renglón «Alquiler de» con viñeta. → H-10 |
| IT-04 | El ítem con emoji sale con todas las letras espaciadas y «Ø=Þ» en lugar del emoji. ², °, ñ, € y comillas se ven, pero espaciados. → H-09 |
| IT-05 | Textarea con `scrollHeight` = `clientHeight` = 309. En el PDF, la x máxima es 534 contra un margen de 533 pt (el token de 80 X se corta bien). |
| IT-06 | 25 ítems dan 3 páginas, sin ítems cortados. El total y la fecha quedan solos en la pág. 3, dentro de la hoja. |
| TO-01 | 16 de 16 coinciden, por ejemplo 21000 «Veintiún Mil», 31000 «Treinta y Un Mil», 1e9 «Mil Millones». |
| TO-02 | «24.000.000,50» se guarda como `2400000050`; «24000000.5», como `240000005`. → H-01 |
| TO-03 | 1e12 da « Mil Millones». 1.234.567.890.123 da «Treinta y Cuatro Mil… Millones…», que pierde el billón. → H-11 |
| TO-04 | Con las letras editadas, cambiar el monto las deja como estaban (`wordsEdited` en true). ↻ da «Veinticinco Millones». |
| TO-05 | Vacío da total 0 y letras «». «abc» da 0. «-5» da 5. |
| TO-06 | Al perder el foco: `$ 24.000.000`. Con un 0 al final: 240000000, «Doscientos Cuarenta Millones». |
| DA-01 | Esc con el teclado real: el diálogo se cierra y el teléfono queda en `<teléfono original>`, igual en el estado y en `localStorage`. Cancelar ya pasó en la ronda de desarrollo. Tocar afuera no cierra el `<dialog>` nativo, así que no hay riesgo de guardar. |
| DA-02 | Enter con el teclado real en «Ciudad» guarda. Después de recargar, `presupuestos.issuer` tiene los 5 valores nuevos y el PDF contiene «QA NOMBRE» y el CUIT nuevo. Un presupuesto nuevo cierra «Mendoza, …» y los viejos siguen en «San Juan, …». |
| DA-03 | El PDF sin CUIT ni teléfono omite las dos líneas (captura mirada). |
| DA-04 | Con `tagline` sembrado: campos `[name,cuit,email,phone,city]` y `'tagline' in issuer` en false. |
| PD-01 | 1 página, 72.937 bytes, mismos bloques que el docx (captura mirada). |
| PD-02 | Da «Presupuesto - Fiesta Sol  2026 final.pdf» (con doble espacio, cosmético) y «Presupuesto - presupuesto.pdf». |
| PD-03 | Sale «““Fiesta””». → H-12 |
| PD-04 | El lugar y fecha de 150 caracteres arranca fuera del borde izquierdo y se corta (captura mirada). → H-13 |
| PD-05 | Con `.ttf` bloqueado aparece el toast «No se pudo generar el PDF: Failed to fetch». Al desbloquear no hay descarga, el toast repite el error y `fontDataPromise` sigue rechazada. → H-04 |
| PD-06 | Doble clic con un `share` lento: `shareCalls` 2 y 1 descarga extra (el 2º recibe `InvalidStateError` y cae a la descarga). → H-05 |
| OF-01 | Con el servidor apagado (`curl` da 000) la app recarga controlada por el service worker. El PDF sale de 1 página con Montserrat embebida y la imagen. La emulación «Offline» del MCP **no** cortaba la red, así que esa prueba se descartó. |
| OF-02 | Archivo sonda: v1 y después v2 en disco; el `fetch` de la página devuelve v2 (va primero a la red). |
| OF-03 | Manifest «Presupuestos MR», `standalone`, `theme` y `bg` en `#0b0b0b`. Íconos 192 y 512 con 200 y medida real, `apple-touch` 180 con 200. No se corrió Lighthouse de PWA. |
| UI-01 | `body` `rgb(11,11,11)`, inputs `rgb(31,31,31)`, primario `rgb(0,174,239)` con texto `rgb(11,11,11)`, títulos Montserrat 800 cargada. |
| UI-02 | axe-core 4.10.2 sin violaciones de contraste en el editor, la lista y el diálogo. A mano: placeholder `#6f6f6f` sobre `#1f1f1f` da **3,28:1**; el borde del input contra la página, **1,56:1**, y el relleno contra la página, **1,19:1**. → H-07 |
| UI-03 | 0 botones visibles por debajo de 44×44 y 0 botones de ícono sin nombre. Clic real en ⚙: foco en «name». Esc devuelve el foco a `open-issuer`. → H-14 |
| UI-04 | A 320px, los botones de la barra miden 144 + 186 px y no entran en 288: «Descargar» se corta por la izquierda y «Compartir PDF» por la derecha (captura mirada). A 800px, `scrollWidth` es 800. → H-06 |
| UI-05 | A 320×640 y al fondo del scroll, Eliminar termina en y=544 y la barra empieza en 567. |
| PD-07 · UI-06 | Pendientes: necesitan HTTPS y un teléfono real. |

## Hallazgos

| ID | Caso | Sev. | Síntoma | Causa raíz | Resolución | Regresión | Previsto | Estado | Detectado |
|---|---|---|---|---|---|---|---|---|---|
| H-01 | TO-02 | P1 | Un monto con decimales se multiplica por 100 o por 10 y llega así al PDF. | `parseMoney` borra todo lo que no es dígito, también el separador decimal. | `parseMoney` interpreta «,» como decimal y un «.» seguido de 1, 2 o 4+ dígitos como decimal; redondea y topea en 999.999 billones. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 · 2026-11-11 |
| H-02 | ED-02 | P2 | El botón atrás (Android o navegador) cierra la app en vez de volver a la lista. | Las pantallas se alternan con `hidden`, sin entradas de historial (`pushState` ni `popstate`). | Al abrir el editor se agrega una entrada con `pushState({budgetId})`; `popstate` vuelve a la lista; Volver y Eliminar usan `history.back()`; Duplicar usa `replaceState`; al recargar se reabre el editor. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-03 | ED-05 | P2 | Con dos pestañas abiertas, se pierde lo creado en la otra. | Cada pestaña tiene su propio array `budgets` en memoria y escribe el array entero; no escucha el evento `storage`. | `persist()` relee `localStorage` antes de escribir y hace upsert o delete por `id`; el evento `storage` refresca la lista o avisa si el presupuesto abierto se eliminó. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-04 | PD-05 | P2 | Después de una falla de red, el PDF no vuelve a generarse hasta recargar. | `fontDataPromise ??=` guarda la promesa rechazada. | `loadFontData` borra la promesa cacheada si falla, y además valida `response.ok`. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-05 | PD-06 | P2 | Un doble toque en Compartir abre el menú y además descarga el archivo. | No hay guarda de «en curso». El `InvalidStateError` del 2º `share` cae a `download`. | `runPdfAction` con una guarda `pdfBusy` y `aria-disabled` mientras se genera o se comparte. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-06 | UI-04 | P2 | A 320px la barra inferior se sale de la pantalla y corta «Compartir PDF». | Los botones flex tienen `white-space: nowrap` y `min-width: auto`: 144 + 186 + 10 > 288. | `min-width: 0` en la barra; debajo de 360px «Descargar» queda solo con el ícono (conserva su `aria-label`). | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-07 | UI-02 | P2 | El contorno de los campos casi no se distingue del fondo, y el placeholder no llega a AA. | El borde `#333` da 1,56:1 y el relleno `#1f1f1f` 1,19:1, ambos por debajo del 3:1 de SC 1.4.11. El placeholder `#6f6f6f` da 3,28:1. | Borde de los campos en `--field-border: #6b6b6b` (3,69:1) y placeholder en `#8f8f8f` (5,1:1). | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-08 | ED-06 | P2 | Un dato corrupto en `localStorage` se pisa sin avisar en el primer guardado. **Robustez**. | `readJson` devuelve `[]` ante un error y el siguiente `saveBudgets` sobrescribe la clave. | `loadBudgets` mueve el valor dañado a `presupuestos.budgets.dañado-<ts>` y avisa con un toast. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-09 | IT-04 | P2 | Un emoji en un ítem desarma la línea entera del PDF. | Helvetica usa WinAnsi: jsPDF codifica toda la cadena carácter por carácter cuando hay uno fuera del juego. | Decisión del producto: se quitan. `stripEmoji` en cada input y en Mis datos, con un toast; `toPdfText` deja en el PDF solo caracteres WinAnsi. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-10 | IT-03 | P2 | Un ítem que quedó con el texto por defecto sale como «Alquiler de» en el PDF. | El filtro solo descarta los ítems vacíos. | Decisión del producto: se omite. `isPrintableItem` descarta los ítems vacíos o iguales a `DEFAULT_ITEM_TEXT`. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-11 | TO-03 | P3 | Montos de un billón o más dan letras equivocadas sin aviso. | `numberToWords` solo maneja hasta 999.999 millones: `below1e6` recibe un valor de miles ≥ 1000. | `numberToWords` suma billones (`below1e12` para el resto). | n/a: el usuario pidió no sumar e2e | sí (esperaba «undefined»; es peor) | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-12 | PD-03 | P3 | Las comillas salen duplicadas si el usuario ya las escribió. | `pdf.js` siempre envuelve el evento en “ ”. | `stripWrappingQuotes` saca solo las comillas que envuelven el texto entero. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-13 | PD-04 | P3 | Un lugar y fecha largo se corta por el borde izquierdo de la hoja. | Se escribe en una sola línea con `align: right`, sin `splitTextToSize`. | El lugar y fecha pasa por `splitTextToSize(CONTENT_WIDTH)` con `align: right` y corta página si no entra. | n/a: el usuario pidió no sumar e2e | sí | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-14 | UI-03 | P3 | El nombre accesible del campo «En letras» incluye el nombre del botón ↻ y el texto de ayuda. | El `<label>` envuelve el input, el botón y el hint. | El `<label for>` cubre solo el input; el hint y el aviso van por `aria-describedby`. | n/a: el usuario pidió no sumar e2e | de casualidad | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-15 | UI-02 | P3 | La lista no tiene `h1` (axe `page-has-heading-one`). | El `h1` se oculta en la lista y el logo es una imagen. | El título de la lista pasó a `h1`. | n/a: el usuario pidió no sumar e2e | no | Arreglado (sin commitear) · re-verificado en R2 | R1 |
| H-16 | H-14 (re-ronda) | P3 | El aviso de letras oculto y el toast ya cerrado dejaban su último texto, y el lector de pantalla lo leía como descripción del campo o región `status`. | El texto de un elemento oculto que se referencia con `aria-describedby` se sigue leyendo; el toast solo se ocultaba con CSS. | Se vacía el `textContent` al ocultar el aviso y al cerrar el toast. | n/a: el usuario pidió no sumar e2e | de casualidad (lo mostró el snapshot a11y de la re-ronda) | Arreglado (sin commitear) · re-verificado en R2 | R2 · 2026-11-11 |

**Qué faltó en el plan (`/qa-case-design`):**
- H-14: el ataque de presentación con «nombre accesible de lo nuevo» debió aplicarse a todos los inputs, no solo a los botones de ícono.
- H-15: correr axe best-practice en cada pantalla, y no solo las reglas de contraste.

**Lección de esta ronda:** la emulación «Offline» del MCP no cortó la red en esta app. Un negativo de offline solo vale con el servidor apagado y verificado con `curl`.

## Ronda 2 · 2026-11-11 · re-ronda de arreglos · MCP chrome-devtools

**16 hallazgos re-verificados en Pass · 1 nuevo (H-16), arreglado y re-verificado · vecinos en Pass**

**Entorno:** igual que en R1, en el contexto aislado `qa-r2` con prefijo `QA-R2`, a 390, 320 y 800px. No hay suite automática: el usuario pidió no sumar e2e.

| Caso | Hallazgo | Evidencia R2 | Estado |
|---|---|---|---|
| TO-02 | H-01 | 24.000.000,50 → 24000001 · 24000000.5 → 24000001 · 24.000.000 → 24000000 · `$ 24.000.000` → 24000000 · 1.500 → 1500 · 1.5 → 2 · `24.000.000,` → 24000000 | Pass |
| TO-03 | H-11 | 1.234.567.890.123 → «Un Billón Doscientos Treinta y Cuatro Mil… Ciento Veintitrés». Un número de 20 dígitos se topea en 999.999.999.999.999 («Novecientos Noventa y Nueve Billones…»). | Pass |
| TO-04 | — | Las letras «…de Pesos» equivalentes no avisan. Con el monto cambiado aparece el aviso «Las letras no coinciden con el monto ($ 25.000.000)…». Descargar pide confirmación y, si se cancela, no hay descarga (0). ↻ oculta el aviso. | Pass |
| ED-02 | H-02 | `history.back()` deja la URL en `localhost:8765/` con la lista visible. Adelante reabre el editor; el Volver de la app vuelve a la lista. Duplicar seguido de atrás vuelve a la lista. Al recargar en el editor, lo reabre. | Pass |
| ED-05 | H-03 | La pestaña 1 crea A y la 2 edita otro presupuesto: quedan 3 presupuestos, cada uno con lo que escribió cada pestaña. | Pass |
| ED-06 | H-08 | La clave dañada pasa a `presupuestos.budgets.dañado-1794425385720` con el valor original, y aparece el toast que lo avisa. | Pass |
| IT-03 · IT-04 · PD-03 · PD-04 | H-10 · H-09 · H-12 · H-13 | PDF de una página (captura mirada): sin «Alquiler de» suelto; «Pantalla 4x3 m², 30°, ñandú, “comillas”, 500 € y listo» se ve normal; Evento «“Fiesta”» sin duplicar; lugar y fecha en 3 líneas alineadas a la derecha. x mínima 79 y x máxima 534 de 595 pt. En el editor, el emoji se quita al tipear y aparece el toast. | Pass |
| PD-05 | H-04 | Con `.ttf` bloqueado aparece el toast y 0 descargas; al desbloquear, sin recargar, 1 descarga. | Pass |
| PD-06 | H-05 | Doble clic con un `share` lento: `shareCalls` 1, 0 descargas extra y botones habilitados al terminar. | Pass |
| UI-02 | H-07 · H-15 | axe-core: 0 violaciones y 0 incompletos en el editor, en el editor con el aviso y en la lista (se fue `page-has-heading-one`). Placeholder 5,1:1, borde 3,69:1 y aviso 12,79:1. | Pass |
| UI-03 | H-14 · H-16 | Snapshot: textbox «En letras» con su descripción por separado. Al ocultar el aviso queda `""`; el toast, después de cerrarse, queda `""`. | Pass |
| UI-04 | H-06 | A 320px, Descargar mide 48×48 (x 16–64) y Compartir PDF 230×48 (x 74–304), con el texto entero (captura mirada). | Pass |

**Vecinos re-corridos** (el guardado pasó a `persist()` y cambió el historial):

| Caso | Evidencia R2 | Estado |
|---|---|---|
| ED-01 | Después de recargar, el editor tiene «QA-R2 Vecino», `$ 1.500.000`, «Un Millón Quinientos Mil» y el ítem. | Pass |
| ED-03 | Copia con «COPIA» y total 7; el original releído sigue con «Alquiler de pantalla» y 1.500.000. | Pass |
| ED-04 | Eliminar la copia la saca del storage, deja el original y vuelve a la lista (`history.back`). | Pass |
| LI-02 | El editado queda primero en la lista. | Pass |
| DA-02 | Guardar Mis datos: el teléfono con 📞 se guarda como `<teléfono original>` y el diálogo se cierra. | Pass |
| OF-01 | Con el servidor apagado (`curl` da 000), la app recarga con caché `presupuestos-v6`, reabre el editor y genera un PDF de 1 página con Montserrat y el logo. | Pass |

**Siguen pendientes:** UI-06 (necesita un teléfono real).

**2026-11-11, en el teléfono:** PD-07 da Pass. El usuario instaló la PWA desde https://federicoirrazabal.github.io/presupuestos-led/ y compartió el PDF a WhatsApp sin problemas.

### Casos nuevos y a re-correr · descripción, datos del emisor, firma y DNI · 2026-11-12

Commits `9b55cd6..8eaa920` sobre `main`:
- favicon;
- campo «Descripción» en el presupuesto, que se imprime después de Días;
- en Mis datos, «N° de proveedor del Estado» y «Dirección», que van al encabezado;
- «Firma» en cursiva Allura, con vista previa, y bloque de firma al pie del PDF (firma, NOMBRE, D.N.I Nº, Teléfono);
- DNI deducido de los 8 dígitos centrales del CUIT: editable, sigue al CUIT mientras no se escriba otro, y el PDF usa el deducido si el DNI queda vacío.

**Oráculo nuevo:**
- **Claims-PDF2**: el PDF de ejemplo `Presupuesto (1).pdf`, con P. Estado Nº, «Descripción:» y la firma cursiva con nombre, DNI y teléfono debajo, a la derecha.
- **Claims-USR**: pedidos del usuario del 2026-11-12: «el DNI se tiene que deducir del CUIT, pero tiene que seguir siendo campo editable».

Clases que dejaron escapar los planes anteriores, aplicadas acá:
- H-14: nombre accesible de cada input nuevo.
- H-15: axe best-practice en cada pantalla.
- H-16: texto oculto que se sigue leyendo.

Todo `sin datos`: corre en el contexto aislado del MCP con prefijo `QA-R3`.

**Nuevos:**

| ID | Área | Caso | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ED-08 | Editor | Escribir una descripción de 3 líneas, recargar y reabrir | Después de recargar, `localStorage` tiene `description` con el texto exacto. El textarea abre con la altura del contenido, sin scroll interno (`scrollHeight` = `clientHeight`). | Pass | P1 · Purpose (no perder datos) · diff `fields` + `fitTextarea` |
| ED-09 | Editor | Presupuesto guardado antes del cambio, sin la clave `description` | El campo abre vacío (no «undefined») y el PDF sale sin el bloque «Descripción:». Al escribir se guarda la clave. | Pass | P2 · **Robustez** (migración) · sembrar un presupuesto sin `description` |
| ED-10 | Editor | Descripción con saltos de línea (Enter), emoji y 1.500 caracteres | El emoji se quita al tipear, con toast. En el PDF se respetan los saltos de línea. Si no entra, pasa a otra página sin pisar el total ni la firma, y nada se sale de los márgenes (x máxima ≤ 533 pt). | Pass | P2 · ataques strings largos y multilínea |
| PD-08 | PDF | Encabezado con todos los datos del emisor, y después con N° de proveedor y dirección vacíos | Con datos: el orden es nombre, «C.U.I.T.: …», «P. Estado Nº 78101», dirección, mail y «Teléfono: …» (Claims-PDF2). Vacíos: esas líneas no aparecen y no queda una línea en blanco. | Pass | P2 · Claims-PDF2 |
| PD-09 | PDF | Bloque de firma completo | Abajo a la derecha, después de lugar y fecha: la firma en cursiva (fuente `Allura` embebida en el PDF), y debajo NOMBRE en mayúsculas, «D.N.I Nº 42.917.638» y «Teléfono: …», centrados entre sí y dentro de la hoja. | Pass | P1 · Claims-PDF2 |
| PD-10 | PDF | Variantes: sin firma pero con nombre; sin nada en Mis datos | Sin firma, solo las líneas de texto, sin un hueco donde iría la cursiva. Sin datos, no hay bloque de firma. | Pass | P2 · null |
| PD-11 | PDF | Firma de 45 caracteres y nombre de 60 | Ningún texto del bloque de firma se pasa del borde derecho de la hoja (595 pt) ni del margen derecho (533 pt). | Falla | P2 · ataque strings largos · el bloque se centra a 32 mm del margen derecho y no se corta en líneas |
| PD-12 | PDF | Firma con «Ñañez Peña», tildes y «ü» | La cursiva muestra ñ, tildes y ü (están en el subconjunto Latin-1 de Allura), sin cuadritos ni letras espaciadas. | Falla | P2 · clase H-09 (glifos) |
| PD-13 | PDF | Presupuesto largo, con el bloque de firma cerca del pie | El bloque de firma pasa entero a la página siguiente, sin partirse entre dos páginas. | Pass | P2 · ataque posición · 22 ítems para que el cierre quede cerca de los 280 mm |
| DA-05 | Mis datos | Cargar N° de proveedor, dirección, firma y DNI, guardar y recargar | Después de recargar, `presupuestos.issuer` tiene los 4 valores, el diálogo los muestra y el PDF los usa. | Pass | P1 · Purpose |
| DA-06 | Mis datos | Datos guardados antes del cambio (sin las claves nuevas) | El diálogo muestra los campos nuevos vacíos (no «undefined»). Si el CUIT guardado es válido, el DNI aparece ya deducido al abrir. | Pass | P2 · **Robustez** (migración) · sembrar `presupuestos.issuer` con 5 claves |
| DA-07 | Mis datos | Tabla CUIT → DNI: «27-42917638-2», «27429176382», «27 42917638 2», «20-08123456-7», «27-4291» (incompleto), «274291763821» (12 dígitos), «abc» | 42.917.638 · 42.917.638 · 42.917.638 · 8.123.456 · vacío · vacío · vacío | Pass | P2 · Claims-USR · dato que va al PDF |
| DA-08 | Mis datos | DNI escrito a mano, cambio de CUIT, y después borrar el DNI y cambiar el CUIT | El DNI manual se mantiene al cambiar el CUIT. Con el DNI borrado, vuelve a seguir al CUIT. | Pass | P2 · Claims-USR («tiene que seguir siendo editable») |
| DA-09 | Mis datos | Abrir, cambiar el CUIT (el DNI se autocompleta) y cerrar con Cancelar y con Esc | No se guarda nada: `presupuestos.issuer` no cambia, ni CUIT ni DNI. Al reabrir aparecen los valores guardados. | Pass | P2 · regresión de la clase DA-01 en un diálogo que ahora autocompleta |
| DA-10 | Mis datos | Guardar con el DNI vacío y CUIT válido; y con el DNI vacío y CUIT inválido | Con CUIT válido, el PDF dice «D.N.I Nº» con el DNI deducido. Con CUIT inválido, no hay línea de DNI y no aparece «D.N.I Nº » suelto. | Pass | P2 · null |
| DA-11 | Mis datos | Vista previa de la firma | Se actualiza al tipear y se ve en Allura cargada (`document.fonts.check`). Vacía muestra «Así se verá tu firma» en gris. Un emoji se quita del input y de la vista previa. | Pass | P3 · Claims-USR («esa tipografía cursiva») |
| UI-07 | Accesibilidad | Diálogo con los campos nuevos y editor con la descripción | axe (wcag2a/aa y best-practice) da 0 violaciones en el diálogo y el editor. Nombres accesibles exactos: «N° de proveedor del Estado», «Dirección», «Firma (se escribe en cursiva)», «DNI» (la ayuda va como descripción, no en el nombre), «Descripción». La vista previa queda fuera del árbol (`aria-hidden`). | Pass | P2 · clases H-14 y H-15 |
| UI-08 | Presentación | Diálogo a 320×568 y a 390×844 | El diálogo scrollea, Guardar y Cancelar quedan alcanzables, no hay scroll horizontal y la vista previa de una firma larga no desborda (hace ellipsis). | Pass | P2 · el diálogo creció ~60 % |
| UI-09 | Accesibilidad | Contraste de lo nuevo | Placeholder de la vista previa `#767676` sobre `#fff` ≥ 4,5:1; la firma `#0b0b0b` sobre blanco ≥ 4,5:1; el hint del DNI ≥ 4,5:1 sobre el fondo del diálogo. | Pass | P3 · Statutes-WCAG |
| OF-04 | Offline | Con el servidor apagado: abrir Mis datos y generar un PDF con firma | La vista previa se ve en cursiva y el PDF tiene la fuente `Allura` (`allura.ttf` y `allura.woff2` están en `SHELL`, caché `presupuestos-v10`). | Pass | P1 · Claims-USR (se usa en eventos sin señal) · apagar el `http.server` y verificar con `curl` (lección de R1) |
| FV-01 | Favicon | Íconos de la pestaña | Los 3 `<link rel="icon">` responden 200 con su tamaño real (16, 32 y `.ico` 16/32/48) y también con el servidor apagado. | Pass | P3 · pedido del usuario del 2026-11-11 |

**A re-correr** (su expectativa no cambió):

| ID | Clase | Por qué | Estado |
|---|---|---|---|
| PD-01 | Recent | El encabezado y el final de `buildPdf` cambiaron. Debe seguir en una hoja con datos completos de emisor y firma. | Falla |
| PD-05 | Repaired | `FONTS` suma `allura.ttf`. Bloquear solo ese archivo debe dar el toast y recuperarse sin recargar (H-04). | Pass |
| IT-06 | Recent | Paginación: ahora hay un bloque más al final (firma). | Pass |
| ED-01 | Core | El mapa `fields` cambió: los 5 campos y los ítems deben persistir. | Pass |
| ED-03 | Recent | Duplicar debe copiar la descripción, y editarla en la copia no debe tocar el original. | Pass |
| DA-01 · DA-02 | Recent | El diálogo cambió: Esc, Cancelar y Enter con los campos nuevos. | Pass |
| UI-05 | Recent | El editor es más largo: el último control debe seguir quedando por encima de la barra. | Pass |

**No se re-corre:**
- LI, TO e IT-01 a IT-05: el diff no toca la lista, los montos ni los ítems.
- ED-02 y ED-04 a ED-07, PD-02 a PD-04, PD-06 y PD-07: el historial, el guardado, la limpieza de texto y el share no cambiaron.
- UI-01 a UI-04: lo reemplazan UI-07 a UI-09.
- OF-01 a OF-03: los reemplaza OF-04.

**Cubierto por tests:** nada; el usuario pidió no sumar e2e.

**Si sólo alcanza para 5:** OF-04, PD-09, DA-05, ED-08, DA-07.

**Preguntas abiertas al producto:**
1. Un CUIT de empresa (30-, 33- o 34-) no tiene DNI, y la deducción igual inventa uno. ¿Se deduce solo para 20-, 23-, 24- y 27-?
2. En el ejemplo, el encabezado tiene dos teléfonos y la firma uno solo. ¿Hace falta un «Teléfono de la firma» aparte?

## Ronda 3 · 2026-11-12 · descripción, emisor, firma y DNI · MCP chrome-devtools

**R3: 25 Pass · 3 Falla (PD-01, PD-11, PD-12), de un total de 28 · después de los arreglos, los 3 re-verificados en Pass.** ED-08 pasó su esperado de persistencia, pero dejó H-19.

**Entorno:**
- `python3 -m http.server 8765` sobre `8eaa920` más los arreglos de esta ronda.
- Contexto aislado `qa-r3` en 390×844 y 320×568.
- Datos sembrados con `initScript`: un emisor viejo de 5 claves y un presupuesto sin `description`. Los datos de prueba llevan el prefijo `QA-R3`.
- El texto de los PDF se extrajo con PyMuPDF. Los textos en Montserrat van codificados dentro del PDF, así que buscar la cadena en `doc.output()` no puede dar positivo: el primer chequeo de ED-09 se descartó por eso.

| ID | Evidencia R3 |
|---|---|
| ED-08 | Después de recargar, `description` coincide en `localStorage` y en el campo. La altura quedó en `scrollHeight` 117 / `clientHeight` 115, 2px corta (→ H-19); después del arreglo, 117/117 y 140/140 al tipear. |
| ED-09 | El presupuesto sembrado sin la clave abre el campo en `""`. El texto extraído del PDF no tiene «Descripción:». Al escribir se guarda «agregada». |
| ED-10 | 2 páginas; los saltos de línea se respetan (captura mirada); x máxima 533. El emoji se quita al tipear (mismo mecanismo que DA-11). |
| PD-08 | Con datos: «P. Estado Nº 78101» y la dirección en el encabezado. Vacíos: no hay línea de «Estado» en el texto extraído. |
| PD-09 | Span en fuente `Allura` de 26 pt, «Celeste Irrazabal», y debajo NOMBRE, «D.N.I Nº 42.917.638» y «Teléfono: …» (captura mirada). |
| PD-10 | Sin firma: no hay span Allura y las líneas siguen. Sin datos: no hay DNI ni Allura. |
| PD-11 | Firma de 45 caracteres: x1 = 611 sobre una hoja de 595 (→ H-18). Después del arreglo: 16 pt, x 236–494; máximo 535 (rebaba del glifo, igual que R1). |
| PD-12 | ñ, tildes y ü salen bien en cursiva (captura mirada), pero x1 = 558 pasa el margen de 533 (→ H-18). Después del arreglo: x 301–533. |
| PD-13 | El bloque entero pasa a la pág. 2 y no se parte. Después del arreglo de H-17, la pág. 2 tiene cierre 136–142 mm y firma 149–171 mm. |
| DA-05 | Después de recargar, `presupuestos.issuer` tiene `providerNumber` 78101, `address`, `signature` y `dni`, y el diálogo los muestra. |
| DA-06 | Con el emisor sembrado de 5 claves, los campos nuevos abren en `""` y el DNI en «42.917.638», deducido al abrir. |
| DA-07 | 42.917.638 · 42.917.638 · 42.917.638 · 8.123.456 · vacío · vacío · vacío. |
| DA-08 | El DNI escrito a mano (11.111.111) se mantiene al cambiar el CUIT. Con el DNI borrado, vuelve a 42.917.638. |
| DA-09 | Con Cancelar, `presupuestos.issuer` queda idéntico. Con Esc, el diálogo se cierra y el storage no cambia (sigue el emisor viejo). |
| DA-10 | DNI vacío y CUIT válido: «D.N.I Nº 42.917.638». DNI vacío y CUIT «27-4291»: no hay línea de DNI. |
| DA-11 | Vacía: «Así se verá tu firma» en `rgb(118,118,118)`. Con texto: Allura cargada; «🖊️» se quita del input y aparece el toast. |
| UI-07 | axe 4.10.2 da 0 violaciones y 0 incompletos en el editor y en el diálogo. En el snapshot, los textbox se llaman «N° de proveedor del Estado», «Dirección», «Firma (se escribe en cursiva)» y «DNI» (con la ayuda como descripción). Los encabezados quedan en h2 «MIS DATOS» y h3 «FIRMA». La vista previa tiene `aria-hidden="true"` y la descripción del editor se llama «Descripción». |
| UI-08 | A 320×568, el diálogo scrollea y Guardar queda visible. `scrollWidth` 320. La vista previa larga hace ellipsis (captura mirada). |
| UI-09 | Placeholder de la vista previa 4,54:1, firma 19,68:1, hint del DNI 7,8:1. |
| OF-04 | Con el servidor apagado (`curl` da 000): vista previa en Allura y PDF de 1 página con `/BaseFont /Allura`. El favicon responde 200 desde la caché. |
| FV-01 | `favicon.ico` 200 48×48, `favicon-32` 200 32×32 y `favicon-16` 200 16×16; los 5 assets nuevos están en la caché `presupuestos-v10`. |
| PD-01 | Con los datos del emisor completos, el docx sale en 2 páginas, con la firma sola en la 2ª (→ H-17). Después del arreglo: 1 página, cierre en 245–250 mm y firma en 257–280 mm (captura mirada). |
| PD-05 | Primer intento descartado: la promesa de las fuentes ya estaba cargada, así que el bloqueo no podía fallar. Con `fontDataPromise` vaciada y `allura.ttf` bloqueado: toast «No se pudo generar el PDF: Failed to fetch» y 0 descargas. Al desbloquear, 1 descarga sin recargar. |
| IT-06 | 25 ítems dan 3 páginas, con la firma entera en la pág. 3. |
| ED-01 · ED-03 | Persisten los 5 campos. Duplicar copia la descripción; editar la copia deja el original intacto; eliminar la copia la saca del storage. |
| DA-01 · DA-02 | Con el teclado real: Esc no guarda (DA-09) y Enter guarda, con el toast «Datos guardados». |
| UI-05 | A 320×568, Eliminar termina en 472 y la barra empieza en 495. |

**Hallazgos de R3**

| ID | Caso | Sev. | Síntoma | Causa raíz | Resolución | Regresión | Previsto | Estado | Detectado |
|---|---|---|---|---|---|---|---|---|---|
| H-17 | PD-01 | P2 | Con los datos del emisor completos, el presupuesto del docx pasa a 2 páginas y la firma queda sola en la 2ª. | El bloque reservaba 20 mm de espacio más 32 mm fijos, contra un límite de 280 mm. | El alto se calcula según las líneas reales (7 mm de firma + 4,2 mm por línea), con 10 mm de espacio y límite a 10 mm del borde. | n/a: el usuario pidió no sumar e2e | sí (re-corrida Recent) | Arreglado (sin commitear) · re-verificado en R3 | R3 · 2026-11-12 |
| H-18 | PD-11 · PD-12 | P2 | Una firma larga se sale de la hoja (x 611 > 595), y una de 22 letras pasa el margen derecho. | El bloque se centraba siempre a 32 mm del margen, sin medir el ancho. | La firma se achica hasta el 60 % del ancho útil (mínimo 14 pt) y el centro se corre a la izquierda según el ancho del bloque. | n/a | sí | Arreglado (sin commitear) · re-verificado en R3 | R3 |
| H-19 | ED-08 | P3 | El textarea de la descripción queda 2px más bajo que el texto y corta la última línea. | `fitTextarea` usaba `scrollHeight`, que no incluye los bordes, con `box-sizing: border-box`. Los ítems no lo mostraban porque no tienen borde. | Suma `offsetHeight - clientHeight`. | n/a | sí | Arreglado (sin commitear) · re-verificado en R3 | R3 |

**Lecciones de R3** (para `/qa-case-design`):
- Un negativo sobre el binario del PDF no vale con fuentes embebidas: extraer el texto.
- Un bloqueo de red no prueba nada si el recurso ya está cacheado en memoria: vaciar la caché antes.

**Preguntas abiertas al producto:** las dos de la sección de casos (CUIT de empresa y teléfono de la firma).
