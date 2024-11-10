import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { FilmReadService } from '../service/film-read.service.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Film')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class FilmQueryResolver {
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmQueryResolver.name);

    constructor(service: FilmReadService) {
        this.#service = service;
    }

    @Query('film')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const film = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: film=%s, titel=%o',
                film.toString(),
                film.skript,
            );
        }
        return film;
    }

    @Query('filme')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const filme = await this.#service.find(input?.suchkriterien);
        this.#logger.debug('find: filme=%o', filme);
        return filme;
    }
}
