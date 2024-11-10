// eslint-disable-next-line max-classes-per-file
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Film } from '../entity/film.entity.js';
import { type Skript } from '../entity/skript.entity.js';
import { FilmReadService } from '../service/film-read.service.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { getBaseUri } from './getBaseUri.js';

/** href-Link für HATEOAS */
export type Link = {
    /** href-Link für HATEOAS-Links */
    readonly href: string;
};

/** Links für HATEOAS */
export type Links = {
    /** self-Link */
    readonly self: Link;
    /** Optionaler Linke für list */
    readonly list?: Link;
    /** Optionaler Linke für add */
    readonly add?: Link;
    /** Optionaler Linke für update */
    readonly update?: Link;
    /** Optionaler Linke für remove */
    readonly remove?: Link;
};
/** Typedefinition für ein Skript-Objekt ohne Rückwärtsverweis zum Film */
export type SkriptModel = Omit<Skript, 'film' | 'id'>;

/** Film-Objekt mit HATEOAS-Links */
export type FilmModel = Omit<
    Film,
    'schauspieler' | 'aktualisiert' | 'erzeugt' | 'id' | 'skript' | 'version'
> & {
    skript: SkriptModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};
/** Film-Objekte mit HATEOAS-Links in einem JSON-Array. */
export type FilmeModel = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        filme: FilmModel[];
    };
};
/**
 * Klasse für `FilmGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `FilmController` hat dieselben Properties wie die Basisklasse
 * `Film` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */

export class FilmQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly imdb: string;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly erscheinungsjahr: number;

    @ApiProperty({ required: false })
    declare readonly action: string;

    @ApiProperty({ required: false })
    declare readonly thriller: string;

    @ApiProperty({ required: false })
    declare readonly comedy: string;

    @ApiProperty({ required: false })
    declare readonly skript: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

/**
 * Die Controller-Klasse für die Verwaltung von Bücher.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film REST-API')
export class FilmGetController {
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmGetController.name);

    constructor(service: FilmReadService) {
        this.#service = service;
    }

    /**
     * Ein Film wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Film gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Films gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird der gefundene
     * Film im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Film zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param idStr Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Suche mit der Film-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Film wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Film zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Film wurde bereits heruntergeladen',
    })
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<FilmModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s', idStr, version);
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Die Film-ID ${idStr} ist ungueltig.`);
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const film = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): film=%s', film.toString());
            this.#logger.debug('getById(): skript=%o', film.skript);
        }

        // ETags
        const versionDb = film.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const filmModel = this.#toModel(film, req);
        this.#logger.debug('getById: filmModel=%o', filmModel);
        return res.contentType(APPLICATION_HAL_JSON).json(filmModel);
    }

    /**
     * Filme werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * einen solchen Film gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Filmen, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es keinen Film zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Filme ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Filmen' })
    async get(
        @Query() query: FilmQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<FilmeModel | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const filme = await this.#service.find(query);
        this.#logger.debug('get: %o', filme);

        // HATEOAS: Atom Links je Film
        const filmeModel = filme.map((film) => this.#toModel(film, req, false));
        this.#logger.debug('get: filmeModel=%o', filmeModel);

        const result: FilmeModel = { _embedded: { filme: filmeModel } };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(film: Film, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = film;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: film=%o, links=%o', film, links);
        const skriptModel: SkriptModel = {
            // "Optional Chaining" und "Nullish Coalescing" ab ES2020
            titel: film.skript?.titel ?? 'N/A',
            autor: film.skript?.autor ?? 'N/A',
        };
        const filmModel: FilmModel = {
            imdb: film.imdb,
            rating: film.rating,
            erscheinungsjahr: film.erscheinungsjahr,
            schlagwoerter: film.schlagwoerter,
            skript: skriptModel,
            _links: links,
        };

        return filmModel;
    }
}
