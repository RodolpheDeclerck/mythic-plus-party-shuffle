import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    OneToMany,
    JoinTable,
    BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';
import { Character } from './character.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('events')
export class AppEvent {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => Character, character => character.event)
    characters!: Character[];

    @Column({ type: 'boolean', default: false })
    arePartiesVisible!: boolean;
    
    // Relation avec l'utilisateur qui a créé l'événement
    @ManyToOne(() => User, user => user.eventsCreated, { eager: true, onDelete: 'CASCADE' })
    createdBy!: User;

    // Liste des administrateurs (créateur + autres admins)
    @ManyToMany(() => User, { eager: true })
    @JoinTable({
        name: 'event_admins',
        joinColumn: {
            name: 'event_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
        },
    })
    admins!: User[];

    @BeforeInsert()
    setEventDetails() {
        // Génère un code unique pour l'événement
        this.code = uuidv4().substring(0, 8);

        // Définit la date d'expiration 7 jours après la date de création
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 7);
        this.expiresAt = expireDate;
    }
}