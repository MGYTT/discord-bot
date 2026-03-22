'use strict'

const { EmbedBuilder }        = require('discord.js')
const { COLORS, RANK_EMOJI }  = require('../constants')
const config                  = require('../config')

const footer = (extra = '') => ({
  text: extra ? `GLos Logistics • ${extra}` : 'GLos Logistics',
  icon_url: `${config.site.url}/images/logo.png`,
})

// ─── Gotowe embedy ───────────────────────────

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter(footer())
    .setTimestamp()
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setFooter(footer())
    .setTimestamp()
}

function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.orange)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setFooter(footer())
    .setTimestamp()
}

function notFoundEmbed(what = 'Kierowca') {
  return errorEmbed(
    'Nie znaleziono',
    `**${what}** nie ma powiązanego konta GLos Logistics.\n\n` +
    `Skontaktuj się z administracją w celu weryfikacji.`
  )
}

function bannedEmbed(username) {
  return errorEmbed(
    'Konto zbanowane',
    `Kierowca **${username ?? 'nieznany'}** ma zablokowane konto GLos Logistics.`
  )
}

function noPermissionEmbed() {
  return errorEmbed(
    'Brak uprawnień',
    'Ta komenda jest dostępna tylko dla administracji.'
  )
}

function loadingEmbed(text = 'Pobieranie danych...') {
  return new EmbedBuilder()
    .setColor(COLORS.zinc)
    .setDescription(`⏳ ${text}`)
}

module.exports = {
  footer,
  errorEmbed,
  successEmbed,
  warningEmbed,
  notFoundEmbed,
  bannedEmbed,
  noPermissionEmbed,
  loadingEmbed,
}
