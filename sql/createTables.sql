DROP TABLE IF EXISTS dog_breeds;

CREATE TABLE dog_breeds (
    breed_id SERIAL PRIMARY KEY NOT NULL,
    breed_name TEXT NOT NULL UNIQUE,
    votes INTEGER
);