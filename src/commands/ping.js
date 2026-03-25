'use strict'

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { footer }                            = require('../utils/embeds')
const { COLORS }                            = require('../constants')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Sprawdź opóźnienie bota i status połączenia'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [{
        color:       COLORS.zinc,
        description: '⏳  Mierzę opóźnienie...',
      }],
      fetchReply: true,
    })

    const latency    = sent.createdTimestamp - interaction.createdTimestamp
    const apiLatency = Math.round(interaction.client.ws.ping)

    const statusEmoji = latency < 100 ? '🟢'
                      : latency < 300 ? '🟡'
                      : '🔴'

    const color = latency < 100 ? COLORS.green
                : latency < 300 ? COLORS.amber
                : COLORS.red

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏓  Pong!')
      .setDescription(`${statusEmoji}  Połączenie **${latency < 100 ? 'doskonałe' : latency < 300 ? 'dobre' : 'słabe'}**`)
      .addFields(
        { name: '⚡  Opóźnienie bota',    value: `\`${latency}ms\``,    inline: true },
        { name: '🌐  API Discord',         value: `\`${apiLatency}ms\``, inline: true },
        { name: '📡  Status WebSocket',    value: `\`Połączony\``,       inline: true },
      )
      .setFooter(footer())
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  },
}
