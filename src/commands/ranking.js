'use strict'

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getTopMembers }                     = require('../supabase')
const { footer }                            = require('../utils/embeds')
const { checkCooldown }                     = require('../utils/cooldown')
const { RANK_EMOJI, RANK_COLOR, COLORS, PERIOD_LABEL } = require('../constants')

const MEDALS = ['🥇', '🥈', '🥉']

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('🏆 Ranking kierowców GLos Logistics')
    .addStringOption(o =>
      o.setName('okres')
        .setDescription('Zakres czasowy (domyślnie: tydzień)')
        .setRequired(false)
        .addChoices(
          { name: '📅 Ten tydzień',  value: 'week'  },
          { name: '📆 Ten miesiąc', value: 'month' },
          { name: '🏆 Cały czas',   value: 'all'   },
        )
    )
    .addStringOption(o =>
      o.setName('typ')
        .setDescription('Sortuj według (domyślnie: dystans)')
        .setRequired(false)
        .addChoices(
          { name: '📏 Dystans',  value: 'distance' },
          { name: '💰 Zarobki', value: 'income'   },
          { name: '📦 Zlecenia', value: 'jobs'     },
        )
    ),

  async execute(interaction) {
    const cd = checkCooldown(interaction.user.id, 'ranking', 15)
    if (cd > 0) {
      return interaction.reply({
        embeds: [{ color: COLORS.zinc, description: `⏳ Poczekaj jeszcze **${cd}s**.` }],
        ephemeral: true,
      })
    }

    await interaction.deferReply()

    const period = interaction.options.getString('okres') ?? 'week'
    const sortBy = interaction.options.getString('typ')   ?? 'distance'

    let top = await getTopMembers(10, period)

    // Sortowanie
    if (sortBy === 'income') top.sort((a, b) => b.stats.income   - a.stats.income)
    if (sortBy === 'jobs')   top.sort((a, b) => b.stats.jobs     - a.stats.jobs)

    if (!top.length) {
      return interaction.editReply({
        embeds: [{
          color:       COLORS.zinc,
          title:       '🏆 Ranking pusty',
          description: `Brak danych za ${PERIOD_LABEL[period]}.`,
          footer:      footer(),
        }],
      })
    }

    const sortLabel = sortBy === 'distance' ? '📏 dystans'
                    : sortBy === 'income'   ? '💰 zarobki'
                    : '📦 zlecenia'

    const embed = new EmbedBuilder()
      .setColor(COLORS.amber)
      .setTitle(`🏆 Ranking GLos Logistics — ${PERIOD_LABEL[period]}`)
      .setDescription(`Sortowanie: **${sortLabel}**`)
      .setTimestamp()
      .setFooter(footer())

    top.forEach((m, i) => {
      const medal     = MEDALS[i] ?? `**${i + 1}.**`
      const rankEmoji = RANK_EMOJI[m.rank] ?? '🚛'
      const value = [
        sortBy === 'distance'
          ? `📏 **${m.stats.distance.toLocaleString('pl-PL')} km**`
          : `📏 ${m.stats.distance.toLocaleString('pl-PL')} km`,
        sortBy === 'income'
          ? `💰 **${m.stats.income.toLocaleString('pl-PL')} VTC€**`
          : `💰 ${m.stats.income.toLocaleString('pl-PL')} VTC€`,
        sortBy === 'jobs'
          ? `📦 **${m.stats.jobs} zleceń**`
          : `📦 ${m.stats.jobs} zleceń`,
        `${rankEmoji} ${m.rank}`,
      ].join('  •  ')

      embed.addFields({
        name:   `${medal} ${m.username}`,
        value,
        inline: false,
      })
    })

    await interaction.editReply({ embeds: [embed] })
  },
}
