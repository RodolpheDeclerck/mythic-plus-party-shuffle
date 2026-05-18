# 12 — Tests unitaires `PartyService.shuffleGroups` + POC OpenSpec

**Fichier :** `docs/plans/12-shuffle-unit-tests.md`

Plan miroir de [`openspec/changes/add-shuffle-unit-tests/`](../../openspec/changes/add-shuffle-unit-tests/). Maintenu en parallèle pendant le POC OpenSpec pour respecter la règle CLAUDE.md ("plan dans `docs/plans/`").

## État

Livré dans la même PR que le scaffold OpenSpec (PR #33).

## Quoi

Ajout de **26 tests unitaires** sur `PartyService.shuffleGroups`, couvrant les invariants 1–7 de la spec ([`openspec/specs/shuffle/spec.md`](../../openspec/specs/shuffle/spec.md)) et les edge cases. Anti-repeat (invariant 8) **déféré** à une PR ultérieure (voir tasks.md section 9).

Avant : 0 test sur `PartyService` (file le plus critique de l'app, 822 lignes, 0% couverture).
Après :
- **75% statements / 72% branches / 81% functions / 76% lines** sur `party.service.ts`
- **Global API** : ~6% → ~33% couverture
- Threshold global bumped `5/4/3/5` → `30/25/35/30`
- Threshold per-file `party.service.ts` ajouté à `70/65/75/70`

## Découvertes spec/code pendant la rédaction (7 drifts)

Capturés en "Known gaps" dans [`openspec/specs/shuffle/spec.md`](../../openspec/specs/shuffle/spec.md). Constituent une roadmap de refacto algo à venir :

1. **Tie-break order intent vs code** : intent = iLevel > keystone ; code = keystone width > iLevel.
2. **Anti-repeat = post-pass swap**, pas un critère d'assignment initial.
3. **BR slot shallow check** : seul `members[0].battleRez` est inspecté → healer/DPS avec BR ne satisfont pas le slot.
4. **BL no check at all** : un BL est toujours ajouté quand disponible, même si quelqu'un en a déjà.
5. **Party count formula** = initial allocation, le final peut être plus haut (leftover DPS).
6. **Crash latent** : `addignDistAndMelees` dereference `party.members[0].iLevel` quand une party reste vide après tank/healer phase. Reproductible sous certaines RNG.
7. **Melee/ranged balance bug** : la reduce élit le même "best" CAC pour toutes les parties (pas de filtrage `usedCharacters` avant reduce). Seule la 1ère party reçoit un CAC via cette logique.

## Stratégie de tests

Le shuffle utilise `Math.random` et `shuffleArray` partout (invariant 9 — non-déterminisme). Deux stratégies appliquées :

- **Property-based** (par défaut) : on asserte sur des invariants structurels qui tiennent quelle que soit la séquence RNG (role caps, comptes, etc.).
- **History-driven** : pour tester `filterEligibleMembers` (keystone matching), on injecte un historique factice qui active le code path.

Le déférement d'anti-repeat évite les tests statistiques bruyants qui auraient bloqué la livraison du POC.

## POC OpenSpec — bilan d'usage

Le POC sert à évaluer la convention `openspec/` vs notre `docs/plans/` actuel. Ce qu'on a vu en pratique :

**Ce que la séparation `specs/<capability>/spec.md` + `changes/<id>/proposal.md` + `changes/<id>/tasks.md` a apporté :**

- 4 drifts identifiés **avant** d'écrire la moindre ligne de test (en relisant le code pour rédiger le spec)
- 3 drifts additionnels identifiés **pendant** l'écriture des tests, captured comme un "alignement spec" naturel
- Le `spec.md` devient un artefact stable pour discuter le refacto algo (la roadmap des 7 gaps)
- Le `tasks.md` reste actionnable et exécutable par batches

**Ce qui aurait été perdu dans un seul `docs/plans/12-*.md` :**

- Difficulté à distinguer "ce qui est intent" vs "ce qui est code actuel" sans la structure
- Pas d'artefact stable pour le refacto futur — le plan se serait clos à la livraison, perdant la spec

**Conclusion provisoire** : OpenSpec a généré de la valeur. Décision finale (adopt / hybrid / abandon) à prendre après cette livraison, dans la rétro POC.

## Hors périmètre

- Anti-repeat tests (déféré).
- Refacto code pour résoudre les 7 gaps (PR séparées).
- Installation du CLI OpenSpec (cf. [openspec/README.md § CLI integration roadmap](../../openspec/README.md)).
