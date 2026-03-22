'use strict'

require('dotenv').config()

const { REST, Routes } = require('discord.js')
const fs     = require('fs')
const path   = require('path')
const logger = require('./src/logger')
const config = require('./src/config')

logger.banner()

const commands  = []
const cmdPath   = path.join(__dirname, 'src', 'commands')

for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(cmdPath, file))
  if (cmd.data) {
    commands.push(cmd.data.toJSON())
    logger.ok(`Przygotowano: /${cmd.data.name}`)
  }
}

logger.divider()

const rest = new REST().setToken(config.discord.token)

;(async () => {
  try {
    logger.info(`Rejestruję ${commands.length} komend na serwerze...`)

    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands },
    )

    logger.ok('Wszystkie komendy zarejestrowane pomyślnie!')
    logger.info('Możesz teraz uruchomić bota: npm start')
  } catch (error) {
    logger.error('Błąd rejestracji komend', { message: error.message })
    process.exit(1)
  }
})()
