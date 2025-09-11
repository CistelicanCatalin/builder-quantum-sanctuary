# WP Manager Client (WordPress plugin)

Acest plugin adaugă endpoint-urile necesare pentru integrarea cu dashboard-ul tău:

- GET `wpm/v1/status` – informații despre site, versiuni și pluginuri active
- POST `wpm/v1/admin-login` – generează URL de login one‑click (token 5 minute)
- POST `wpm/v1/maintenance` – pornește/oprește mentenanța (`.maintenance`)
- POST `wpm/v1/plugins/activate` – activează un plugin `{ file }`
- POST `wpm/v1/plugins/deactivate` – dezactivează un plugin `{ file }`

Autentificare: toate rutele (în afară de token handler) verifică Bearer `Authorization: Bearer <API_KEY>`.
Cheia se generează automat la activare și este vizibilă în pagina de admin a pluginului.

## Instalare

1. Copiază folderul `wp-manager-client/` în `wp-content/plugins/` pe site-ul WordPress
2. Activează pluginul din WP Admin → Plugins
3. În „WP Manager Client” vezi/regenerezi API key-ul
4. În dashboard-ul tău, când adaugi site-ul, salvează `url` și `apiKey` în DB

## Test rapid

- Status: `GET https://site.ro/wp-json/wpm/v1/status` cu header `Authorization: Bearer <API_KEY>`
- Admin login: `POST https://site.ro/wp-json/wpm/v1/admin-login` cu același header → primești `{ url }`
- Mentenanță: `POST https://site.ro/wp-json/wpm/v1/maintenance` body `{ "enable": true }`
- Activate: `POST https://site.ro/wp-json/wpm/v1/plugins/activate` body `{ "file": "akismet/akismet.php" }`
- Deactivate: `POST https://site.ro/wp-json/wpm/v1/plugins/deactivate` body `{ "file": "akismet/akismet.php" }`

## Securitate

- Token-ul de admin este valabil 5 minute și se consumă o singură dată
- Toate rutele validează API key-ul din dashboard
