# Calculatrice Salaison

Application Android (Expo / React Native) pour calculer les temps de salage et de séchage
des viandes séchées, suivre ses pièces en cours et garder une galerie photo.

Package Play Store : `com.frdo1.monapplihtml` — projet EAS : `@frdo1/monapplihtml`.

## Version 1.1.0

La v1.0 affichait une page web hébergée sur GitHub Pages ; cette page a disparu,
l'appli publiée n'affichait plus qu'une erreur. La v1.1 contient tout le calculateur
dans l'APK et fonctionne **hors ligne**.

- Écrans : Accueil (calculateur), Planning (suivi des pièces), Pièces (stock), galerie photo, 6 langues.
- Calculs repris de la v1.0, avec corrections :
  - perte de poids visée 30-40 % et poids cible en grammes (la v1.0 affichait 0,5 % par semaine) ;
  - températures de séchage : frigo 3-6 °C, cave à vin 10-14 °C ;
  - saumure plus longue que l'enfouissement à sec ;
  - quantités de sel / mélange SSV / eau pour le poids saisi ;
  - saucisson : sel incorporé (27 g/kg), pas de phase de salage.
- Nouveau : pesées avec suivi de la perte de poids, rappels de fin de salage et de séchage,
  bouton « Ajouter au planning » depuis le résultat.

Le moteur de calcul est dans `lib/calc.ts`, les textes dans `lib/i18n.ts`.

## Compiler

```bash
npm install
npx eas build -p android --profile production   # AAB pour le Play Store (versionCode auto)
npx eas build -p android --profile preview      # APK à installer directement
```
