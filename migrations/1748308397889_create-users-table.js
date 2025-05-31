/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('token', {
    id: 'id',
    access_token: { type: 'text', notNull: true },
    expires_in: { type: 'integer', notNull: true },
    refresh_token: { type: 'text', notNull: true },
    refresh_token_expires_in: { type: 'integer', notNull: true },
    scope: { type: 'text', notNull: false }, // GitHub returns empty string for scope sometimes
    token_type: { type: 'text', notNull: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('token');
};
