import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { MailModule } from '../mail/mail.module.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { FilmGetController } from './controller/film-get.controller.js';
import { FilmWriteController } from './controller/film-write.controller.js';
import { entities } from './entity/entities.js';
import { FilmMutationResolver } from './resolver/film-mutation.resolver.js';
import { FilmQueryResolver } from './resolver/film-query.resolver.js';
import { FilmReadService } from './service/film-read.service.js';
import { FilmWriteService } from './service/film-write.service.js';
import { QueryBuilder } from './service/query-builder.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Filmen.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, TypeOrmModule.forFeature(entities)],
    controllers: [FilmGetController, FilmWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        FilmReadService,
        FilmWriteService,
        FilmQueryResolver,
        FilmMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [FilmReadService, FilmWriteService],
})
export class FilmModule {}
