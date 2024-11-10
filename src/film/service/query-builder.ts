import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';
import { getLogger } from '../../logger/logger.js';
import { Film } from '../entity/film.entity.js';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { Skript } from '../entity/skript.entity.js';
import { type Suchkriterien } from './suchkriterien.js';

/** Typdefinitionen für die Suche mit der Film-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Films. */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly mitSchauspielern?: boolean;
};
@Injectable()
export class QueryBuilder {
    readonly #filmAlias = `${Film.name
        .charAt(0)
        .toLowerCase()}${Film.name.slice(1)}`;

    readonly #skriptAlias = `${Skript.name
        .charAt(0)
        .toLowerCase()}${Skript.name.slice(1)}`;

    readonly #schauspielerAlias = `${Schauspieler.name
        .charAt(0)
        .toLowerCase()}${Schauspieler.name.slice(1)}`;

    readonly #repo: Repository<Film>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Film) repo: Repository<Film>) {
        this.#repo = repo;
    }

    /**
     * Ein Film mit der ID suchen.
     * @param id ID des gesuchten Buches
     * @returns QueryBuilder
     */
    buildId({ id, mitSchauspielern = false }: BuildIdParams) {
        // QueryBuilder "film" fuer Repository<Film>
        const queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);

        // Fetch-Join: aus QueryBuilder "film" die Property "titel" ->  Tabelle "skipt"
        queryBuilder.innerJoinAndSelect(
            `${this.#filmAlias}.skript`,
            this.#skriptAlias,
        );

        if (mitSchauspielern) {
            // Fetch-Join: aus QueryBuilder "buch" die Property "abbildungen" -> Tabelle "abbildung"
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.schauspieler`,
                this.#schauspielerAlias,
            );
        }

        queryBuilder.where(`${this.#filmAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Filme asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // z.B. { titel: 'a', rating: 5, javascript: true }
    // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
    // eslint-disable-next-line max-lines-per-function
    build({ titel, action, thriller, comedy, ...props }: Suchkriterien) {
        this.#logger.debug(
            'build: imdb=%s, rating=%s, titel=%s, props=%o',
            titel,
            action,
            thriller,
            comedy,
            props,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);
        queryBuilder.innerJoinAndSelect(`${this.#filmAlias}.skript`, 'titel');

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        if (titel !== undefined && typeof titel === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#skriptAlias}.titel ${ilike} :titel`,
                { titel: `%${titel}%` },
            );
            useWhere = false;
        }

        if (action === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.schlagwoerter like '%ACTION%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.schlagwoerter like '%ACTION%'`,
                  );
            useWhere = false;
        }
        if (thriller === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.schlagwoerter like '%THRILLER%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.schlagwoerter like '%THRILLER%'`,
                  );
            useWhere = false;
        }

        if (comedy === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.schlagwoerter like '%COMEDY%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.schlagwoerter like '%COMEDY%'`,
                  );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });
        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
