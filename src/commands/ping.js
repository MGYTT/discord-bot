'use strict'

const { SlashCommandBuilder } = require('discord.js')
const { COLORS }              = require('../constants')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Sprawdź opóźnienie bota'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [{
        color:       COLORS.zinc,
        description: '⏳ Mierzę...',
      }],
      fetchReply: true,
    })

    const latency    = sent.createdTimestamp - interaction.createdTimestamp
    const apiLatency = Math.round(interaction.client.ws.ping)

    const color = latency < 100 ? COLORS.green
                : latency < 300 ? COLORS.amber
                : COLORS.red

    await interaction.editReply({
      embeds: [{
        color,
        title: '🏓 Pong!',
        fields: [
          { name: '⚡ Bot',     value: `**${latency}ms**`,    inline: true },
          { name: '🌐 Discord', value: `**${apiLatency}ms**`, inline: true },
        ],
        footer:    { text: 'GLos Logistics Bot' },
        timestamp: new Date().toISOString(),
      }],
    })
  },
}
