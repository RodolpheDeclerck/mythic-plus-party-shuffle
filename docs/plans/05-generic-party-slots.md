# 05 — Slots de groupe generiques (suppression des roles fixes)

**Fichier :** `docs/plans/05-generic-party-slots.md`

## Contexte

Les groupes generees avaient une structure figee par role : `{ tank: T | null, healer: T | null, dps: T[] }`. Cela empechait de deplacer un participant vers un slot d'un autre role (ex. mettre un tank en position 3). L'admin devait respecter la structure tank/healer/dps lors du drag & drop.

## Objectifs

1. Permettre de placer n'importe quel participant dans n'importe quel slot (1-5) d'un groupe.
2. Conserver la detection des roles manquants (tank, healer, DPS, BL, BR) basee sur le role du participant, pas sur la position.
3. Permettre l'edition d'un participant via double-clic dans les groupes generes (admin).
4. Synchroniser les edits de personnages vers les groupes sans changer le role attribue au shuffle.

## Changements techniques

### Modele de donnees (`eventPartyModel.ts`)

```typescript
// Avant
interface EventPartyGroup {
  id: string;
  tank: EventParticipant | null;
  healer: EventParticipant | null;
  dps: EventParticipant[];
}

// Apres
interface EventPartyGroup {
  id: string;
  members: (EventParticipant | null)[];  // 5 slots generiques
}
```

La conversion depuis le backend (`partyToEventPartyGroup`) preserve l'ordre des membres tel quel, sans re-trier par role.

### Drag & drop (`usePartyDragDrop.ts`)

- `DraggedPartyItem.slot` remplace par `slotIndex: number`.
- Logique simplifiee : swap = echange d'index entre `members[fromSlotIndex]` et `members[toSlotIndex]`.
- Bounds check sur les index de slot.
- Validation du `targetParticipantId` pour les drops unassigned → group.

### Sync des edits (`useSyncedPartyGroups.ts`)

Un seul `useEffect` qui :
1. Derive la structure des groupes depuis `parties` (source de verite backend).
2. Overlay les donnees fraiches de `characters` (nom, spec, ilvl, etc.).
3. Preserve le **role** depuis l'etat precedent (celui du shuffle) — un user qui change son role ne modifie pas son icone dans le groupe.

`updateParticipantInGroups(participant)` : methode explicite pour l'admin qui met a jour un participant dans tous les groupes (y compris le role) et persiste au backend.

**Regles metier :**
- **User edite** → role change dans le roster uniquement, pas dans les groupes.
- **Admin edite** → role change dans le roster ET les groupes (via `updateParticipantInGroups`).

### Double-clic edition dans les groupes

Chaine de callback : `EventDetail` → `AdminPartyGrid` → `AdminPartyGroupCard` → `GroupParticipantSlot` (`onDoubleClick`).

Le meme `EditParticipantDialog` existant est reutilise. Apres sauvegarde admin, `updateParticipantInGroups` pousse les changements dans les groupes.

### Composition status (`partyGroupUtils.ts`)

`getPartyGroupCompositionStatus` analyse les roles des `members` pour detecter les manques :
- Compte les tanks, healers, DPS presents dans le tableau `members`.
- Independant de la position du slot.

### Vue joueur (`PlayerPartySections.tsx`)

Les slots vides affichent les roles manquants (Tank, Healer, DPS) avec leur icone, au lieu de "Slot 1, 2, 3".

### UX admin supplementaire

- **"Melanger les groupes"** (header) : si des groupes existent, affiche la popup de confirmation avant de vider + re-shuffle.
- **"Vider l'evenement"** : vide les groupes ET les participants.

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `eventPartyModel.ts` | Interface `members[]`, conversions |
| `partyGroupUtils.ts` | 8 utilitaires adaptes pour `members` |
| `usePartyDragDrop.ts` | Logique par `slotIndex`, bounds check |
| `useSyncedPartyGroups.ts` | Sync unique, preservation role, `updateParticipantInGroups` |
| `AdminPartyGroupCard.tsx` | Boucle `members.map()`, prop `onEditParticipant` |
| `GroupParticipantSlot.tsx` | `slotIndex`, `onDoubleClick`, `playerGroupRoleIcons` |
| `AdminUnassignedParticipantsPanel.tsx` | `playerGroupRoleIcons`, `onDoubleClick` |
| `AdminPartyGrid.tsx` | Prop `onEditParticipant` |
| `PlayerPartySections.tsx` | Slots vides = roles manquants |
| `EventDetail.tsx` | Câblage `updateParticipantInGroups`, shuffle confirm |
| `useEventDetailDialogsAndActions.ts` | `onAfterSaveParticipant`, `shuffleConfirmOpen` |
| `en/translation.json`, `fr/translation.json` | Cles `emptySlot`, renommage `clearEvent` |

## Tests

| Suite | Tests | Couverture |
|-------|-------|-----------|
| `partyGroupUtils.test.ts` | 26 | Toutes les fonctions utilitaires |
| `eventPartyModel.test.ts` | 12 | Conversions, round-trip, padding |
| `usePartyDragDrop.test.ts` | 14 | Swap, cross-group, bounds, unassigned |
| `useSyncedPartyGroups.test.ts` | 9 | Role preservation, admin sync |
