// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable prettier/prettier */
import { type ApolloDriverConfig } from '@nestjs/apollo';
import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module.js';
import { DevModule } from './config/dev/dev.module.js';
import { graphQlModuleOptions } from './config/graphql.js';
import { FilmModule } from './film/film.module.js';
import { FilmGetController } from './film/controller/film-get.controller.js';
import { FilmWriteController } from './film/controller/film-write.controller.js';
import { typeOrmModuleOptions } from './config/typeormOptions.js';
import { LoggerModule } from './logger/logger.module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { KeycloakModule } from './security/keycloak/keycloak.module.js';

@Module({
    imports: [
        AdminModule,
        FilmModule,
        DevModule,
        GraphQLModule.forRoot<ApolloDriverConfig>(graphQlModuleOptions),
        KeycloakModule,
        LoggerModule,
        TypeOrmModule.forRoot(typeOrmModuleOptions),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes(
                FilmGetController,
                FilmWriteController,
                'auth',
                'graphql',
            );
    }
}
