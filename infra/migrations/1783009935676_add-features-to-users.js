module.exports.up = (pgm) => {
  pgm.addColumns('users', {
    features: {
      type: 'varchar[]',
      notNull: true,
      default: '{}',
    },
  })
}

module.exports.down = false
