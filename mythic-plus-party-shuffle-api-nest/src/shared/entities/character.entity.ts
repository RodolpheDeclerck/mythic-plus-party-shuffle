import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppEvent as Event } from './event.entity';
import { CharacterClass } from '../enums/characterClass.enum';
import { Role } from '../enums/role.enum';
import { Specialization } from '../enums/specialization.enum';
import { SpecializationDetails } from '../data/specializationsDetails.data';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CharacterClass })
  characterClass!: CharacterClass;

  @Column({ type: 'enum', enum: Specialization })
  specialization!: Specialization;

  @Column()
  iLevel!: number;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ default: false })
  bloodLust!: boolean;

  @Column({ default: false })
  battleRez!: boolean;

  @Column({ default: 2 })
  keystoneMinLevel!: number;

  @Column({ default: 99 })
  keystoneMaxLevel!: number;

  // Ajout de la relation avec l'entité Event
  @ManyToOne(() => Event, event => event.characters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "eventCode", referencedColumnName: "code" })
  event!: Event | null;

  constructor(name?: string, characterClass?: CharacterClass, specialization?: Specialization) {
    if (name && characterClass && specialization) {
      this.name = name;
      this.characterClass = characterClass;

      const specializationInfo = SpecializationDetails[specialization];

      if (!specializationInfo) {
        throw new Error(`Invalid specialization: ${specialization}`);
      }

      this.specialization = specialization;
      this.iLevel = this.iLevel;
      this.role = specializationInfo.role;
      this.bloodLust = specializationInfo.bloodLust;
      this.battleRez = specializationInfo.battleRez;
    }
  }
}
