import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Film } from './film.entity.js';

@Entity()
export class Schauspieler {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    readonly name!: string;

    @Column('date')
    @ApiProperty({ example: '2002-01-31' })
    readonly geburtsdatum: Date | string | undefined;

    @ManyToOne(() => Film, (film) => film.schauspieler)
    @JoinColumn({ name: 'film_id' })
    film: Film | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            name: this.name,
            geburtsdatum: this.geburtsdatum,
        });
}
