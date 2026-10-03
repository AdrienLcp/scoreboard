import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

/** The reference dictionary: its keys are the type every other locale is checked against. */
export const FR_DICTIONARY = defineDictionary({
  app: {
    name: 'Scoreboard'
  },
  connection: {
    closed: 'Reconnexion…',
    connecting: 'Connexion…',
    open: 'En direct',
    refused: 'Déconnecté'
  },
  display: {
    around: defineTranslation('≈ {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    clock: defineTranslation('{at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    date: defineTranslation('{at:date}', {
      date: { at: { dateStyle: 'full' } }
    }),
    encounters: 'Rencontres par équipes',
    finishedAt: defineTranslation('Fini à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    follow: 'Suivez les matchs sur votre téléphone',
    freeTables: 'Tables libres · prochain match',
    live: 'Matchs en cours',
    next: 'À suivre',
    noFreeTables: 'Aucune',
    noLive: 'Aucun match en cours pour le moment',
    noResults: 'Aucun match terminé',
    nothingNext: 'rien de prévu',
    page: 'Tables {first:number}–{last:number} · {index:number}/{count:number}',
    qrLabel: 'QR code vers la page des matchs',
    resultDetail: defineTranslation('contre {loser} · fini à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    results: 'Résultats',
    summary: 'Résumé de la journée',
    tableRun: 'tables {first:number} à {last:number}',
    tileLabel: 'Table {table:number}, {home} contre {away}, {score}',
    title: 'Grand écran',
    unknown: 'Cet écran n’existe pas pour cette rencontre.',
    waiting: {
      encounters: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} rencontre par équipes',
            other: '{?} rencontres par équipes'
          }
        }
      }),
      firstAt: defineTranslation('Premiers matchs à <lit>{at:date}</lit>', {
        date: { at: { timeStyle: 'short' } }
      }),
      lead: 'La journée commence bientôt',
      soon: 'Premiers matchs dans un instant',
      tables: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} table', other: '{?} tables' } }
      })
    }
  },
  encounter: {
    format: {
      'fftt-3-players-10-games': 'FFTT · 3 joueurs, 10 parties',
      'fftt-4-players-14-games': 'FFTT · 4 joueurs, 14 parties'
    },
    noTable: 'tables à définir',
    tables: defineTranslation('{count:plural} {tables:list}', {
      plural: { count: { one: 'table', other: 'tables' } }
    }),
    versus: 'contre'
  },
  error: {
    api: {
      network: 'Impossible de joindre le serveur. Vérifiez la connexion.',
      refused: 'Le serveur a refusé la demande.'
    },
    event_not_found: 'Cette rencontre n’existe pas.',
    hello_expected: 'La connexion a été mal ouverte. Rechargez la page.',
    internal_error: 'Une erreur est survenue sur le serveur.',
    invalid_message: 'Le serveur n’a pas compris la demande.',
    invalid_setup: 'Cette préparation a été refusée.',
    not_allowed: 'Cet écran ne peut pas faire ça.',
    protocol_version_mismatch: 'Cette page n’est plus à jour. Rechargez-la.',
    screen: {
      home: 'Retour à l’accueil',
      title: 'Quelque chose s’est mal passé'
    },
    wrong_code: 'Ce code ne correspond à aucune table.'
  },
  home: {
    bestOf: 'Format des matchs',
    bestOfOption: 'Au meilleur des {count:number} manches',
    create: 'Créer la rencontre',
    name: 'Nom de la rencontre',
    tableCount: 'Nombre de tables',
    title: 'Nouvelle rencontre'
  },
  match: {
    call: {
      deuce: 'Égalité',
      'game-point': 'Balle de manche',
      'match-point': 'Balle de match',
      over: 'Terminé'
    },
    concession: {
      retirement: 'Abandon',
      walkover: 'Forfait'
    },
    gamesWon: 'manches ',
    serving: 'au service',
    status: {
      finished: 'Terminé',
      live: 'En cours',
      scheduled: 'À venir'
    },
    unnamedSide: 'À désigner',
    winner: 'vainqueur'
  },
  notFound: {
    address: 'Aucune page à l’adresse {path}.',
    home: 'Retour à l’accueil',
    title: 'Page introuvable'
  },
  organiser: {
    access: {
      display: 'Ouvrir le grand écran',
      title: 'Accès des tables',
      umpireEntry: 'Entrée des arbitres'
    },
    code: {
      label: 'Code organisateur',
      submit: 'Ouvrir'
    },
    correction: {
      invalid: 'Écrivez les manches ainsi : 11-7 6-4',
      label: 'Score, manche par manche',
      submit: 'Corriger',
      undo: 'Annuler la dernière action',
      walkover: {
        away: 'Forfait de l’extérieur',
        home: 'Forfait du domicile'
      }
    },
    displays: {
      add: 'Ajouter l’écran',
      first: 'Première table',
      last: 'Dernière table',
      name: 'Nom de l’écran',
      remove: 'Retirer {name}',
      tables: 'tables {tables:list}',
      title: 'Écrans'
    },
    encounter: {
      add: 'Créer la rencontre par équipes',
      away: 'Équipe extérieure',
      format: 'Feuille de rencontre',
      home: 'Équipe à domicile',
      title: 'Rencontre par équipes'
    },
    matches: {
      add: 'Ajouter le match',
      away: 'Joueur extérieur',
      home: 'Joueur à domicile',
      noTable: 'Sans table',
      plannedAt: 'Heure prévue',
      plannedAtSave: 'Fixer l’heure',
      remove: 'Retirer le match',
      table: 'Table',
      title: 'Matchs'
    },
    players: {
      add: 'Ajouter le joueur',
      name: 'Nom du joueur',
      remove: 'Retirer {name}',
      team: 'Équipe',
      title: 'Joueurs et équipes'
    },
    save: 'Enregistrer',
    settings: {
      club: 'Nom du club',
      name: 'Nom de la rencontre',
      startsAt: 'Début de la rencontre',
      tableCount: 'Nombre de tables',
      title: 'Rencontre'
    },
    teams: {
      add: 'Ajouter l’équipe',
      name: 'Nom de l’équipe'
    },
    title: 'Organisation'
  },
  record: {
    refused: {
      already_started: 'Ce match a déjà commencé.',
      cannot_end: 'Ce match se termine au score.',
      invalid_score: 'Ce score est impossible.',
      match_not_found: 'Ce match n’existe plus.',
      match_not_on_table: 'Ce match n’est pas sur votre table.',
      match_over: 'Ce match est terminé.',
      not_started: 'Ce match n’a pas encore commencé.',
      nothing_to_undo: 'Rien à annuler.'
    }
  },
  setup: {
    refused: {
      duplicate_id: 'Un élément apparaît deux fois.',
      player_twice_in_match: 'Un joueur est des deux côtés d’un match.',
      table_out_of_range: 'Un match est sur une table qui n’existe pas.',
      unknown_display_table: 'Un écran affiche une table qui n’existe pas.',
      unknown_encounter: 'Un match renvoie à une rencontre inconnue.',
      unknown_player: 'Un match renvoie à un joueur inconnu.',
      unknown_team: 'Un joueur renvoie à une équipe inconnue.'
    }
  },
  spectator: {
    empty: {
      finished: 'Aucun match terminé.',
      live: 'Aucun match en cours.',
      upcoming: 'Aucun match à venir.'
    },
    section: {
      finished: 'Terminés',
      live: 'En cours',
      upcoming: 'À venir'
    },
    title: 'Programme'
  },
  table: {
    free: 'Aucun match',
    name: 'Table {number:number}',
    prefix: 'Table '
  },
  time: {
    hoursMinutes: '{hours:number} h {minutes}',
    minutes: '{minutes:number} min',
    underAMinute: '< 1 min'
  },
  timing: {
    duration: 'Durée : {minutes:number} min',
    estimated: defineTranslation('Début estimé vers {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    finished: defineTranslation('Terminé à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    planned: defineTranslation('Prévu à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    started: defineTranslation('Commencé à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    })
  },
  umpire: {
    entry: {
      code: 'Code de la table',
      invalid: 'Six caractères, sans 0, 1, I ni O.',
      submit: 'Arbitrer',
      title: 'Arbitrer une table'
    },
    firstServer: 'Qui sert en premier ?',
    games: 'Manches : {home:number} – {away:number}',
    pending: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} point en attente d’envoi',
          other: '{?} points en attente d’envoi'
        }
      }
    }),
    point: 'Point pour {name}',
    retire: 'Abandon de {name}',
    serving: 'Service : {name}',
    title: 'Arbitrage',
    undo: 'Annuler le dernier point'
  }
})
