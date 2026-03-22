'use strict'

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const {
  getMemberByDiscordId, updateMemberRank,
}                                                  = require('../supabase')
const { errorEmbed, warningEmbed, noPermissionEmbed } = require('../utils/embeds')
const { isAdmin, syncRoleOnDiscord }               = require('../utils/permissions')
const { RANK_ORDER, RANK_EMOJI, COLORS }           = require('../constants')
const logger                                        = require('../logger')
const config                                        = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('🏅 Zmień rangę kierowcy [ADMIN]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o =>
      o.setName('kierowca').setDescription('Kierowca do awansu/degradacji').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('ranga')
        .setDescription('Nowa ranga VTC')
        .setRequired(true)
        .addChoices(
          { name: '🔰 Recruit', value: 'Recruit' },
          { name: '🚛 Driver',  value: 'Driver'  },
          { name: '⭐ Senior',  value: 'Senior'  },
          { name: '💎 Elite',   value: 'Elite'   },
          { name: '🛡️ Manager', value: 'Manager' },
        )
    )
    .addStringOption(o =>
      o.setName('powód')
        .setDescription('Opcjonalny powód zmiany rangi')
        .setRequired(false)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true })
    }

    await interaction.deferReply({ ephemeral: true })

    const targetUser = interaction.options.getUser('kierowca')
    const newRank    = interaction.options.getString('ranga')
    const reason     = interaction.options.getString('powód') ?? null

    const member = await getMemberByDiscordId(targetUser.id)

    if (!member) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Nie znaleziono kierowcy',
          `<@${targetUser.id}> nie ma powiązanego konta VTC.\nUżyj najpierw \`/verify\`.`
        )],
      })
    }

    if (member.rank === 'Owner') {
      return interaction.editReply({
        embeds: [errorEmbed('Brak uprawnień', 'Nie można zmieniać rangi Ownera przez Discord.')],
      })
    }

    if (member.rank === newRank) {
      return interaction.editReply({
        embeds: [warningEmbed('Brak zmian', `**${member.username}** ma już rangę **${newRank}**.`)],
      })
    }

    const oldRank = member.rank
    const isPromo = RANK_ORDER.indexOf(newRank) > RANK_ORDER.indexOf(oldRank)

    const updated = await updateMemberRank(member.id, newRank)
    if (!updated) {
      return interaction.editReply({
        embeds: [errorEmbed('Błąd bazy danych', 'Nie udało się zaktualizować rangi.')],
      })
    }

    // Zmień rolę Discord
    await syncRoleOnDiscord(interaction.guild, targetUser.id, oldRank, newRank)

    logger.ok(`Ranga zmieniona: ${member.username} ${oldRank} → ${newRank}`, {
      by: interaction.user.tag, reason,
    })

    // Odpowiedź dla admina
    await interaction.editReply({
      embeds: [{
        color:       isPromo ? COLORS.green : COLORS.red,
        title:       isPromo ? '🎉 Awans wykonany!' : '📉 Degradacja wykonana',
        description: `**${member.username}**: ${RANK_EMOJI[oldRank]} ${oldRank} → ${RANK_EMOJI[newRank]} **${newRank}**`,
        fields: reason ? [{ name: '📝 Powód', value: reason }] : [],
        footer:      { text: `Przez: ${interaction.user.tag} • GLos Logistics` },
        timestamp:   new Date().toISOString(),
      }],
    })

    // Ogłoszenie publiczne
    const announceId = config.channels.announcements
    const announceChannel = announceId
      ? interaction.guild.channels.cache.get(announceId)
      : interaction.guild.channels.cache.find(ch => ch.name.includes('ogłoszenia'))

    if (announceChannel) {
      await announceChannel.send({
        embeds: [{
          color:       isPromo ? COLORS.green : COLORS.red,
          title:       isPromo ? '🎉 Awans rangi w GLos Logistics!' : '📉 Zmiana rangi',
          description: isPromo
            ? `Gratulujemy <@${targetUser.id}>! Awansował na rangę ${RANK_EMOJI[newRank]} **${newRank}**! 🏆`
            : `<@${targetUser.id}> zmienił rangę na ${RANK_EMOJI[newRank]} **${newRank}**.`,
          fields: reason ? [{ name: '📝 Powód', value: reason }] : [],
          footer:      { text: 'GLos Logistics • System rang' },
          timestamp:   new Date().toISOString(),
        }],
      })
    }

    // DM do kierowcy
    try {
      await targetUser.send({
        embeds: [{
          color:       isPromo ? COLORS.green : COLORS.red,
          title:       isPromo ? '🎉 Dostałeś awans!' : '📋 Zmiana rangi',
          description: isPromo
            ? `Gratulacje! Awansowałeś na rangę **${RANK_EMOJI[newRank]} ${newRank}** w GLos Logistics!`
            : `Twoja ranga została zmieniona na **${RANK_EMOJI[newRank]} ${newRank}**.`,
          fields: reason ? [{ name: '📝 Powód', value: reason }] : [],
          footer:      { text: 'GLos Logistics Bot' },
          timestamp:   new Date().toISOString(),
        }],
      })
    } catch {
      // DM zablokowane
    }
  },
}
