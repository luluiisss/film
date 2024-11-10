import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Film } from './../entity/film.entity.js';
import { QueryBuilder } from './query-builder.js';
import { type Suchkriterien } from './suchkriterien.js';

export type FindByIdParams = {
    /** ID des gesuchten Films */
    readonly id: number;
    /** Sollen die Schauspieler mitgeladen werden? */
    readonly mitSchauspielern?: boolean;
};

@Injectable()
export class FilmReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #filmProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(FilmReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const filmDummy = new Film();
        this.#filmProps = Object.getOwnPropertyNames(filmDummy);
        this.#queryBuilder = queryBuilder;
    }
    /**
     * Ein Film asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Films
     * @returns Das gefundene Film in einem Promise aus ES2015.
     * @throws NotFoundException falls kein Film mit der ID existiert
     */

    async findById({ id, mitSchauspielern = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const film = await this.#queryBuilder
            .buildId({ id, mitSchauspielern })
            .getOne();
        if (film === null) {
            throw new NotFoundException(`Es gibt kein Film mit der ID ${id}.`);
        }
        if (film.schlagwoerter === null) {
            film.schlagwoerter = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: film=%s, titel=%o',
                film.toString(),
                film.skript,
            );
            if (mitSchauspielern) {
                this.#logger.debug(
                    'findById: abbildungen=%o',
                    film.schauspieler,
                );
            }
        }
        return film;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     * @throws NotFoundException falls keine Bücher gefunden wurden.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const filme = await this.#queryBuilder.build(suchkriterien).getMany();
        if (filme.length === 0) {
            this.#logger.debug('find: Keine Filme gefunden');
            throw new NotFoundException(
                `Keine Filme gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }
        filme.forEach((film) => {
            if (film.schlagwoerter === null) {
                film.schlagwoerter = [];
            }
        });
        this.#logger.debug('find: filme=%o', filme);
        return filme;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Buch oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#filmProps.includes(key) &&
                key !== 'action' &&
                key !== 'thriller'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
