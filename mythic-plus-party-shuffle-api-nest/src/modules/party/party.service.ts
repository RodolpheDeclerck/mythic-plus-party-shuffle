import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { Character } from '../../shared/entities/character.entity';
import { Party } from '../../shared/entities/party.entity';
import { SpecializationDetails } from '../../shared/data/specializationsDetails.data';
import { Redis } from 'ioredis'; // ou le type approprié selon votre package Redis

@Injectable()
export class PartyService {
  private shuffleHistoryKey = 'partyShuffleHistory';
  private readonly logger = new Logger(PartyService.name);

  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @Inject('REDIS_CLIENT') // Ajustez selon votre configuration Redis
    private redisClient: Redis,
  ) {}

  // ============================================
  // MÉTHODES PUBLIQUES
  // ============================================

  async shuffleGroups(characters: Character[], eventCode: string): Promise<Party[]> {
    if (characters.length === 0) {
      return [];
    }

    const parties: Party[] = [];
    const partiesHistory = await this.getLastThreeShuffles(eventCode);
    const usedCharacters = new Set<number>();

    characters = this.shuffleArray(characters);

    let { tanks, healers, melees, dists, brs, bls } = this.filterCharactersByRole(characters);

    if (tanks.length === 0 && healers.length === 0) {
      const allDps = [...melees, ...dists];
      const dpsOnlyParties = this.createBalancedDpsOnlyGroups(allDps, brs, bls, partiesHistory);
      this.checkGroupQuality(dpsOnlyParties);
      return dpsOnlyParties;
    }

    const numberOfParties = Math.max(
      1,
      tanks.length,
      healers.length,
      Math.ceil(characters.length / 5)
    );

    for (let i = 0; i < numberOfParties; i++) {
      parties.push(new Party());
    }

    this.shuffleArray(parties);

    const availableParties = [...parties];
    this.shuffleArray(availableParties);

    tanks.forEach(tank => {
      if (availableParties.length > 0) {
        const party = availableParties.pop()!;
        party.members.push(tank);
        usedCharacters.add(tank.id);
      } else {
        const newParty = new Party();
        newParty.members.push(tank);
        usedCharacters.add(tank.id);
        parties.push(newParty);
      }
    });

    this.shuffleArray(parties);

    healers.forEach(healer => {
      if (!usedCharacters.has(healer.id)) {
        const eligibleParties = parties.filter(p => !p.members.some(m => m.role === 'HEAL'));
        if (eligibleParties.length > 0) {
          const randomParty = eligibleParties[Math.floor(Math.random() * eligibleParties.length)];
          randomParty.members.push(healer);
          usedCharacters.add(healer.id);
        } else {
          const newParty = new Party();
          newParty.members.push(healer);
          usedCharacters.add(healer.id);
          parties.push(newParty);
        }
      }
    });

    this.shuffleArray(parties);

    this.assignBRToParties(brs, parties, usedCharacters, partiesHistory);
    this.assignBLToParties(bls, parties, usedCharacters, partiesHistory);

    this.shuffleArray(parties);

    this.addignDistAndMelees(dists, melees, parties, usedCharacters, partiesHistory);

    let unusedDps: Character[] = [];
    [...dists, ...melees].forEach(dps => {
      if (!usedCharacters.has(dps.id)) {
        unusedDps.push(dps);
      }
    });

    unusedDps = this.shuffleArray(unusedDps);

    unusedDps = this.completePartiesWithRemainingDPS(unusedDps, parties);

    this.createGroupForRemainingDPS(unusedDps, parties);

    this.logger.debug('Optimizing global party distribution');
    this.optimizeGlobalDistribution(parties, partiesHistory);
    this.logger.debug('Global party distribution optimization done');

    const allAssignedPlayers = new Set(parties.flatMap(p => p.members.map(m => m.id)));
    const unassignedPlayers = characters.filter(c => !allAssignedPlayers.has(c.id));
    
    if (unassignedPlayers.length > 0) {
      this.logger.debug(`Distributing ${unassignedPlayers.length} unassigned players`);
      this.distributeUnassignedPlayers(unassignedPlayers, parties);
    }

    this.checkGroupQuality(parties);

    return parties;
  }

  async getLastThreeShuffles(eventCode: string): Promise<Party[][]> {
    const partiesJson = await this.redisClient.get(`${this.shuffleHistoryKey}:${eventCode}`);
    return partiesJson ? JSON.parse(partiesJson).slice(-3) : [];
  }

  async saveShuffleToHistory(eventCode: string, parties: Party[]): Promise<void> {
    const history = await this.getLastThreeShuffles(eventCode);
    history.push(parties);
    if (history.length > 3) history.shift();
    await this.redisClient.set(`${this.shuffleHistoryKey}:${eventCode}`, JSON.stringify(history));
  }

  async getPartiesByEventCode(eventCode: string): Promise<Party[]> {
    const redisKey = 'party:' + eventCode;
    const partiesJson = await this.redisClient.get(redisKey);

    if (!partiesJson) {
      return [];
    }

    return JSON.parse(partiesJson);
  }

  async saveGroupsToRedis(parties: Party[], eventCode: string): Promise<void> {
    try {
      this.logger.debug(`Redis save party:${eventCode} (${parties.length} parties)`);
      await this.redisClient.set('party:' + eventCode, JSON.stringify(parties));
      this.logger.debug(`Redis write OK party:${eventCode}`);
    } catch (error) {
      const e = error as Error;
      this.logger.error(`Redis write failed for party:${eventCode}: ${e.message}`, e.stack);
    }
  }

  async deleteShuffleHistory(eventCode: string): Promise<void> {
    await this.redisClient.set(`${this.shuffleHistoryKey}:${eventCode}`, JSON.stringify([]));
  }

  async deleteGroupsFromRedis(eventCode: string): Promise<void> {
    await this.deleteShuffleHistory(eventCode);
    await this.redisClient.set('party:' + eventCode, JSON.stringify([]));
  }

  async createOrUpdatePartiesToRedis(parties: Party[], eventCode: string): Promise<void> {
    await this.saveShuffleToHistory(eventCode, parties);
    await this.saveGroupsToRedis(parties, eventCode);
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  private filterCharactersByRole(characters: Character[]) {
    const tanks = characters
      .filter(char => SpecializationDetails[char.specialization].role === 'TANK')
      .sort((a, b) => {
        const diffA = a.keystoneMaxLevel - a.keystoneMinLevel;
        const diffB = b.keystoneMaxLevel - b.keystoneMinLevel;
        if (diffA !== diffB) {
          return diffA - diffB;
        }
        return b.iLevel - a.iLevel;
      });
    const healers = characters.filter(char => SpecializationDetails[char.specialization].role === 'HEAL').sort((a, b) => b.iLevel - a.iLevel);
    const melees = characters.filter(char => SpecializationDetails[char.specialization].role === 'CAC').sort((a, b) => b.iLevel - a.iLevel);
    const dists = characters.filter(char => SpecializationDetails[char.specialization].role === 'DIST').sort((a, b) => b.iLevel - a.iLevel);
    const brs = characters.filter(char => SpecializationDetails[char.specialization].battleRez === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);
    const bls = characters.filter(char => SpecializationDetails[char.specialization].bloodLust === true && char.role !== 'TANK').sort((a, b) => b.iLevel - a.iLevel);

    return { tanks, healers, melees, dists, brs, bls };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private assignBRToParties(brs: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
    let roles = ['HEAL', 'DIST', 'CAC'];
    let brToAdd: Character | null | undefined = null;

    parties.forEach(party => {
      if (party.members.length > 0 && !party.members[0].battleRez) {
        if (party.members.length > 0 && party.members[0].role === 'HEAL') {
          roles = roles.filter(role => role !== 'HEAL');
        }

        while (!brToAdd && roles.length > 0) {
          const randomRole = roles[Math.floor(Math.random() * roles.length)];
          const referenceILevel = party.members[0].iLevel;

          let availableBrs = brs.filter(br => br.role === randomRole && !usedCharacters.has(br.id));
          let filteredBrs = this.filterEligibleMembers(availableBrs, party, partiesHistory);
          availableBrs = filteredBrs.length > 0 ? filteredBrs : availableBrs;

          const filteredKeystoneBrs = availableBrs.sort((a, b) => a.keystoneMinLevel - b.keystoneMinLevel);

          brToAdd = filteredKeystoneBrs.reduce((closestBr, currentBr) => {
            const closestKeystoneDiff = closestBr.keystoneMaxLevel - closestBr.keystoneMinLevel;
            const currentKeystoneDiff = currentBr.keystoneMaxLevel - currentBr.keystoneMinLevel;

            if (currentKeystoneDiff < closestKeystoneDiff) {
              return currentBr;
            } else if (currentKeystoneDiff === closestKeystoneDiff) {
              const closestDifference = Math.abs(closestBr.iLevel - referenceILevel);
              const currentDifference = Math.abs(currentBr.iLevel - referenceILevel);
              return currentDifference < closestDifference ? currentBr : closestBr;
            }

            return closestBr;
          }, availableBrs[0]);

          if (brToAdd) {
            party.members.push(brToAdd);
            usedCharacters.add(brToAdd.id);
            this.logger.debug(`Added BR ${brToAdd.name} to party ${party.id}`);
          } else {
            roles = roles.filter(role => role !== randomRole);
          }
        }
        brToAdd = null;
        roles = ['HEAL', 'DIST', 'CAC'];
      }
    });
  }

  private assignBLToParties(bls: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
    let roles = ['HEAL', 'DIST', 'CAC'];
    let blToAdd: Character | null | undefined = null;

    parties.forEach(party => {
      if (party.members.length > 0) {
        if (party.members.length > 0 && party.members[0].role === 'HEAL' || party.members.length > 1 && party.members[1].role === 'HEAL') {
          roles = roles.filter(role => role !== 'HEAL');
        }

        while (!blToAdd && roles.length > 0) {
          const randomRole = roles[Math.floor(Math.random() * roles.length)];
          const referenceILevel = party.members[0].iLevel;

          let availableBls = bls.filter(bl => bl.role === randomRole && !usedCharacters.has(bl.id));
          let filteredBls = this.filterEligibleMembers(availableBls, party, partiesHistory);
          availableBls = filteredBls.length > 0 ? filteredBls : availableBls;

          const filteredKeystoneBrs = availableBls.sort((a, b) => a.keystoneMinLevel - b.keystoneMinLevel);

          blToAdd = filteredKeystoneBrs.reduce((closestBr, currentBr) => {
            const closestKeystoneDiff = closestBr.keystoneMaxLevel - closestBr.keystoneMinLevel;
            const currentKeystoneDiff = currentBr.keystoneMaxLevel - currentBr.keystoneMinLevel;

            if (currentKeystoneDiff < closestKeystoneDiff) {
              return currentBr;
            } else if (currentKeystoneDiff === closestKeystoneDiff) {
              const closestDifference = Math.abs(closestBr.iLevel - referenceILevel);
              const currentDifference = Math.abs(currentBr.iLevel - referenceILevel);
              return currentDifference < closestDifference ? currentBr : closestBr;
            }

            return closestBr;
          }, availableBls[0]);

          if (blToAdd) {
            party.members.push(blToAdd);
            usedCharacters.add(blToAdd.id);
            this.logger.debug(`Added BL ${blToAdd.name} to party ${party.id}`);
          } else {
            roles = roles.filter(role => role !== randomRole);
          }
        }
        blToAdd = null;
        roles = ['HEAL', 'DIST', 'CAC'];
      }
    });
  }

  private addignDistAndMelees(dists: Character[], melees: Character[], parties: Party[], usedCharacters: Set<number>, partiesHistory: Party[][]) {
    parties.forEach(party => {
      let filteredMelees = this.filterEligibleMembers(melees, party, partiesHistory);
      melees = filteredMelees.find(fm => !usedCharacters.has(fm.id)) ? filteredMelees : melees;

      let filteredDists = this.filterEligibleMembers(dists, party, partiesHistory);
      dists = filteredDists.find(fd => !usedCharacters.has(fd.id)) ? filteredDists : dists;

      if (!party.members.find(member => member.role === 'CAC')) {
        const meleeToAdd = melees.reduce((bestMelee, currentMelee) => {
          const bestKeystoneDiff = bestMelee.keystoneMaxLevel - bestMelee.keystoneMinLevel;
          const currentKeystoneDiff = currentMelee.keystoneMaxLevel - currentMelee.keystoneMinLevel;

          if (currentKeystoneDiff < bestKeystoneDiff) {
            return currentMelee;
          } else if (currentKeystoneDiff === bestKeystoneDiff) {
            const bestDifference = Math.abs(bestMelee.iLevel - party.members[0].iLevel);
            const currentDifference = Math.abs(currentMelee.iLevel - party.members[0].iLevel);
            return currentDifference < bestDifference ? currentMelee : bestMelee;
          }

          return bestMelee;
        }, melees[0]);

        if (meleeToAdd && !usedCharacters.has(meleeToAdd.id)) {
          party.members.push(meleeToAdd);
          usedCharacters.add(meleeToAdd.id);
          this.logger.debug(`Added CAC ${meleeToAdd.name} to party ${party.id}`);
        }
      }

      if (!party.members.find(member => member.role === 'DIST')) {
        const distToAdd = dists.reduce((bestDist, currentDist) => {
          const bestKeystoneDiff = bestDist.keystoneMaxLevel - bestDist.keystoneMinLevel;
          const currentKeystoneDiff = currentDist.keystoneMaxLevel - currentDist.keystoneMinLevel;

          if (currentKeystoneDiff < bestKeystoneDiff) {
            return currentDist;
          } else if (currentKeystoneDiff === bestKeystoneDiff) {
            const bestDifference = Math.abs(bestDist.iLevel - party.members[0].iLevel);
            const currentDifference = Math.abs(currentDist.iLevel - party.members[0].iLevel);
            return currentDifference < bestDifference ? currentDist : bestDist;
          }

          return bestDist;
        }, dists[0]);

        if (distToAdd && !usedCharacters.has(distToAdd.id)) {
          party.members.push(distToAdd);
          usedCharacters.add(distToAdd.id);
          this.logger.debug(`Added DIST ${distToAdd.name} to party ${party.id}`);
        }
      }
    });
  }

  private completePartiesWithRemainingDPS(unusedDps: Character[], parties: Party[]): Character[] {
    parties.forEach(party => {
      while (this.isDpsAvailable(party) && unusedDps.length > 0) {
        const partyIlevel = party.members.reduce((sum, member) => sum + member.iLevel, 0) / party.members.length;

        const dpsToAdd = unusedDps.reduce((bestDps, currentDps) => {
          const bestKeystoneDiff = bestDps.keystoneMaxLevel - bestDps.keystoneMinLevel;
          const currentKeystoneDiff = currentDps.keystoneMaxLevel - currentDps.keystoneMinLevel;

          if (currentKeystoneDiff < bestKeystoneDiff) {
            return currentDps;
          } else if (currentKeystoneDiff === bestKeystoneDiff) {
            const bestDifference = Math.abs(bestDps.iLevel - partyIlevel);
            const currentDifference = Math.abs(currentDps.iLevel - partyIlevel);
            return currentDifference < bestDifference ? currentDps : bestDps;
          }

          return bestDps;
        }, unusedDps[0]);

        if (dpsToAdd) {
          party.members.push(dpsToAdd);
          unusedDps = unusedDps.filter(dps => dps.id !== dpsToAdd.id);
          this.logger.debug(`Added DPS ${dpsToAdd.name} to party ${party.id}`);
        } else {
          break;
        }
      }
    });
    return unusedDps;
  }

  private createGroupForRemainingDPS(unusedDps: Character[], parties: Party[]) {
    if (unusedDps.length === 0) return;

    unusedDps.sort((a, b) => {
      const aKeyRange = a.keystoneMaxLevel - a.keystoneMinLevel;
      const bKeyRange = b.keystoneMaxLevel - b.keystoneMinLevel;
      if (aKeyRange !== bKeyRange) return aKeyRange - bKeyRange;
      return b.iLevel - a.iLevel;
    });

    let currentParty = new Party();
    parties.push(currentParty);

    for (const dps of unusedDps) {
      if (currentParty.members.length >= 5) {
        currentParty = new Party();
        parties.push(currentParty);
      }
      currentParty.members.push(dps);
      this.logger.debug(`Added DPS ${dps.name} to party ${currentParty.id}`);
    }
  }

  private createBalancedDpsOnlyGroups(
    allDps: Character[],
    brs: Character[],
    bls: Character[],
    partiesHistory: Party[][]
  ): Party[] {
    const parties: Party[] = [];
    const usedCharacters = new Set<number>();
    const targetGroupSize = 5;

    while (allDps.length > 0) {
      const party = new Party();
      parties.push(party);

      const availableBr = brs.find(br => !usedCharacters.has(br.id));
      if (availableBr) {
        party.members.push(availableBr);
        usedCharacters.add(availableBr.id);
        allDps = allDps.filter(dps => dps.id !== availableBr.id);
      }

      const availableBl = bls.find(bl => !usedCharacters.has(bl.id));
      if (availableBl) {
        party.members.push(availableBl);
        usedCharacters.add(availableBl.id);
        allDps = allDps.filter(dps => dps.id !== availableBl.id);
      }

      while (party.members.length < targetGroupSize && allDps.length > 0) {
        const dpsToAdd = allDps[0];
        party.members.push(dpsToAdd);
        usedCharacters.add(dpsToAdd.id);
        allDps = allDps.filter(dps => dps.id !== dpsToAdd.id);
      }
    }

    return parties;
  }

  private distributeUnassignedPlayers(unassignedPlayers: Character[], parties: Party[]): void {
    parties.sort((a, b) => a.members.length - b.members.length);

    for (const player of unassignedPlayers) {
      const targetParty = parties.find(p => p.members.length < 5);
      
      if (targetParty) {
        targetParty.members.push(player);
      } else {
        const newParty = new Party();
        newParty.members.push(player);
        parties.push(newParty);
      }
    }
  }

  private checkGroupQuality(parties: Party[]): void {
    parties.forEach((party, index) => {
      if (party.members.length === 0) return;

      const keyMin = Math.min(...party.members.map(m => m.keystoneMinLevel));
      const keyMax = Math.max(...party.members.map(m => m.keystoneMaxLevel));
      const keyRange = keyMax - keyMin;

      if (keyRange > 4) {
        this.logger.warn(
          `Party ${index + 1}: large keystone spread ${keyMin}-${keyMax}`,
        );
        party.members.forEach((member) => {
          this.logger.debug(
            `  ${member.name}: ${member.keystoneMinLevel}-${member.keystoneMaxLevel}`,
          );
        });
      }
    });
  }

  private calculateRedundancyScore(candidate: Character, party: Party, previousShuffles: Party[][]): number {
    let score = 0;
    const currentGroupMembers = party.members.map(member => member.id);
    
    for (let shuffleIndex = previousShuffles.length - 1; shuffleIndex >= 0; shuffleIndex--) {
      const shuffle = previousShuffles[shuffleIndex];
      const weight = 1 / (previousShuffles.length - shuffleIndex);
      
      for (const group of shuffle) {
        const commonMembers = group.members.filter(m => 
          currentGroupMembers.includes(m.id) || m.id === candidate.id
        ).length;
        
        if (commonMembers > 0) {
          score += commonMembers * weight;
        }
      }
    }
    
    return score;
  }

  private swapMembers(party1: Party, party2: Party, member1: Character, member2: Character): void {
    const index1 = party1.members.indexOf(member1);
    const index2 = party2.members.indexOf(member2);
    
    if (index1 !== -1 && index2 !== -1) {
      party1.members[index1] = member2;
      party2.members[index2] = member1;
    }
  }

  private optimizeGlobalDistribution(parties: Party[], previousShuffles: Party[][]): void {
    const allMembers = parties.flatMap(p => p.members);
    let improved = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (improved && iterations < MAX_ITERATIONS) {
      improved = false;
      iterations++;
      
      for (let i = 0; i < parties.length; i++) {
        for (let j = i + 1; j < parties.length; j++) {
          const party1 = parties[i];
          const party2 = parties[j];
          
          for (const member1 of party1.members) {
            for (const member2 of party2.members) {
              if (member1.role === member2.role) {
                const scoreBefore = 
                  this.calculateRedundancyScore(member1, party1, previousShuffles) +
                  this.calculateRedundancyScore(member2, party2, previousShuffles);
                
                const scoreAfter = 
                  this.calculateRedundancyScore(member2, party1, previousShuffles) +
                  this.calculateRedundancyScore(member1, party2, previousShuffles);
                
                if (scoreAfter < scoreBefore) {
                  this.swapMembers(party1, party2, member1, member2);
                  improved = true;
                }
              }
            }
          }
        }
      }
    }
  }

  private filterEligibleMembers(
    candidates: Character[],
    party: Party,
    previousShuffles: Party[][]
  ): Character[] {
    if (previousShuffles.length === 0 || party.members.length === 0) {
      return candidates;
    }

    const candidateScores = candidates.map(candidate => ({
      candidate,
      score: this.calculateRedundancyScore(candidate, party, previousShuffles)
    }));

    const minScore = Math.min(...candidateScores.map(c => c.score));

    const leastRedundantCandidates = candidateScores
      .filter(c => c.score === minScore)
      .map(c => c.candidate);

    if (party.members.length === 0) {
      return leastRedundantCandidates;
    }

    const partyKeyMin = Math.min(...party.members.map(m => m.keystoneMinLevel));
    const partyKeyMax = Math.max(...party.members.map(m => m.keystoneMaxLevel));

    const strictCompatibleCandidates = leastRedundantCandidates.filter(candidate =>
      candidate.keystoneMinLevel <= partyKeyMin &&
      candidate.keystoneMaxLevel >= partyKeyMax
    );

    if (strictCompatibleCandidates.length > 0) {
      return strictCompatibleCandidates;
    }

    const KEYSTONE_TOLERANCE = 2;
    const looseCompatibleCandidates = leastRedundantCandidates.filter(candidate =>
      Math.abs(candidate.keystoneMinLevel - partyKeyMin) <= KEYSTONE_TOLERANCE &&
      Math.abs(candidate.keystoneMaxLevel - partyKeyMax) <= KEYSTONE_TOLERANCE
    );

    if (looseCompatibleCandidates.length > 0) {
      return looseCompatibleCandidates;
    }

    return leastRedundantCandidates.sort((a, b) => {
      const aDiff = Math.abs(a.keystoneMinLevel - partyKeyMin) + Math.abs(a.keystoneMaxLevel - partyKeyMax);
      const bDiff = Math.abs(b.keystoneMinLevel - partyKeyMin) + Math.abs(b.keystoneMaxLevel - partyKeyMax);
      return aDiff - bDiff;
    });
  }

  private isDpsAvailable(party: Party) {
    return party.members.filter(member => member.role === 'DIST' || member.role === 'CAC').length < 3;
  }
}