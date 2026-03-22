'use strict'

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { getPendingApplications, updateApplicationStatus } = require('../supabase')
const { successEmbed, errorEmbed, noPermissionEmbed }     = require('../utils/embeds')
const { isAdmin }  = require('../utils/permissions')
const { COLORS }   = require('../constants')
const logger       = require('../logger')
const config       = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recruitment')
    .setDescription('📋 Zarządzaj podaniami rekrutacyjnymi [ADMIN]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s =>
      s.setName('lista').setDescription('Lista oczekujących podań')
    )
    .addSubcommand(s =>
      s.setName('accept')
        .setDescription('Zaakceptuj podanie')
        .addStringOption(o =>
          o.setName('id').setDescription('Pierwsze 8 znaków ID podania').setRequired(true)
        )
    )
    .addSubcommand(s =>
      s.setName('reject')
        .setDescription('Odrzuć podanie')
        .addStringOption(o =>
          o.setName('id').setDescription('Pierwsze 8 znaków ID podania').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('powód').setDescription('Powód odrzucenia').setRequired(false).setMaxLength(300)
        )
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true })
    }

    await interaction.deferReply({ ephemeral: true })

    const sub = interaction.options.getSubcommand()

    // ── /recruitment lista ───────────────────
    if (sub === 'lista') {
      const apps = await getPendingApplications(10)

      if (!apps.length) {
        return interaction.editReply({
          embeds: [successEmbed(
            'Brak oczekujących podań',
            'Wszystkie podania zostały już rozpatrzone. ✅'
          )],
        })
      }

      const fields = apps.map((app, i) => {
        const days = Math.floor((Date.now() - new Date(app.created_at)) / 86_400_000)
        return {
          name:   `${i + 1}. ${app.username}`,
          value: [
            `💬 Discord: \`${app.discord_tag}\``,
            `⏱️ ETS2: **${app.ets2_hours}h**`,
            `📅 ${days === 0 ? 'Dziś' : `${days} dni temu`}`,
            `🔑 ID: \`${app.id.slice(0, 8)}\``,
          ].join('\n'),
          inline: true,
        }
      })

      return interaction.editReply({
        embeds: [{
          color:       COLORS.purple,
          title:       `📋 Oczekujące podania — ${apps.length}`,
          description: 'Użyj `/recruitment accept [id]` lub `/recruitment reject [id]`',
          fields,
          footer:      { text: 'GLos Logistics • Rekrutacja' },
          timestamp:   new Date().toISOString(),
        }],
      })
    }

    // ── /recruitment accept / reject ─────────
    const shortId  = interaction.options.getString('id').trim()
    const reason   = interaction.options.getString('powód') ?? null
    const isAccept = sub === 'accept'

    const apps = await getPendingApplications(50)
    const app  = apps.find(a => a.id.startsWith(shortId))

    if (!app) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Nie znaleziono podania',
          `Brak oczekującego podania z ID \`${shortId}\`.\n\nUżyj \`/recruitment lista\` aby zobaczyć dostępne ID.`
        )],
      })
    }

    const ok = await updateApplicationStatus(
      app.id,
      isAccept ? 'accepted' : 'rejected',
      interaction.user.id,
    )

    if (!ok) {
      return interaction.editReply({
        embeds: [errorEmbed('Błąd bazy danych', 'Nie udało się zaktualizować podania.')],
      })
    }

    logger.ok(`Podanie ${isAccept ? 'zaakceptowane' : 'odrzucone'}: ${app.username}`, {
      by: interaction.user.tag, reason,
    })

    await interaction.editReply({
      embeds: [{
        color:       isAccept ? COLORS.green : COLORS.red,
        title:       isAccept ? '✅ Podanie zaakceptowane' : '❌ Podanie odrzucone',
        description: `Podanie **${app.username}** zostało ${isAccept ? 'zaakceptowane' : 'odrzucone'}.`,
        fields:      reason ? [{ name: '📝 Powód', value: reason }] : [],
        footer:      { text: `Przez: ${interaction.user.tag} • GLos Logistics` },
        timestamp:   new Date().toISOString(),
      }],
    })

    // Powiadom kanał #ogłoszenia jeśli accept
    if (isAccept) {
      const announceId = config.channels.announcements
      const ch = announceId
        ? interaction.guild.channels.cache.get(announceId)
        : interaction.guild.channels.cache.find(c => c.name.includes('ogłoszenia'))

      if (ch) {
        await ch.send({
          embeds: [{
            color:       COLORS.green,
            title:       '🎉 Nowy kierowca w GLos Logistics!',
            description: `Witamy **${app.username}** w naszej rodzinie! 🚛\n\nSkontaktuj się z administracją aby dokończyć onboarding.`,
            footer:      { text: 'GLos Logistics • Rekrutacja' },
            timestamp:   new Date().toISOString(),
          }],
        })
      }
    }
  },
}
