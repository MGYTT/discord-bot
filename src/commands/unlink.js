'use strict'

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { supabase }            = require('../supabase')
const { successEmbed, errorEmbed, noPermissionEmbed } = require('../utils/embeds')
const { isAdmin }             = require('../utils/permissions')
const logger                  = require('../logger')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('🔓 Usuń powiązanie Discord ↔ VTC [ADMIN]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Nick VTC do odpowiązania')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true })
    }

    await interaction.deferReply({ ephemeral: true })

    const username = interaction.options.getString('username').trim()

    // Znajdź konto
    const { data: member } = await supabase
      .from('members')
      .select('id, username, discord_id, rank')
      .ilike('username', username)
      .maybeSingle()

    if (!member) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Nie znaleziono',
          `Brak konta VTC o nicku **${username}**.`
        )],
      })
    }

    if (!member.discord_id) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Brak powiązania',
          `**${member.username}** nie ma powiązanego konta Discord.`
        )],
      })
    }

    // Wyczyść discord_id
    const { error } = await supabase
      .from('members')
      .update({ discord_id: null })
      .eq('id', member.id)

    if (error) {
      return interaction.editReply({
        embeds: [errorEmbed('Błąd bazy danych', error.message)],
      })
    }

    logger.ok(`Odpowiązano konto: ${member.username}`, { by: interaction.user.tag })

    await interaction.editReply({
      embeds: [successEmbed(
        'Konto odpowiązane',
        `Powiązanie Discord dla **${member.username}** zostało usunięte.\n\nMożesz teraz użyć \`/verify\` aby powiązać ponownie.`
      ).setFooter({ text: `Przez: ${interaction.user.tag} • GLos Logistics` })],
    })
  },
}
