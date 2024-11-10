import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { Schauspieler } from './schauspieler.entity.js';
import { Skript } from './skript.entity.js';

@Entity()
export class Film {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column()
    @ApiProperty({ example: '3546-3829', type: String })
    readonly imdb!: string;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Column('int')
    @ApiProperty({ example: 2021 })
    readonly erscheinungsjahr: number | undefined;

    @Column('simple-array')
    schlagwoerter: string[] | null | undefined;

    // undefined wegen Updates
    @OneToOne(() => Skript, (skript) => skript.film, {
        cascade: ['insert', 'remove'],
    })
    readonly skript: Skript | undefined;

    // undefined wegen Updates
    @OneToMany(() => Schauspieler, (schauspieler) => schauspieler.film, {
        cascade: ['insert', 'remove'],
    })
    readonly schauspieler: Schauspieler[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            imdb: this.imdb,
            rating: this.rating,
            erscheinungsjahr: this.erscheinungsjahr,
            schlagwoerter: this.schlagwoerter,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
