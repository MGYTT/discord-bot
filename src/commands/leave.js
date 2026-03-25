'use strict'

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const {
  getMemberByDiscordId,
  getMemberLeaves,
  getActiveLeaves,
  supabase,
}                                           = require('../supabase')
const { notFoundEmbed, bannedEmbed, noPermissionEmbed, footer } = require('../utils/embeds')
const { checkCooldown }                     = require('../utils/cooldown')
const { isAdmin }                           = require('../utils/permissions')
const { COLORS }                            = require('../constants')

const LEAVE_EMOJI = {
  paid:   '🏖️',
  unpaid: '📋',
  sick:   '🏥',
  forced: '🔒',
}

const LEAVE_LABEL = {
  paid:   'Urlop płatny',
  unpaid: 'Urlop bezpłatny',
  sick:   'Zwolnienie L4',
  forced: 'Przymusowe wolne',
}

const STATUS_EMOJI = {
  pending:  '⏳',
  approved: '✅',
  active:   '🟢',
  rejected: '❌',
  ended:    '⬜',
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('🏖️ Urlopy kierowców GLos Logistics')
    .addSubcommand(s =>
      s.setName('moje')
        .setDescription('Sprawdź swoje wnioski urlopowe')
    )
    .addSubcommand(s =>
      s.setName('sprawdź')
        .setDescription('Sprawdź urlopy kierowcy [ADMIN]')
        .addUserOption(o =>
          o.setName('kierowca').setDescription('Kierowca Discord').setRequired(true)
        )
    )
    .addSubcommand(s =>
      s.setName('aktywne')
        .setDescription('Lista wszystkich aktywnych urlopów')
    ),

  async execute(interaction) {
    const cd = checkCooldown(interaction.user.id, 'leave', 8)
    if (cd > 0) {
      return interaction.reply({
        embeds: [{ color: COLORS.zinc, description: `⏳ Poczekaj jeszcze **${cd}s**.` }],
        ephemeral: true,
      })
    }

    await interaction.deferReply({ ephemeral: true })

    const sub = interaction.options.getSubcommand()

    // ── /leave moje ──────────────────────────
    if (sub === 'moje') {
      const member = await getMemberByDiscordId(interaction.user.id)
      if (!member) return interaction.editReply({ embeds: [notFoundEmbed(interaction.user.username)] })

      const leaves = await getMemberLeaves(member.id)

      if (!leaves.length) {
        return interaction.editReply({
          embeds: [{
            color:       COLORS.zinc,
            title:       '🏖️ Twoje urlopy',
            description: 'Nie masz jeszcze żadnych wniosków urlopowych.\nZłóż wniosek na stronie: ' +
              `[panel kierowcy](${require('../config').site.url}/hub/leaves)`,
            footer:      footer(),
          }],
        })
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.blue)
        .setTitle('🏖️ Twoje urlopy')
        .setFooter(footer())
        .setTimestamp()

      leaves.forEach(l => {
        const days = Math.ceil(
          (new Date(l.end_date) - new Date(l.start_date)) / 86_400_000
        ) + 1

        embed.addFields({
          name: `${LEAVE_EMOJI[l.type] ?? '📋'} ${LEAVE_LABEL[l.type] ?? l.type}  ${STATUS_EMOJI[l.status] ?? ''}`,
          value: [
            `📅 ${l.start_date} — ${l.end_date} (**${days} dni**)`,
            l.reason     ? `📝 ${l.reason}`     : null,
            l.admin_note ? `💬 Admin: ${l.admin_note}` : null,
          ].filter(Boolean).join('\n'),
          inline: false,
        })
      })

      return interaction.editReply({ embeds: [embed] })
    }

    // ── /leave sprawdź ───────────────────────
    if (sub === 'sprawdź') {
      if (!isAdmin(interaction.member)) {
        return interaction.editReply({ embeds: [noPermissionEmbed()] })
      }

      const targetUser = interaction.options.getUser('kierowca')
      const member     = await getMemberByDiscordId(targetUser.id)
      if (!member) return interaction.editReply({ embeds: [notFoundEmbed(targetUser.username)] })

      const leaves = await getMemberLeaves(member.id)

      const embed = new EmbedBuilder()
        .setColor(COLORS.purple)
        .setTitle(`🏖️ Urlopy: ${member.username}`)
        .setDescription(leaves.length ? null : 'Brak wniosków urlopowych.')
        .setThumbnail(targetUser.displayAvatarURL({ size: 64 }))
        .setFooter(footer())
        .setTimestamp()

      leaves.forEach(l => {
        const days = Math.ceil(
          (new Date(l.end_date) - new Date(l.start_date)) / 86_400_000
        ) + 1

        embed.addFields({
          name: `${LEAVE_EMOJI[l.type] ?? '📋'} ${LEAVE_LABEL[l.type] ?? l.type}  ${STATUS_EMOJI[l.status] ?? ''}`,
          value: [
            `📅 ${l.start_date} — ${l.end_date} (**${days} dni**)`,
            l.reason     ? `📝 ${l.reason}`          : null,
            l.admin_note ? `💬 Admin: ${l.admin_note}` : null,
          ].filter(Boolean).join('\n'),
          inline: false,
        })
      })

      return interaction.editReply({ embeds: [embed] })
    }

    // ── /leave aktywne ───────────────────────
    if (sub === 'aktywne') {
      if (!isAdmin(interaction.member)) {
        return interaction.editReply({ embeds: [noPermissionEmbed()] })
      }

      const activeLeaves = await getActiveLeaves()

      if (!activeLeaves.length) {
        return interaction.editReply({
          embeds: [{
            color:       COLORS.green,
            title:       '✅ Brak aktywnych urlopów',
            description: 'Wszyscy kierowcy są aktywni.',
            footer:      footer(),
          }],
        })
      }

      // Pobierz dane kierowców
      const memberIds = [...new Set(activeLeaves.map(l => l.member_id))]
      const { data: members } = await supabase
        .from('members')
        .select('id, username, rank, discord_id')
        .in('id', memberIds)

      const membersMap = Object.fromEntries((members ?? []).map(m => [m.id, m]))

      const embed = new EmbedBuilder()
        .setColor(COLORS.blue)
        .setTitle(`🏖️ Aktywne urlopy — ${activeLeaves.length} kierowców`)
        .setFooter(footer())
        .setTimestamp()

      activeLeaves.forEach(l => {
        const m    = membersMap[l.member_id]
        const days = Math.ceil(
          (new Date(l.end_date) - new Date(l.start_date)) / 86_400_000
        ) + 1

        embed.addFields({
          name:   `${LEAVE_EMOJI[l.type] ?? '📋'} ${m?.username ?? 'Nieznany'}`,
          value:  `📅 ${l.start_date} — ${l.end_date} (${days} dni)\n${m?.discord_id ? `<@${m.discord_id}>` : ''}`,
          inline: true,
        })
      })

      return interaction.editReply({ embeds: [embed] })
    }
  },
}
