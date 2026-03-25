'use strict'

const { EmbedBuilder }       = require('discord.js')
const { COLORS, RANK_EMOJI } = require('../constants')
const config                 = require('../config')

const footer = (extra = '') => ({
  text:     extra ? `GLos Logistics • ${extra}` : 'GLos Logistics',
  icon_url: `${config.site.url}/images/logo.png`,
})

// ─── Separator wizualny ───────────────────────
const SEP = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle(`❌  ${title}`)
    .setDescription(`> ${description}`)
    .setFooter(footer())
    .setTimestamp()
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle(`✅  ${title}`)
    .setDescription(`> ${description}`)
    .setFooter(footer())
    .setTimestamp()
}

function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.orange)
    .setTitle(`⚠️  ${title}`)
    .setDescription(`> ${description}`)
    .setFooter(footer())
    .setTimestamp()
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.blue)
    .setTitle(`ℹ️  ${title}`)
    .setDescription(`> ${description}`)
    .setFooter(footer())
    .setTimestamp()
}

function notFoundEmbed(what = 'Kierowca') {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle('❌  Nie znaleziono konta VTC')
    .setDescription(
      `> **${what}** nie ma powiązanego konta GLos Logistics.\n\n` +
      `> 🔗 Skontaktuj się z administracją w celu weryfikacji:\n` +
      `> [Panel GLos Logistics](${config.site.url})`
    )
    .setFooter(footer())
    .setTimestamp()
}

function bannedEmbed(username) {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle('🔨  Konto zablokowane')
    .setDescription(
      `> Kierowca **${username ?? 'nieznany'}** ma zablokowane konto GLos Logistics.\n` +
      `> Skontaktuj się z administracją w celu wyjaśnienia sytuacji.`
    )
    .setFooter(footer())
    .setTimestamp()
}

function noPermissionEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle('🔒  Brak uprawnień')
    .setDescription(
      '> Ta komenda jest dostępna wyłącznie dla **administracji GLos Logistics**.\n' +
      '> Jeśli uważasz, że to błąd — skontaktuj się z Ownerem.'
    )
    .setFooter(footer())
    .setTimestamp()
}

function cooldownEmbed(seconds) {
  return new EmbedBuilder()
    .setColor(COLORS.zinc)
    .setDescription(`⏳  Poczekaj jeszcze **${seconds}s** zanim użyjesz tej komendy ponownie.`)
}

function loadingEmbed(text = 'Pobieranie danych...') {
  return new EmbedBuilder()
    .setColor(COLORS.zinc)
    .setDescription(`<a:loading:1> ${text}`)
}

module.exports = {
  footer,
  SEP,
  errorEmbed,
  successEmbed,
  warningEmbed,
  infoEmbed,
  notFoundEmbed,
  bannedEmbed,
  noPermissionEmbed,
  cooldownEmbed,
  loadingEmbed,
}
