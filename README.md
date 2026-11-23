# Grok Studio — génération vidéo via Magic Hour

Application web en français qui génère des vidéos depuis un prompt avec l’API Text-to-Video de Magic Hour. Le backend Node/Express protège la clé API. Le projet fonctionne sous Windows, macOS et Linux, sans Docker.

## Offre gratuite et limites

Magic Hour annonce 400 crédits à l’inscription et 100 crédits quotidiens pour le niveau gratuit. Les crédits gratuits ne signifient pas une génération illimitée et les quotas/offres peuvent évoluer. Le modèle `default` sélectionne le modèle d’entrée de gamme pour le plan Free ; la résolution utilisée ici est 480p. D’après le barème officiel actuel, un clip de 5 secondes en LTX à 480p coûte environ 120 crédits. Vérifie le solde et les tarifs dans ton tableau de bord avant de multiplier les générations : un compte peut demander l’achat de crédits une fois le quota gratuit épuisé.

Sources officielles : [Text-to-Video](https://docs.magichour.ai/api-reference/video-projects/text-to-video.md), [modèles et coûts](https://docs.magichour.ai/api-reference/models.md), [crédits API](https://magichour.ai/api/text-to-video).

## Prérequis

Node.js 20 ou plus récent et une clé API Magic Hour. Crée un compte puis une clé sur [magichour.ai/developer](https://magichour.ai/developer). Ne partage jamais cette clé et ne la colle pas dans le code du navigateur.

## Installation sous Windows PowerShell

```powershell
npm install
Copy-Item .env.example .env
notepad .env
```

Dans `.env`, remplace la valeur exemple par ta clé :

```dotenv
MAGIC_HOUR_API_KEY=ta_cle_api_magic_hour
PORT=3000
```

Enregistre, ferme le Bloc-notes et démarre le serveur :

```powershell
npm run dev
```

Ouvre ensuite [http://localhost:3000](http://localhost:3000). Si `.env` change pendant que Vite tourne, arrête le serveur avec `Ctrl+C` puis relance `npm run dev` afin de recharger la clé d’environnement.

## Lancement en production

```bash
npm run build
npm start
```

Configure `MAGIC_HOUR_API_KEY` et éventuellement `PORT` dans l’environnement du serveur. Docker n’est pas nécessaire.

## Fonctionnement de l’API

Le serveur transmet les prompts à `POST https://api.magichour.ai/v1/text-to-video` avec le modèle `default`, une durée de 5, 8 ou 10 secondes, une résolution 480p, un format 16:9, 9:16 ou 1:1 et l’audio en option. La génération est asynchrone : l’application interroge `GET /v1/video-projects/{id}` jusqu’à l’état `complete`, puis utilise le lien `downloads[0].url`. Les liens de téléchargement fournis sont temporaires.

Routes locales : `GET /api/health` vérifie le serveur et révèle seulement si la clé est configurée ; `POST /api/videos` crée une génération ; `GET /api/videos/:requestId` relaie l’état et l’URL finale.
