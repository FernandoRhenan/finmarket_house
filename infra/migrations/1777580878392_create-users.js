export const up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
    },
    username: {
      type: 'varchar(30)',
      notNull: true,
      unique: true,
    },
  })
}

export const down = false
