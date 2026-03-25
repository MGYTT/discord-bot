'use strict'

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const {
  getMemberByDiscordId, getMemberByUsername,
  banMember, unbanMember,
}                                                  = require('../supabase')
const { errorEmbed, successEmbed, warningEmbed, noPermissionEmbed } = require('../utils/embeds')
const { isAdmin }                                  = require('../utils/permissions')
const { RANK_EMOJI, COLORS }                       = require('../constants')
const logger                                       = require('../logger')
const config                                       = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Zarządzaj banami kierowców [ADMIN]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s =>
      s.setName('add')
        .setDescription('Zbanuj kierowcę')
        .addUserOption(o =>
          o.setName('użytkownik').setDescription('Użytkownik Discord').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('username').setDescription('Nick VTC (jeśli brak Discord)').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('powód').setDescription('Powód bana').setRequired(false).setMaxLength(300)
        )
    )
    .addSubcommand(s =>
      s.setName('remove')
        .setDescription('Odbanuj kierowcę')
        .addUserOption(o =>
          o.setName('użytkownik').setDescription('Użytkownik Discord').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('username').setDescription('Nick VTC (jeśli brak Discord)').setRequired(false)
        )
    )
    .addSubcommand(s =>
      s.setName('info')
        .setDescription('Sprawdź status bana kierowcy')
        .addUserOption(o =>
          o.setName('użytkownik').setDescription('Użytkownik Discord').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('username').setDescription('Nick VTC').setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true })
    }

    await interaction.deferReply({ ephemeral: true })

    const sub         = interaction.options.getSubcommand()
    const targetUser  = interaction.options.getUser('użytkownik')
    const vtcUsername = interaction.options.getString('username')?.trim()
    const reason      = interaction.options.getString('powód') ?? null

    // Pobierz member
    let member = null
    if (targetUser) {
      member = await getMemberByDiscordId(targetUser.id)
    } else if (vtcUsername) {
      member = await getMemberByUsername(vtcUsername)
    }

    if (!member) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Nie znaleziono',
          'Podaj użytkownika Discord lub nick VTC.'
        )],
      })
    }

    // ── /ban info ────────────────────────────
    if (sub === 'info') {
      return interaction.editReply({
        embeds: [{
          color:       member.is_banned ? COLORS.red : COLORS.green,
          title:       member.is_banned ? '🔨 Konto zbanowane' : '✅ Konto aktywne',
          description: `**${member.username}** ${RANK_EMOJI[member.rank] ?? ''}`,
          fields: member.is_banned ? [
            { name: '📝 Powód', value: member.ban_reason ?? 'Nie podano', inline: false },
          ] : [],
          footer:    { text: 'GLos Logistics Bot' },
          timestamp: new Date().toISOString(),
        }],
      })
    }

    // ── /ban add ─────────────────────────────
    if (sub === 'add') {
      if (member.rank === 'Owner') {
        return interaction.editReply({
          embeds: [errorEmbed('Brak uprawnień', 'Nie można zbanować Ownera.')],
        })
      }

      if (member.is_banned) {
        return interaction.editReply({
          embeds: [warningEmbed('Już zbanowany', `**${member.username}** jest już zbanowany.`)],
        })
      }

      const ok = await banMember(member.id, reason, interaction.user.id)
      if (!ok) {
        return interaction.editReply({
          embeds: [errorEmbed('Błąd bazy danych', 'Nie udało się zbanować konta.')],
        })
      }

      // Usuń role Discord
      if (targetUser) {
        try {
          const guildMember = await interaction.guild.members.fetch(targetUser.id)
          const rankRoleId  = config.roles[member.rank]
          if (rankRoleId) await guildMember.roles.remove(rankRoleId).catch(() => {})
        } catch {}
      }

      logger.ok(`Zbanowano: ${member.username}`, { by: interaction.user.tag, reason })

      await interaction.editReply({
        embeds: [successEmbed(
          'Konto zbanowane',
          `**${member.username}** został zbanowany.${reason ? `\n📝 Powód: ${reason}` : ''}`
        ).setFooter({ text: `Przez: ${interaction.user.tag} • GLos Logistics` })],
      })

      // Ogłoszenie
      const announceId = config.channels.announcements
      const ch = announceId
        ? interaction.guild.channels.cache.get(announceId)
        : null

      if (ch) {
        await ch.send({
          embeds: [{
            color:       COLORS.red,
            title:       '🔨 Kierowca zbanowany',
            description: `**${member.username}** został usunięty z GLos Logistics.`,
            fields:      reason ? [{ name: '📝 Powód', value: reason }] : [],
            footer:      { text: 'GLos Logistics • Administracja' },
            timestamp:   new Date().toISOString(),
          }],
        })
      }

      // DM
      if (targetUser) {
        try {
          await targetUser.send({
            embeds: [{
              color:       COLORS.red,
              title:       '🔨 Twoje konto zostało zbanowane',
              description: `Twoje konto w **GLos Logistics** zostało zablokowane.`,
              fields:      reason ? [{ name: '📝 Powód', value: reason }] : [],
              footer:      { text: 'GLos Logistics Bot' },
              timestamp:   new Date().toISOString(),
            }],
          })
        } catch {}
      }

      return
    }

    // ── /ban remove ──────────────────────────
    if (sub === 'remove') {
      if (!member.is_banned) {
        return interaction.editReply({
          embeds: [warningEmbed('Nie jest zbanowany', `**${member.username}** nie jest zbanowany.`)],
        })
      }

      const ok = await unbanMember(member.id)
      if (!ok) {
        return interaction.editReply({
          embeds: [errorEmbed('Błąd bazy danych', 'Nie udało się odbanować konta.')],
        })
      }

      // Przywróć rolę Discord
      if (targetUser) {
        try {
          const guildMember = await interaction.guild.members.fetch(targetUser.id)
          const rankRoleId  = config.roles[member.rank]
          if (rankRoleId) await guildMember.roles.add(rankRoleId).catch(() => {})
        } catch {}
      }

      logger.ok(`Odbanowano: ${member.username}`, { by: interaction.user.tag })

      await interaction.editReply({
        embeds: [successEmbed(
          'Konto odbanowane',
          `**${member.username}** może ponownie korzystać z GLos Logistics.`
        ).setFooter({ text: `Przez: ${interaction.user.tag} • GLos Logistics` })],
      })

      // DM
      if (targetUser) {
        try {
          await targetUser.send({
            embeds: [{
              color:       COLORS.green,
              title:       '✅ Twoje konto zostało odbanowane',
              description: 'Twoje konto w **GLos Logistics** zostało odblokowane. Możesz ponownie korzystać z systemu.',
              footer:      { text: 'GLos Logistics Bot' },
              timestamp:   new Date().toISOString(),
            }],
          })
        } catch {}
      }
    }
  },
}
