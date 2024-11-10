import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Film } from './film.entity.js';

@Entity()
export class Skript {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    readonly titel!: string;

    @Column()
    readonly autor!: string;

    @OneToOne(() => Film, (film) => film.skript)
    @JoinColumn({ name: 'film_id' })
    film: Film | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            titel: this.titel,
            autor: this.autor,
        });
}
