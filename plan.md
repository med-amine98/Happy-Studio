# Grok Studio — plan technique actualisé

Application web en français qui crée des vidéos à partir de prompts par l’API Text-to-Video de Magic Hour. Le serveur Express conserve `MAGIC_HOUR_API_KEY` côté backend, crée un projet avec `POST /v1/text-to-video`, puis interroge `GET /v1/video-projects/{id}` jusqu’au statut final. À la réussite, l’URL temporaire `downloads[0].url` est transmise au lecteur.

Le frontend est React/Vite et le backend Node/Express, dans un seul processus et sur le port 3000. L’installation locale se fait avec npm, sans Docker. L’offre Magic Hour Free fournit, selon sa documentation consultée, des crédits d’essai à l’inscription et un quota quotidien annoncé. Ce n’est pas un service illimité ; les générations coûtent des crédits et un compte peut nécessiter un achat après épuisement du quota. L’application sélectionne `model: default`, utilise 480p et propose des durées de 5/8/10 secondes, pour viser le modèle d’entrée de gamme du palier gratuit.

## Fichiers principaux

- `src/` contient l’interface responsive, les réglages et le suivi du rendu.
- `server/index.js` contient les routes de génération et de statut avec validation des entrées et gestion d’erreurs.
- `public/manus-routes.json` décrit les routes de page.
- `.env.example` et `README.md` expliquent la configuration Magic Hour et le démarrage local sous Windows.
- `package.json` et `package-lock.json` définissent la pile Node.

## Direction visuelle

Atelier cinématographique sombre : interface anthracite et ivoire, accent vert citron, panneau de création à côté d’une grande scène de prévisualisation, responsive en colonne sur mobile. Le style demeure sobre, éditorial et axé sur le lecteur. Typographies Manrope et DM Mono ; états animés discrets et respect de `prefers-reduced-motion`.
