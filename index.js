'use strict'

require('dotenv').config()

const {
  Client, GatewayIntentBits,
  Collection, Events, ActivityType,
} = require('discord.js')
const fs     = require('fs')
const path   = require('path')
const logger = require('./src/logger')
const config = require('./src/config')

logger.banner()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
})

// ─── Załaduj komendy ─────────────────────────
client.commands = new Collection()
const cmdPath   = path.join(__dirname, 'src', 'commands')

for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(cmdPath, file))
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd)
    logger.ok(`Załadowano: /${cmd.data.name}`)
  }
}

logger.divider()

// ─── Ready ───────────────────────────────────
client.once(Events.ClientReady, (c) => {
  logger.ok(`Zalogowany jako: ${c.user.tag}`)
  logger.info(`Serwery: ${c.guilds.cache.size}`)
  logger.info(`Komendy: ${client.commands.size}`)
  logger.divider()

  // Rotacja statusów co 30s
  const statuses = [
    { text: 'GLos Logistics | /stats',    type: ActivityType.Watching  },
    { text: 'trasy po Europie 🚛',         type: ActivityType.Playing   },
    { text: 'GLos Logistics | /ranking',  type: ActivityType.Watching  },
    { text: 'nowe podania | /recruitment',type: ActivityType.Watching  },
  ]
  let i = 0
  c.user.setActivity(statuses[0].text, { type: statuses[0].type })

  setInterval(() => {
    i = (i + 1) % statuses.length
    c.user.setActivity(statuses[i].text, { type: statuses[i].type })
  }, 30_000)
})

// ─── Interaction Handler ──────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  logger.cmd(`/${interaction.commandName}`, {
    user:  interaction.user.tag,
    guild: interaction.guild?.name,
  })

  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(`/${interaction.commandName} — nieoczekiwany błąd`, {
      message: error.message,
    })

    const errEmbed = {
      color:       0xEF4444,
      title:       '❌ Nieoczekiwany błąd',
      description: 'Coś poszło nie tak. Spróbuj ponownie lub skontaktuj się z administracją.',
      footer:      { text: 'GLos Logistics Bot' },
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {})
    } else {
      await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {})
    }
  }
})

// ─── Powitanie nowego członka ─────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  logger.event(`Nowy członek: ${member.user.tag}`)

  const channelId = config.channels.welcome
  const ch = channelId
    ? member.guild.channels.cache.get(channelId)
    : member.guild.channels.cache.find(c => c.name.includes('powitania'))

  if (!ch) return

  await ch.send({
    embeds: [{
      color:       0xF59E0B,
      title:       '🚛 Nowy kierowca na horyzoncie!',
      description: `Witaj na serwerze **GLos Logistics**, <@${member.id}>! 👋`,
      thumbnail:   { url: member.user.displayAvatarURL({ size: 256 }) },
      fields: [
        {
          name:  '📋 Pierwsze kroki',
          value: '1. Przeczytaj regulamin\n2. Złóż podanie rekrutacyjne na stronie\n3. Poczekaj na weryfikację od admina',
        },
        {
          name:   '🌐 Strona VTC',
          value:  `[gloslogistics.pl](${config.site.url})`,
          inline: true,
        },
        {
          name:   '📝 Rekrutacja',
          value:  `[Złóż podanie](${config.site.url}/recruitment)`,
          inline: true,
        },
      ],
      footer:    { text: 'GLos Logistics • Miło Cię widzieć!' },
      timestamp: new Date().toISOString(),
    }],
  })
})

client.on(Events.GuildMemberRemove, (member) => {
  logger.event(`Opuścił serwer: ${member.user.tag}`)
})

// ─── Globalne error handlery ──────────────────
process.on('unhandledRejection', (error) => {
  logger.error('unhandledRejection', { message: error?.message })
})

process.on('uncaughtException', (error) => {
  logger.error('uncaughtException', { message: error?.message })
})

client.login(config.discord.token)
