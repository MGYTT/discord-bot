'use strict'

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js')

const { footer, SEP }  = require('../utils/embeds')
const { COLORS }       = require('../constants')
const config           = require('../config')

// ─── Treści ───────────────────────────────────
const PAGES = {
  // ── Strona główna ────────────────────────
  home: () => new EmbedBuilder()
    .setColor(COLORS.amber)
    .setTitle('🚛  GLos Logistics — Informacje o VTC')
    .setDescription(
      '**Witaj w panelu informacyjnym GLos Logistics!**\n' +
      'Wybierz kategorię z menu poniżej, aby dowiedzieć się więcej.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '📋  Dostępne sekcje',
        value: [
          '📜  **Regulamin** — zasady obowiązujące w VTC',
          '🚛  **O nas** — historia i misja GLos Logistics',
          '📝  **Rekrutacja** — jak dołączyć do nas',
          '🏅  **System rang** — ścieżka kariery kierowcy',
          '🔗  **Linki** — strona, Discord, TruckersMP',
        ].join('\n'),
        inline: false,
      },
    )
    .setThumbnail(`${config.site.url}/images/logo.png`)
    .setFooter(footer('Użyj menu poniżej'))
    .setTimestamp(),

  // ── Regulamin ────────────────────────────
  regulamin: () => new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle('📜  Regulamin GLos Logistics')
    .setDescription(
      '> Przestrzeganie regulaminu jest obowiązkowe dla wszystkich członków.\n' +
      '> Łamanie zasad może skutkować degradacją lub banem.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '§1  Zachowanie i kultura',
        value: [
          '`1.1`  Traktuj innych z szacunkiem — zakaz wulgaryzmów i obrażania.',
          '`1.2`  Zakaz spamu, floodowania i reklam na kanałach VTC.',
          '`1.3`  Konflikty rozwiązuj z administracją, nie publicznie.',
          '`1.4`  Zakaz dyskryminacji ze względu na narodowość, wiek czy płeć.',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '§2  Aktywność',
        value: [
          '`2.1`  Minimum **2 zlecenia tygodniowo** lub złożony urlop.',
          '`2.2`  Nieaktywność bez urlopu powyżej **14 dni** = automatyczne usunięcie.',
          '`2.3`  Urlop zgłaszasz z wyprzedzeniem przez panel na stronie.',
          '`2.4`  Urlop nie może trwać dłużej niż **30 dni** bez zgody Managera.',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '§3  Jazda i zachowanie w grze',
        value: [
          '`3.1`  Jazda **z włączoną telemetrią** podczas zliczeń do statystyk.',
          '`3.2`  Zakaz celowego taranowania innych graczy (banTruckersMP).',
          '`3.3`  Respektuj przepisy drogowe w trybie multiplayer.',
          '`3.4`  Szkody powyżej **50%** na zleceniu nie liczą się do statystyk.',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '§4  Discord i komunikacja',
        value: [
          '`4.1`  Konto Discord musi być powiązane z profilem VTC (`/verify`).',
          '`4.2`  Nick na Discordzie powinien zawierać nick VTC.',
          '`4.3`  Informacje administracyjne publikowane są na kanale ogłoszeń.',
          '`4.4`  Zakaz udostępniania konta innym osobom.',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '§5  Sankcje',
        value: [
          '`5.1`  **Ostrzeżenie** — za drobne przewinienia.',
          '`5.2`  **Degradacja rangi** — za poważniejsze naruszenia.',
          '`5.3`  **Przymusowe wolne** — nałożone przez administrację.',
          '`5.4`  **Ban** — za rażące lub wielokrotne łamanie regulaminu.',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '\u200B',
        value:  `*Regulamin obowiązuje od daty dołączenia. Administracja zastrzega sobie prawo do zmian.*`,
        inline: false,
      }
    )
    .setFooter(footer('Regulamin v1.0'))
    .setTimestamp(),

  // ── O nas ────────────────────────────────
  about: () => new EmbedBuilder()
    .setColor(COLORS.amber)
    .setTitle('🚛  O GLos Logistics')
    .setDescription(
      '> **GLos Logistics** to polska społeczność kierowców ciężarówek\n' +
      '> działająca w Euro Truck Simulator 2 i American Truck Simulator.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '🎯  Nasza misja',
        value:  'Tworzymy przyjazną społeczność pasjonatów symulacji jazdy ciężarówką. Stawiamy na jakość, aktywność i wzajemny szacunek.',
        inline: false,
      },
      {
        name:   '🌍  Działamy w',
        value: [
          '🎮  **Euro Truck Simulator 2** — trasy po całej Europie',
          '🎮  **American Truck Simulator** — trasy po USA',
          '🌐  **TruckersMP** — tryb multiplayer',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '📊  GLos Logistics w liczbach',
        value: [
          '👥  Aktywna społeczność kierowców',
          '🗺️  Tysiące kilometrów tras tygodniowo',
          '📦  System zleceń z telemetrią',
          '🏆  Rankingi i system rang',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '💬  Kontakt z administracją',
        value:  `Napisz do nas przez Discord lub odwiedź [stronę VTC](${config.site.url}).`,
        inline: false,
      },
    )
    .setThumbnail(`${config.site.url}/images/logo.png`)
    .setFooter(footer())
    .setTimestamp(),

  // ── Rekrutacja ───────────────────────────
  recruitment: () => new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle('📝  Rekrutacja do GLos Logistics')
    .setDescription(
      '> Chcesz dołączyć do naszej ekipy? Świetnie!\n' +
      '> Przeczytaj wymagania i złóż podanie przez stronę.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '✅  Wymagania',
        value: [
          '`1`  Minimum **100 godzin** w ETS2 lub ATS (Steam)',
          '`2`  Aktywne konto **Discord** z weryfikacją',
          '`3`  Konto na **TruckersMP** (multiplayer)',
          '`4`  Wiek minimum **16 lat**',
          '`5`  Znajomość i akceptacja **regulaminu VTC**',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '📋  Jak aplikować?',
        value: [
          '`1`  Wejdź na [stronę rekrutacji](' + config.site.url + '/recruitment)',
          '`2`  Wypełnij formularz (nick, Steam, motywacja)',
          '`3`  Poczekaj na decyzję administracji (do **72h**)',
          '`4`  Przy akceptacji — skontaktuje się z Tobą admin',
          '`5`  Po weryfikacji użyj `/verify` na Discordzie',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '⏱️  Czas rozpatrzenia',
        value:  'Podania są rozpatrywane w ciągu **72 godzin**. Wynik pojawi się na kanale ogłoszeń oraz w wiadomości prywatnej.',
        inline: false,
      },
      {
        name:   '🔗  Złóż podanie',
        value:  `[👉 Formularz rekrutacyjny](${config.site.url}/recruitment)`,
        inline: false,
      },
    )
    .setFooter(footer('Rekrutacja'))
    .setTimestamp(),

  // ── Rangi ────────────────────────────────
  ranks: () => new EmbedBuilder()
    .setColor(COLORS.purple)
    .setTitle('🏅  System rang GLos Logistics')
    .setDescription(
      '> Awansuj przez aktywność, jakość jazdy i zaangażowanie w VTC.\n' +
      '> Każda ranga daje dostęp do nowych funkcji i kanałów.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '🔰  Recruit',
        value:  '> Nowy kierowca w VTC. Okres próbny — **2 tygodnie** aktywności.\n> Zadanie: ukończ minimum **10 zleceń** i poznaj społeczność.',
        inline: false,
      },
      {
        name:   '🚛  Driver',
        value:  '> Pełnoprawny kierowca GLos Logistics.\n> Wymagania: **25 zleceń** + pozytywna opinia admina.',
        inline: false,
      },
      {
        name:   '⭐  Senior Driver',
        value:  '> Doświadczony i zaufany kierowca.\n> Wymagania: **100 zleceń** + min. **3 miesiące** w VTC.',
        inline: false,
      },
      {
        name:   '💎  Elite Driver',
        value:  '> Elita GLos Logistics. Wzór dla pozostałych kierowców.\n> Wymagania: **300 zleceń** + wyjątkowe zaangażowanie.',
        inline: false,
      },
      {
        name:   '🛡️  Manager',
        value:  '> Członek administracji VTC.\n> Mianowany przez Ownera na podstawie zaufania i doświadczenia.',
        inline: false,
      },
      {
        name:   '👑  Owner',
        value:  '> Założyciel i właściciel GLos Logistics.\n> Najwyższy autorytet w organizacji.',
        inline: false,
      },
    )
    .setFooter(footer('System rang'))
    .setTimestamp(),

  // ── Linki ────────────────────────────────
  links: () => new EmbedBuilder()
    .setColor(COLORS.blue)
    .setTitle('🔗  Przydatne linki — GLos Logistics')
    .setDescription(
      '> Wszystkie ważne linki w jednym miejscu.\n\n' +
      SEP
    )
    .addFields(
      {
        name:   '🌐  Oficjalne strony',
        value: [
          `🏠  [Strona główna](${config.site.url})`,
          `📝  [Panel kierowcy](${config.site.url}/hub)`,
          `📋  [Rekrutacja](${config.site.url}/recruitment)`,
          `🏆  [Rankingi](${config.site.url}/hub)`,
        ].join('\n'),
        inline: true,
      },
      {
        name:   '🎮  TruckersMP',
        value: [
          '[🚛  TruckersMP — pobierz mod](https://truckersmp.com)',
          '[🗺️  Mapa online](https://map.truckersmp.com)',
          '[📊  Statystyki TMP](https://stats.truckersmp.com)',
        ].join('\n'),
        inline: true,
      },
      {
        name:   '🛠️  Przydatne narzędzia',
        value: [
          '[📡  TruckersHub](https://truckershub.net)',
          '[🗓️  ETS2 World of Trucks](https://www.worldoftrucks.com)',
          '[💬  Forum ETS2](https://forum.scssoft.com)',
        ].join('\n'),
        inline: false,
      },
      {
        name:   '📲  Kontakt',
        value: [
          `📧  Administracja: kanał \`#kontakt\` na Discordzie`,
          `🌐  Strona: [${config.site.url}](${config.site.url})`,
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter(footer())
    .setTimestamp(),
}

// ─── Menu opcji ───────────────────────────────
function buildMenu(current) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('info_menu')
      .setPlaceholder('📂  Wybierz kategorię...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('🏠  Strona główna')
          .setDescription('Przegląd wszystkich kategorii')
          .setValue('home')
          .setDefault(current === 'home'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📜  Regulamin')
          .setDescription('Zasady obowiązujące w GLos Logistics')
          .setValue('regulamin')
          .setDefault(current === 'regulamin'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🚛  O nas')
          .setDescription('Historia i misja GLos Logistics')
          .setValue('about')
          .setDefault(current === 'about'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📝  Rekrutacja')
          .setDescription('Jak dołączyć do VTC')
          .setValue('recruitment')
          .setDefault(current === 'recruitment'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🏅  System rang')
          .setDescription('Ścieżka kariery kierowcy')
          .setValue('ranks')
          .setDefault(current === 'ranks'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🔗  Linki')
          .setDescription('Strona, Discord, TruckersMP i inne')
          .setValue('links')
          .setDefault(current === 'links'),
      )
  )
}

// ─── Komenda ──────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('📋 Informacje o VTC, regulamin i przydatne linki')
    .addStringOption(o =>
      o.setName('sekcja')
        .setDescription('Wybierz sekcję do wyświetlenia')
        .setRequired(false)
        .addChoices(
          { name: '🏠 Strona główna',  value: 'home'        },
          { name: '📜 Regulamin',      value: 'regulamin'   },
          { name: '🚛 O nas',          value: 'about'       },
          { name: '📝 Rekrutacja',     value: 'recruitment' },
          { name: '🏅 System rang',    value: 'ranks'       },
          { name: '🔗 Linki',          value: 'links'       },
        )
    ),

  async execute(interaction) {
    const startPage = interaction.options.getString('sekcja') ?? 'home'
    let   current   = startPage

    const message = await interaction.reply({
      embeds:     [PAGES[current]()],
      components: [buildMenu(current)],
      fetchReply: true,
    })

    // ── Kolektor menu ─────────────────────
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time:          300_000, // 5 minut
    })

    collector.on('collect', async (menuInteraction) => {
      current = menuInteraction.values[0]

      await menuInteraction.update({
        embeds:     [PAGES[current]()],
        components: [buildMenu(current)],
      })
    })

    collector.on('end', async () => {
      // Wyłącz menu po timeout
      const disabledMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('info_menu_disabled')
          .setPlaceholder('⏰  Sesja wygasła — użyj /info ponownie')
          .setDisabled(true)
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('Wygasło')
              .setValue('expired')
          )
      )

      await interaction.editReply({ components: [disabledMenu] }).catch(() => {})
    })
  },
}
