'use strict'

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js')

const { getMemberByDiscordId } = require('../supabase')
const { notFoundEmbed, bannedEmbed, errorEmbed, footer } = require('../utils/embeds')
const { checkCooldown }        = require('../utils/cooldown')
const { RANK_EMOJI, COLORS }   = require('../constants')
const { supabase }             = require('../supabase')
const logger                   = require('../logger')

// ─── Stałe ───────────────────────────────────
const JOBS_PER_PAGE = 5

// ─── Helpers ─────────────────────────────────
function damageBar(percent) {
  const filled = Math.round(percent / 10)
  const empty  = 10 - filled
  const bar    = '█'.repeat(filled) + '░'.repeat(empty)
  const color  = percent === 0 ? '🟢' : percent < 20 ? '🟡' : percent < 50 ? '🟠' : '🔴'
  return `${color} \`${bar}\` ${percent}%`
}

function speedLabel(distKm, income) {
  if (distKm > 1500) return '🛣️ Mega-trasa'
  if (distKm > 800)  return '🚀 Długa trasa'
  if (distKm > 400)  return '🚛 Średnia trasa'
  return '📍 Krótka trasa'
}

function formatIncome(income) {
  if (income >= 1000) return `**${income.toLocaleString('pl-PL')} VTC€**`
  return `${income.toLocaleString('pl-PL')} VTC€`
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins  <  1) return 'przed chwilą'
  if (mins  < 60) return `${mins} min temu`
  if (hours < 24) return `${hours}h temu`
  if (days  <  7) return `${days}d temu`
  return new Date(dateStr).toLocaleDateString('pl-PL')
}

// ─── Pobierz joby z Supabase ──────────────────
async function fetchJobs(memberId, limit = 50) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, cargo, origin_city, destination_city, distance_km, income, fuel_used, damage_percent, completed_at, source')
    .eq('member_id', memberId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('fetchJobs', { memberId, error: error.message })
    return []
  }

  return data ?? []
}

// ─── Zbuduj embed dla strony ──────────────────
function buildJobsEmbed(member, targetUser, jobs, page, totalPages, period, stats) {
  const start    = page * JOBS_PER_PAGE
  const pageJobs = jobs.slice(start, start + JOBS_PER_PAGE)
  const rankEmoji = RANK_EMOJI[member.rank] ?? '🚛'

  const embed = new EmbedBuilder()
    .setColor(COLORS.amber)
    .setAuthor({
      name:    `${rankEmoji} ${member.username} — Historia zleceń`,
      iconURL: targetUser.displayAvatarURL({ size: 64 }),
    })
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))

  if (!jobs.length) {
    embed
      .setDescription('> 📭 Ten kierowca nie ma jeszcze żadnych ukończonych zleceń.')
      .setFooter(footer())
    return embed
  }

  // ── Statystyki na górze ──────────────────
  embed.addFields({
    name:  '📊 Podsumowanie okresu',
    value: [
      `📦 Zlecenia: **${stats.jobCount}**`,
      `📏 Łącznie: **${stats.totalDistance.toLocaleString('pl-PL')} km**`,
      `💰 Zarobki: **${stats.totalIncome.toLocaleString('pl-PL')} VTC€**`,
      `✨ Czyste: **${stats.cleanJobs}/${stats.jobCount}**`,
    ].join('  •  '),
    inline: false,
  })

  embed.addFields({ name: '\u200B', value: '\u200B', inline: false })

  // ── Lista jobów ──────────────────────────
  pageJobs.forEach((job, i) => {
    const num          = start + i + 1
    const distKm       = job.distance_km ?? 0
    const income       = job.income      ?? 0
    const damage       = job.damage_percent ?? 0
    const cargo        = job.cargo       ?? '—'
    const origin       = job.origin_city ?? '—'
    const destination  = job.destination_city ?? '—'
    const fuelUsed     = job.fuel_used   ?? null
    const sourceEmoji  = job.source === 'bridge' ? '🌉' : '📋'

    const lines = [
      `\`${origin}\` **→** \`${destination}\``,
      `📦 ${cargo}`,
      `📏 **${distKm.toLocaleString('pl-PL')} km**  •  ${speedLabel(distKm, income)}`,
      `💰 ${formatIncome(income)}`,
      damage > 0
        ? `💥 Uszkodzenia: ${damageBar(damage)}`
        : `✨ Brak uszkodzeń`,
      fuelUsed
        ? `⛽ Paliwo: ${fuelUsed.toFixed(1)}L  (${distKm > 0 ? ((fuelUsed / distKm) * 100).toFixed(1) : '—'} l/100km)`
        : null,
      `🕐 ${timeAgo(job.completed_at)}  ${sourceEmoji}`,
    ].filter(Boolean).join('\n')

    embed.addFields({
      name:   `#${num}  ${damage === 0 ? '✅' : damage < 20 ? '⚠️' : '❌'}  ${origin} → ${destination}`,
      value:  lines,
      inline: false,
    })
  })

  embed
    .setFooter(footer(`Strona ${page + 1}/${totalPages}  •  ${jobs.length} zleceń łącznie`))
    .setTimestamp()

  return embed
}

// ─── Zbuduj przyciski paginacji ───────────────
function buildButtons(page, totalPages) {
  const row = new ActionRowBuilder()

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('job_first')
      .setLabel('⏮')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),

    new ButtonBuilder()
      .setCustomId('job_prev')
      .setLabel('◀ Poprzednia')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),

    new ButtonBuilder()
      .setCustomId('job_page')
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId('job_next')
      .setLabel('Następna ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),

    new ButtonBuilder()
      .setCustomId('job_last')
      .setLabel('⏭')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  )

  return row
}

// ─── Komenda ──────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('job')
    .setDescription('🚛 Historia zleceń kierowcy GLos Logistics')
    .addUserOption(o =>
      o.setName('kierowca')
        .setDescription('Kierowca do sprawdzenia (domyślnie: Ty)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('okres')
        .setDescription('Zakres czasowy (domyślnie: cały czas)')
        .setRequired(false)
        .addChoices(
          { name: '📅 Ten tydzień',   value: 'week'  },
          { name: '📆 Ten miesiąc',  value: 'month' },
          { name: '🏆 Cały czas',    value: 'all'   },
        )
    )
    .addStringOption(o =>
      o.setName('cargo')
        .setDescription('Filtruj po typie ładunku')
        .setRequired(false)
    ),

  async execute(interaction) {
    // ── Cooldown 10s ─────────────────────────
    const cd = checkCooldown(interaction.user.id, 'job', 10)
    if (cd > 0) {
      return interaction.reply({
        embeds: [{
          color:       COLORS.zinc,
          description: `⏳ Poczekaj jeszcze **${cd}s** przed użyciem tej komendy.`,
        }],
        ephemeral: true,
      })
    }

    await interaction.deferReply()

    const targetUser  = interaction.options.getUser('kierowca') ?? interaction.user
    const period      = interaction.options.getString('okres')   ?? 'all'
    const cargoFilter = interaction.options.getString('cargo')?.toLowerCase().trim() ?? null

    // ── Pobierz kierowcę ─────────────────────
    const member = await getMemberByDiscordId(targetUser.id)
    if (!member)          return interaction.editReply({ embeds: [notFoundEmbed(targetUser.username)] })
    if (member.is_banned) return interaction.editReply({ embeds: [bannedEmbed(member.username)] })

    // ── Pobierz joby ─────────────────────────
    let jobs = await fetchJobs(member.id, 100)

    // Filtr okresu
    const periodFrom = period === 'week'
      ? new Date(Date.now() - 7  * 86_400_000)
      : period === 'month'
      ? new Date(Date.now() - 30 * 86_400_000)
      : null

    if (periodFrom) {
      jobs = jobs.filter(j => new Date(j.completed_at) >= periodFrom)
    }

    // Filtr ładunku
    if (cargoFilter) {
      jobs = jobs.filter(j => j.cargo?.toLowerCase().includes(cargoFilter))
    }

    // ── Oblicz statystyki ────────────────────
    const stats = {
      jobCount:      jobs.length,
      totalDistance: jobs.reduce((s, j) => s + (j.distance_km ?? 0), 0),
      totalIncome:   jobs.reduce((s, j) => s + (j.income      ?? 0), 0),
      cleanJobs:     jobs.filter(j => (j.damage_percent ?? 0) === 0).length,
    }

    const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE))
    let   page       = 0

    // ── Wyślij pierwszą stronę ───────────────
    const embed   = buildJobsEmbed(member, targetUser, jobs, page, totalPages, period, stats)
    const buttons = totalPages > 1 ? buildButtons(page, totalPages) : null

    const message = await interaction.editReply({
      embeds:     [embed],
      components: buttons ? [buttons] : [],
    })

    // ── Jeśli tylko 1 strona — koniec ────────
    if (totalPages <= 1) return

    // ── Kolektor przycisków ──────────────────
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time:          120_000,  // 2 minuty
      filter:        i => i.user.id === interaction.user.id,
    })

    collector.on('collect', async (btnInteraction) => {
      switch (btnInteraction.customId) {
        case 'job_first': page = 0;               break
        case 'job_prev':  page = Math.max(0, page - 1);              break
        case 'job_next':  page = Math.min(totalPages - 1, page + 1); break
        case 'job_last':  page = totalPages - 1;  break
      }

      const newEmbed   = buildJobsEmbed(member, targetUser, jobs, page, totalPages, period, stats)
      const newButtons = buildButtons(page, totalPages)

      await btnInteraction.update({
        embeds:     [newEmbed],
        components: [newButtons],
      })
    })

    // ── Po timeout wyłącz przyciski ──────────
    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('job_first').setLabel('⏮').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('job_prev').setLabel('◀ Poprzednia').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('job_page').setLabel(`${page + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('job_next').setLabel('Następna ▶').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('job_last').setLabel('⏭').setStyle(ButtonStyle.Secondary).setDisabled(true),
      )

      await interaction.editReply({ components: [disabledRow] }).catch(() => {})
    })

    logger.cmd('/job', {
      user:   interaction.user.tag,
      target: member.username,
      jobs:   jobs.length,
      pages:  totalPages,
      period,
    })
  },
}
