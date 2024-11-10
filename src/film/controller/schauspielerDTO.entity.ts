/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Schauspieler ohne TypeORM.
 */
export class SchauspielerDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Brat Pitt', type: String })
    readonly name!: string;

    @MaxLength(16)
    @ApiProperty({ example: '1981-02-17', type: String })
    readonly geburtsdatum!: Date | string | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
