// eslint-disable-next-line max-classes-per-file
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { FilmDTO } from '../controller/filmDTO.entity.js';
import { type Film } from '../entity/film.entity.js';
import { type Schauspieler } from '../entity/schauspieler.entity.js';
import { type Skript } from '../entity/skript.entity.js';
import { FilmWriteService } from '../service/film-write.service.js';
import { type IdInput } from './film-query.resolver.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class FilmUpdateDTO extends FilmDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}

@Resolver('Film')
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class FilmMutationResolver {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmMutationResolver.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async create(@Args('input') filmDTO: FilmDTO) {
        this.#logger.debug('create: filmDTO=%o', filmDTO);

        const film = this.#filmDtoToFilm(filmDTO);
        const id = await this.#service.create(film);
        this.#logger.debug('createFilm: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async update(@Args('input') filmDTO: FilmUpdateDTO) {
        this.#logger.debug('update: film=%o', filmDTO);

        const film = this.#filmUpdateDtoToFilm(filmDTO);
        const versionStr = `"${filmDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(filmDTO.id, 10),
            film,
            version: versionStr,
        });
        // TODO BadUserInputError
        this.#logger.debug('updateFilm: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin'] })
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug('deleteFilm: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    #filmDtoToFilm(filmDTO: FilmDTO): Film {
        const skriptDTO = filmDTO.skript;
        const skript: Skript = {
            id: undefined,
            titel: skriptDTO.titel,
            autor: skriptDTO.autor ?? '',
            film: undefined,
        };
        // "Optional Chaining" ab ES2020
        const schauspieler = filmDTO.schauspieler?.map((schauspielerDTO) => {
            const schauspielern: Schauspieler = {
                id: undefined,
                name: schauspielerDTO.name,
                geburtsdatum: schauspielerDTO.geburtsdatum,
                film: undefined,
            };
            return schauspielern;
        });
        const film: Film = {
            id: undefined,
            version: undefined,
            imdb: filmDTO.imdb,
            rating: filmDTO.rating,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            schlagwoerter: filmDTO.schlagwoerter,
            skript,
            schauspieler,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweis
        film.skript!.film = film;
        return film;
    }

    #filmUpdateDtoToFilm(filmDTO: FilmUpdateDTO): Film {
        return {
            id: undefined,
            version: undefined,
            imdb: filmDTO.imdb,
            rating: filmDTO.rating,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            schlagwoerter: filmDTO.schlagwoerter,
            skript: undefined,
            schauspieler: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
