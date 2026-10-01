CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS rooms (
    id integer PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    rate_minor integer NOT NULL CHECK(rate_minor > 0)
);
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY,
    reference uuid NOT NULL UNIQUE,
    room_id integer NOT NULL REFERENCES rooms(id),
    guest_alias text NOT NULL CHECK(length(guest_alias) BETWEEN 1 AND 60),
    check_in date NOT NULL,
    check_out date NOT NULL,
    total_minor integer NOT NULL CHECK(total_minor > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK(check_out > check_in),
    CHECK(check_out - check_in <= 30),
    EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
);
INSERT INTO rooms(id, name, description, rate_minor) VALUES
    (1, 'Palm Suite', 'A calm retreat · 1 room · 2 guests', 12000),
    (2, 'Courtyard Suite', 'Garden outlook · 1 room · 2 guests', 14500),
    (3, 'Skyline Suite', 'City outlook · 1 room · 2 guests', 18000)
ON CONFLICT(id) DO NOTHING;

