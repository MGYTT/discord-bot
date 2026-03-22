'use strict'

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { getMemberByUsername, linkDiscordAccount }  = require('../supabase')
const { successEmbed, errorEmbed, warningEmbed, noPermissionEmbed } = require('../utils/embeds')
const { isAdmin, syncRoleOnDiscord } = require('../utils/permissions')
const { RANK_EMOJI }                 = require('../constants')
const logger                         = require('../logger')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('🔐 Powiąż konto Discord z kontem VTC [ADMIN]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o =>
      o.setName('użytkownik').setDescription('Użytkownik Discord').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('username').setDescription('Nick w systemie GLos Logistics').setRequired(true)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true })
    }

    await interaction.deferReply({ ephemeral: true })

    const targetUser  = interaction.options.getUser('użytkownik')
    const vtcUsername = interaction.options.getString('username').trim()

    const member = await getMemberByUsername(vtcUsername)

    if (!member) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Nie znaleziono konta VTC',
          `Brak konta o nicku **${vtcUsername}** w systemie GLos Logistics.\n\nUpewnij się, że nick jest poprawny (wielkość liter nie ma znaczenia).`
        )],
      })
    }

    // Już powiązane z innym kontem Discord
    if (member.discord_id && member.discord_id !== targetUser.id) {
      return interaction.editReply({
        embeds: [warningEmbed(
          'Konto już powiązane',
          `**${member.username}** jest już powiązany z innym kontem Discord.\n\nAby zmienić powiązanie, skontaktuj się z Ownerem.`
        )],
      })
    }

    // Już powiązane z tym samym
    if (member.discord_id === targetUser.id) {
      return interaction.editReply({
        embeds: [warningEmbed(
          'Już powiązane',
          `<@${targetUser.id}> jest już powiązany z kontem **${member.username}**.`
        )],
      })
    }

    const linked = await linkDiscordAccount(member.id, targetUser.id)
    if (!linked) {
      return interaction.editReply({
        embeds: [errorEmbed('Błąd bazy danych', 'Nie udało się zapisać powiązania. Spróbuj ponownie.')],
      })
    }

    // Nadaj rolę na Discordzie
    await syncRoleOnDiscord(interaction.guild, targetUser.id, null, member.rank)

    logger.ok(`Zweryfikowano: ${member.username} ↔ ${targetUser.tag}`, {
      by: interaction.user.tag,
    })

    // Potwierdź adminowi
    await interaction.editReply({
      embeds: [successEmbed(
        'Konto powiązane!',
        `<@${targetUser.id}> ↔ **${member.username}** ${RANK_EMOJI[member.rank] ?? ''}\n\nRola **${member.rank}** została nadana automatycznie.`
      )
        .setFooter({ text: `Przez: ${interaction.user.tag} • GLos Logistics` })
      ],
    })

    // DM do kierowcy
    try {
      await targetUser.send({
        embeds: [{
          color:       0xF59E0B,
          title:       '🚛 Konto GLos Logistics powiązane!',
          description: `Twoje konto Discord zostało powiązane z profilem **${member.username}** (${RANK_EMOJI[member.rank]} ${member.rank}).\n\nMożesz teraz używać komend bota, np. \`/stats\` i \`/whois\`!`,
          footer:      { text: 'GLos Logistics Bot' },
          timestamp:   new Date().toISOString(),
        }],
      })
    } catch {
      // DM zablokowane — ignoruj
    }
  },
}
