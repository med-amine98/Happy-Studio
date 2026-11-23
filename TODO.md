# TODO

## Génération via Magic Hour — terminée
- L’utilisateur peut saisir un prompt et lancer une génération avec l’API Text-to-Video Magic Hour.
- Le backend lit `MAGIC_HOUR_API_KEY` et conserve la clé hors du navigateur.
- La requête utilise le modèle `default`, les formats 16:9, 9:16 ou 1:1, les durées 5, 8 ou 10 secondes, la résolution 480p et l’option audio.
- L’interface avertit que le quota gratuit est limité et que les vidéos consomment des crédits.

## Suivi asynchrone — terminé
- L’application interroge le statut du projet Magic Hour jusqu’à `complete`, `error` ou `canceled`.
- Les erreurs du fournisseur sont affichées sans divulguer de secret.

## Lecture et téléchargement — terminé
- Quand le projet est terminé, l’interface lit la vidéo et expose le lien de téléchargement temporaire.

## Interface responsive en français — terminée
- L’interface est en français et s’adapte aux petits et grands écrans.
- Les états de chargement, erreurs et prévisualisation sont affichés.

## Lancement local sans Docker — terminé
- Le README explique l’installation, la configuration de `MAGIC_HOUR_API_KEY` et le lancement sous Windows avec npm.
- Aucun Dockerfile ni moteur Docker n’est nécessaire.
