CREATE SCHEMA IF NOT EXISTS AUTHORIZATION film;

ALTER ROLE film SET search_path = 'film';

CREATE TABLE IF NOT EXISTS film (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    version             INTEGER NOT NULL DEFAULT 0,
    imdb                TEXT NOT NULL UNIQUE USING INDEX TABLESPACE filmspace,
    rating              INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
    erscheinungsjahr    INTEGER NOT NULL CHECK (erscheinungsjahr >= 1900),
    schlagwoerter       TEXT,
    erzeugt             TIMESTAMP NOT NULL DEFAULT NOW(),
    aktualisiert        TIMESTAMP NOT NULL DEFAULT NOW()
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS skript (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    titel               TEXT NOT NULL,
    autor               TEXT NOT NULL,
    film_id            INTEGER NOT NULL UNIQUE USING INDEX TABLESPACE filmspace REFERENCES film
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS schauspieler (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    name                TEXT NOT NULL,
    geburtsdatum        DATE,
    film_id            INTEGER NOT NULL REFERENCES film
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS film_file (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    data                BYTEA NOT NULL,
    filename            TEXT NOT NULL,
    film_id             INTEGER NOT NULL REFERENCES film
) TABLESPACE filmspace;
