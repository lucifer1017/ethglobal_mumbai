-- Standalone schema component, not a production numbered migration.
-- NUMERIC stays unconstrained so fractional inputs are rejected without rounding.
CREATE DOMAIN meter_uint256 AS NUMERIC CHECK (
  VALUE = trunc(VALUE) AND VALUE >= 0 AND VALUE < power(2::numeric, 256)
);
CREATE DOMAIN meter_chain_id AS INTEGER CHECK (VALUE IN (1874, 11155111));
CREATE DOMAIN meter_address AS TEXT CHECK (VALUE ~ '^0x[0-9a-f]{40}$');
CREATE DOMAIN meter_hash AS TEXT CHECK (VALUE ~ '^0x[0-9a-f]{64}$');

CREATE TABLE tokens (
  chain_id meter_chain_id NOT NULL,
  address meter_address NOT NULL,
  symbol TEXT NOT NULL,
  decimals SMALLINT NOT NULL CHECK (decimals BETWEEN 0 AND 255),
  PRIMARY KEY (chain_id, address)
);

CREATE TABLE chain_cursors (
  chain_id meter_chain_id PRIMARY KEY,
  last_processed_block BIGINT NOT NULL CHECK (last_processed_block >= 0),
  last_safe_block BIGINT NOT NULL CHECK (last_safe_block >= 0 AND last_safe_block <= last_processed_block)
);
