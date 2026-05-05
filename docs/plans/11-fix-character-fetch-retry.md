# 11 — Correction erreur "Could not load the participant list" intermittente

**Fichier :** `docs/plans/11-fix-character-fetch-retry.md`

## Problème

Rapport utilisateur (Discord, 29 avril 2026) : après qu'un participant s'inscrit à un événement, un refresh de page affiche l'erreur "Could not load the participant list". Deux ou trois refreshes supplémentaires finissent par résoudre le problème.

## Cause racine

Deux états d'erreur dans l'UI n'étaient jamais réinitialisés après un succès :

### 1. `errorState` dans `useEventCharactersRefresh`

Quand le WebSocket émet `character-updated` (déclenché par une nouvelle inscription), le hook appelle `fetchCharactersApi`. Si cette requête échoue (erreur réseau transitoire, proxy lent), `setErrorState(CHARACTERS_FETCH_FAILED)` était appelé et cet état **n'était jamais réinitialisé** même si la requête suivante réussissait.

### 2. `charactersFetchErrorCode` dans `useFetchCharacters`

La requête initiale n'avait aucun mécanisme de retry. En cas d'échec transitoire, `charactersFetchErrorCode` était positionné définitivement — l'utilisateur devait refresher manuellement 2-3 fois jusqu'à ce qu'une tentative aboutisse.

## Solution appliquée

### `useEventCharactersRefresh.ts`

Ajout de `setErrorState(null)` au début de chaque tentative, pour qu'une erreur transitoire soit effacée dès que le fetch suivant réussit.

### `useFetchCharacters.tsx`

Ajout d'un retry automatique : 2 essais supplémentaires avec 1 seconde de délai avant d'afficher l'erreur définitive. Ajout d'un flag `cancelled` pour éviter les mises à jour d'état après démontage.

## Fichiers modifiés

- `mythic-plus-party-shuffle-ui/app/hooks/useEventCharactersRefresh.ts`
- `mythic-plus-party-shuffle-ui/app/hooks/useFetchCharacters.tsx`

## Tests ajoutés

- `mythic-plus-party-shuffle-ui/app/hooks/useEventCharactersRefresh.test.ts`
- `mythic-plus-party-shuffle-ui/app/hooks/useFetchCharacters.test.ts`
