/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsOptional,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { SchauspielerDTO } from './schauspielerDTO.entity.js';
import { SkriptDTO } from './skriptDTO.entity.js';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Bücher ohne TypeORM und ohne Referenzen.
 */
export class FilmDtoOhneRef {
    @Matches(/^\d{4}-\d{4}$/u, { message: 'IMDb in "1234-1234"-Format' })
    @ApiProperty({ example: '1234-1234', type: String })
    readonly imdb!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly rating!: number;

    @IsInt()
    @Min(1900)
    @Max(2030)
    @ApiProperty({ example: 1990, type: Number })
    readonly erscheinungsjahr!: number;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['ACTION', 'THRILLER', 'COMEDY'] })
    readonly schlagwoerter: string[] | undefined;
}

/**
 * Entity-Klasse für Filme ohne TypeORM.
 */
export class FilmDTO extends FilmDtoOhneRef {
    @ValidateNested()
    @Type(() => SkriptDTO)
    @ApiProperty({ type: SkriptDTO })
    readonly skript!: SkriptDTO; // NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SchauspielerDTO)
    @ApiProperty({ type: [SchauspielerDTO] })
    readonly schauspieler: SchauspielerDTO[] | undefined;

    // SchauspielerDTO
}
/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */
