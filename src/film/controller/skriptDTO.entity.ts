/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Titel ohne TypeORM.
 */
export class SkriptDTO {
    @Matches(String.raw`^\w.*`)
    @MaxLength(40)
    @ApiProperty({ example: 'Das Skript', type: String })
    readonly titel!: string;

    @IsOptional()
    @MaxLength(40)
    @ApiProperty({ example: 'Der Autor', type: String })
    readonly autor: string | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
