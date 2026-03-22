'use strict'

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMemberByDiscordId, getMemberStats } = require('../supabase')
const { notFoundEmbed, bannedEmbed, footer }   = require('../utils/embeds')
const { checkCooldown }                        = require('../utils/cooldown')
const { RANK_EMOJI, RANK_COLOR, PERIOD_LABEL } = require('../constants')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Sprawdź statystyki kierowcy GLos Logistics')
    .addUserOption(o =>
      o.setName('kierowca')
        .setDescription('Kierowca do sprawdzenia (domyślnie: Ty)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('okres')
        .setDescription('Zakres czasowy statystyk')
        .setRequired(false)
        .addChoices(
          { name: '📅 Ten tydzień',  value: 'week'  },
          { name: '📆 Ten miesiąc', value: 'month' },
          { name: '🏆 Cały czas',   value: 'all'   },
        )
    ),

  async execute(interaction) {
    // ── Cooldown 8s ──────────────────────────
    const cd = checkCooldown(interaction.user.id, 'stats', 8)
    if (cd > 0) {
      return interaction.reply({
        embeds: [{
          color:       0x71717A,
          description: `⏳ Poczekaj jeszcze **${cd}s** przed użyciem tej komendy.`,
        }],
        ephemeral: true,
      })
    }

    await interaction.deferReply()

    const targetUser = interaction.options.getUser('kierowca') ?? interaction.user
    const period     = interaction.options.getString('okres')   ?? 'week'

    const member = await getMemberByDiscordId(targetUser.id)

    if (!member)         return interaction.editReply({ embeds: [notFoundEmbed(targetUser.username)] })
    if (member.is_banned) return interaction.editReply({ embeds: [bannedEmbed(member.username)] })

    const stats = await getMemberStats(member.id, period)

    const rankColor = RANK_COLOR[member.rank] ?? 0xF59E0B
    const rankEmoji = RANK_EMOJI[member.rank]  ?? '🚛'

    // ── Wylicz dodatkowe metryki ─────────────
    const avgDistPerJob = stats.jobCount > 0
      ? Math.round(stats.totalDistance / stats.jobCount)
      : 0

    const cleanRatio = stats.jobCount > 0
      ? Math.round((stats.cleanJobs / stats.jobCount) * 100)
      : 0

    const periodLabel = PERIOD_LABEL[period]

    const embed = new EmbedBuilder()
      .setColor(rankColor)
      .setAuthor({
        name:    `${rankEmoji} ${member.username}`,
        iconURL: targetUser.displayAvatarURL({ size: 64 }),
      })
      .setTitle(`Statystyki — ${periodLabel}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        // Wiersz 1 — główne
        {
          name:   '📏 Łączny dystans',
          value:  `**${stats.totalDistance.toLocaleString('pl-PL')} km**`,
          inline: true,
        },
        {
          name:   '💰 Zarobki',
          value:  `**${stats.totalIncome.toLocaleString('pl-PL')} VTC€**`,
          inline: true,
        },
        {
          name:   '📦 Zlecenia',
          value:  `**${stats.jobCount}**`,
          inline: true,
        },
        // Wiersz 2 — szczegóły
        {
          name:   '📍 Śr. dystans/job',
          value:  `${avgDistPerJob.toLocaleString('pl-PL')} km`,
          inline: true,
        },
        {
          name:   '✨ Czyste joby',
          value:  `${stats.cleanJobs} / ${stats.jobCount} (${cleanRatio}%)`,
          inline: true,
        },
        {
          name:   '💥 Śr. uszkodzenia',
          value:  `${stats.avgDamage.toFixed(1)}%`,
          inline: true,
        },
        // Wiersz 3 — profil
        {
          name:   '🏅 Ranga',
          value:  `${rankEmoji} **${member.rank}**`,
          inline: true,
        },
        {
          name:   '⭐ Punkty łącznie',
          value:  `**${member.points.toLocaleString('pl-PL')}**`,
          inline: true,
        },
        {
          name:   '📅 W VTC od',
          value:  new Date(member.joined_at).toLocaleDateString('pl-PL'),
          inline: true,
        },
      )
      .setFooter(footer(`Dane za: ${periodLabel}`))
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  },
}
