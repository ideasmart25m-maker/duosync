---
description: Publica y certifica GitHub -> Vercel + Supabase sin compartir secretos
---
PUBLICACION SEGURA Y CONTINUA

Aplica íntegro `docs/sistema/PROMPT-DEPLOY.txt` y su fuente canónica
`docs/sistema/62-PUBLICACION-SEGURA-Y-CONTINUA.md`. No resumas ni omitas P0-P9.

Contexto no sensible proporcionado por el usuario:
$ARGUMENTS

Si `$ARGUMENTS` contiene una clave, token, password, cookie, connection string, HOTTOK o secreto:
no lo repitas ni lo uses; detente, indícale que lo revoque/rote y aplica el incidente de 62.

El cierre exige `PUBLICATION-CERTIFICATE.md`, `RELEASE-MANIFEST.json`, SHA coincidente y la prueba de
una segunda publicación automática seguida de su reversión. `vercel link`, `vercel --prod` o una URL
viva no sustituyen `Settings -> Git -> Connected Git Repository` ni el commit canario automático.

