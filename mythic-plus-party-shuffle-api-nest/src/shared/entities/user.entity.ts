import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { AppEvent } from './event.entity.js'; // Assure-toi que le chemin est correct

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  @Column({ type: 'varchar', nullable: false, select: false })  // Mot de passe non nullable
  password!: string;

  @Column({ type: 'varchar', nullable: false, select: false })  // Salt non nullable
  salt!: string;

  @Column({ type: 'varchar', nullable: true, select: false })  // Token de session peut être nullable
  sessionToken!: string;

  // Liste des événements créés par l'utilisateur
  @OneToMany(() => AppEvent, event => event.createdBy)
  eventsCreated!: AppEvent[];

  // Liste des événements où l'utilisateur est admin
  @ManyToMany(() => AppEvent, event => event.admins)
  eventsAdmin!: AppEvent[];
}
