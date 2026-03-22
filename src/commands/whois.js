'use strict'

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMemberByDiscordId }              = require('../supabase')
const { notFoundEmbed, footer }             = require('../utils/embeds')
const { checkCooldown }                     = require('../utils/cooldown')
const { RANK_EMOJI, RANK_COLOR }            = require('../constants')
const config                                = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('🔍 Sprawdź powiązane konto VTC użytkownika Discord')
    .addUserOption(o =>
      o.setName('użytkownik')
        .setDescription('Użytkownik Discord do sprawdzenia')
        .setRequired(true)
    ),

  async execute(interaction) {
    const cd = checkCooldown(interaction.user.id, 'whois', 5)
    if (cd > 0) {
      return interaction.reply({
        embeds: [{ color: 0x71717A, description: `⏳ Poczekaj jeszcze **${cd}s**.` }],
        ephemeral: true,
      })
    }

    await interaction.deferReply()

    const targetUser = interaction.options.getUser('użytkownik')
    const member     = await getMemberByDiscordId(targetUser.id)

    if (!member) return interaction.editReply({ embeds: [notFoundEmbed(targetUser.username)] })

    const rankEmoji = RANK_EMOJI[member.rank] ?? '🚛'
    const rankColor = RANK_COLOR[member.rank]  ?? 0xF59E0B

    const embed = new EmbedBuilder()
      .setColor(member.is_banned ? 0xEF4444 : rankColor)
      .setAuthor({
        name:    `🔍 Profil: ${member.username}`,
        iconURL: targetUser.displayAvatarURL({ size: 64 }),
      })
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name:   '👤 Discord',
          value:  `<@${targetUser.id}>`,
          inline: true,
        },
        {
          name:   '🏅 Ranga VTC',
          value:  `${rankEmoji} **${member.rank}**`,
          inline: true,
        },
        {
          name:   '⭐ Punkty',
          value:  `${member.points.toLocaleString('pl-PL')} pkt`,
          inline: true,
        },
        {
          name:   '🔖 Status',
          value:  member.is_banned ? '🔨 **Zbanowany**' : '✅ Aktywny',
          inline: true,
        },
        {
          name:   '📅 W VTC od',
          value:  new Date(member.joined_at).toLocaleDateString('pl-PL'),
          inline: true,
        },
        {
          name:   '🔗 TruckersHub',
          value:  member.truckershub_id
            ? `[Profil](https://truckershub.net/driver/${member.truckershub_id})`
            : '—',
          inline: true,
        },
        {
          name:   '🌐 Strona VTC',
          value:  `[${member.username} na GLos](${config.site.url}/members)`,
          inline: false,
        },
      )
      .setFooter(footer())
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  },
}
