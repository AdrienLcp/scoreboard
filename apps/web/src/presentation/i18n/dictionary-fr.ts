import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const DAYS_PLURAL = {
  plural: { days: { one: '{?} jour', other: '{?} jours' } }
} as const

/** The reference dictionary: its keys are the type every other locale is checked against. */
export const FR_DICTIONARY = defineDictionary({
  app: {
    name: 'Scoreboard'
  },
  club: {
    loading: 'Ouverture du club…',
    offline: 'Le serveur ne répond pas. Vérifiez la connexion puis réessayez.'
  },
  connection: {
    closed: 'Reconnexion…',
    connecting: 'Connexion…',
    open: 'En direct',
    refused: 'Déconnecté'
  },
  demo: {
    create: 'Créer mon club',
    event: 'Démo · championnat par équipes, 4ᵉ journée',
    title: 'Démo',
    turn: 'Tournez le téléphone pour voir la télé en grand.',
    what: 'Démo : une salle fictive, les scores tournent tout seuls'
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
    pairAgain: 'Brancher cet écran sur une autre rencontre',
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
      soon: 'Premiers matchs dans un instant',
      tables: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} table', other: '{?} tables' } }
      })
    },
    wall: {
      card: 'Carton jaune',
      cardPenalty: 'Carton jaune et rouge',
      decider: 'Belle',
      deuce: 'Égalité',
      doubles: 'Double',
      finalPhase: 'Phase finale',
      follow: 'Tous les matchs sur votre téléphone',
      free: 'Table libre',
      gamesWon: '{count:number} manches gagnées',
      gameWon: 'Manche gagnée',
      matchWon: 'Match gagné {score}',
      next: 'Prochain match {call}',
      nextPlayers: '<b>{home}</b> contre <b>{away}</b>',
      pool: 'Poule {name}',
      poolComplete: 'Terminée',
      poolPoints: '{points:number} points de poule',
      scanOrType: 'Scannez, ou tapez le code',
      serving: 'Au service',
      timeout: 'Temps mort pris',
      timeoutLeft: 'Temps mort, {seconds:number} secondes',
      timeoutRunning: 'Temps mort en cours',
      umpire: 'Arbitre : <b>{name}</b>',
      waiting: 'En attente'
    }
  },
  encounter: {
    format: {
      'fftt-3-players-10-games': '3 joueurs, 10 matchs',
      'fftt-4-players-14-games': '4 joueurs, 14 matchs',
      'fftt-6-players-20-games': '6 joueurs, 20 matchs sur 2 tables'
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
    event_deleted: 'Cette rencontre a été effacée.',
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
  guide: {
    back: 'Accueil',
    create: 'Créer mon club',
    demo: 'Voir la démo',
    lead: 'Les arbitres comptent les points sur leur téléphone, et la télé de la salle affiche tous les scores en direct. Personne ne tape de code : les QR codes s’en chargent.',
    print: 'Imprimer',
    steps: {
      club: {
        aside:
          'Sur un deuxième appareil : <b>Mon club</b>, puis « Ouvrir sur un autre appareil », et scannez le QR code qu’il affiche.',
        body: 'Sur votre téléphone, tapez le nom du club sur l’accueil, puis <b>Continuer</b>. Dans <b>Mon club</b>, reliez-le à son numéro FFTT : les poules et les licenciés arrivent tout seuls.',
        title: 'Votre club, une fois pour toutes'
      },
      day: {
        aside:
          'Un amical, un tournoi interne, un Top 12 : <b>Nouvel événement</b>. Tout se change pendant les matchs.',
        body: 'L’accueil montre la journée de championnat. <b>Préparer la journée</b> pose chaque rencontre à domicile sur ses deux tables, avec la dernière composition de chaque équipe.',
        title: 'Le jour du match'
      },
      room: {
        aside:
          'Rien à installer, aucun compte. Un point de trop s’annule d’un toucher.',
        body: 'Imprimez les QR codes des tables (étape <b>Salle</b>) et posez-en un sur chaque table. L’arbitre scanne celui de sa table et compte les points ; le public scanne celui de la télé pour suivre les matchs.',
        title: 'Les arbitres et le public'
      },
      screen: {
        body: 'Sur l’ordinateur branché à la télé, ouvrez {site} et choisissez <b>Afficher l’écran de la salle</b>. Sur votre téléphone, dans la journée, touchez <b>Grand écran</b> et scannez le QR code de la télé.',
        title: 'La télé de la salle'
      }
    },
    title: 'Comment ça marche'
  },
  home: {
    create: 'Créer',
    display: 'Grand écran',
    events: {
      empty: 'Aucun événement ouvert sur cet appareil.',
      name: 'Nom de l’événement',
      namePlaceholder: 'Tournoi de Noël',
      newEvent: 'Nouvel événement',
      note: 'Le plan « {plan} », 3 manches gagnantes : tout se change ensuite.',
      title: 'Vos événements'
    },
    firstRun: {
      code: 'Code du club',
      create: 'Continuer',
      join: 'Ouvrir le club',
      joinHelp:
        'Sur l’appareil où le club est déjà ouvert : « Mon club », puis « Ouvrir sur un autre appareil ». Scannez son QR code avec l’appareil photo, ou tapez son code ici.',
      joinTitle: 'Ouvrez-le avec son code',
      known: 'Le club est déjà ouvert sur un autre appareil ?',
      name: 'Pour commencer, le nom de votre club',
      nameMissing: 'Tapez le nom de votre club pour commencer.'
    },
    free: {
      pools:
        'Les journées du championnat s’affichent ici dès que les poules sont recopiées dans <link>Mon club</link>.',
      poolsDone:
        'Plus aucune journée à venir dans les poules de <link>Mon club</link> : la prochaine phase s’y recopie.',
      summary:
        'Une rencontre amicale, un tournoi interne, un Top 12 : donnez-lui un nom, le reste est déjà prêt.',
      title: 'Votre prochain événement'
    },
    guide: 'Comment ça marche',
    headline: 'Les scores de votre club, en direct sur grand écran',
    join: {
      code: 'Code de la rencontre',
      follow: 'Suivre les matchs',
      hint: 'Il s’affiche sur la télé de la salle, sous son QR code.',
      invalid: 'Ce code ne correspond à aucune rencontre : vérifiez le lien.',
      open: 'Pas de QR code ? Tapez le code',
      scan: 'Scannez avec l’appareil photo de votre téléphone le QR code collé sur la table, ou celui de la télé de la salle.',
      title: 'Vous arbitrez ou vous regardez les matchs',
      umpire: 'Arbitrer une table'
    },
    lead: 'Les arbitres comptent les points depuis leur téléphone, la salle lit les scores de loin, et l’organisateur garde la main sur toute la journée.',
    round: {
      away: 'À l’extérieur : {fixtures}',
      awayAt: '{team} à {host}',
      awayOpen: '{team}, adversaire à choisir',
      done: 'Toutes les rencontres sont jouées.',
      noTables: 'Sans table',
      prepare: 'Préparer la journée',
      prepareNote:
        'Le plan « {plan} » et les dernières compositions sont déjà remplis.',
      progress: defineTranslation('{finished:plural} sur {total}.', {
        plural: {
          finished: {
            one: '{?} rencontre terminée',
            other: '{?} rencontres terminées'
          }
        }
      }),
      ready: 'Les rencontres sont en place, avec les dernières compositions.',
      receives: 'reçoit',
      resume: 'Reprendre la journée',
      summaryAway: 'Toutes nos équipes jouent à l’extérieur.',
      summaryHome: defineTranslation('{count:plural}, sur {tables:plural}.', {
        plural: {
          count: {
            one: '{?} rencontre à la maison',
            other: '{?} rencontres à la maison'
          },
          tables: { one: '{?} table', other: '{?} tables' }
        }
      }),
      summaryMixed: 'Championnat par équipes.',
      summaryPhase: 'Championnat par équipes, phase {phase}.',
      title: defineTranslation('Journée {number}, {at:date}', {
        date: { at: { day: 'numeric', month: 'long', weekday: 'long' } }
      }),
      titleNoDate: 'Journée {number}',
      titleOn: defineTranslation('Championnat du {at:date}', {
        date: { at: { day: 'numeric', month: 'long', weekday: 'long' } }
      }),
      titleOpen: 'Prochaines rencontres du championnat'
    },
    screen: {
      hint: 'Il affichera un code : tapez-le sur votre téléphone, dans la journée, bouton « Grand écran ».',
      open: 'Afficher l’écran de la salle',
      title: 'Cet ordinateur est branché sur la télé de la salle'
    },
    season: {
      code: 'Code du club <b>{code}</b> : il ouvre le club sur un autre appareil.',
      directory: 'Annuaire',
      directoryDetail: 'Joueurs, équipes et clubs déjà rencontrés',
      pools: 'Poules et classements',
      poolsDetail: defineTranslation('Phase {phase} · {count:plural}', {
        plural: { count: { one: '{?} poule', other: '{?} poules' } }
      }),
      poolsEmpty: 'À recopier du calendrier de la fédération',
      poolsRank: defineTranslation(
        'Phase {phase} · {team}, {rank:plural} de sa poule',
        { plural: { rank: { one: '{?}ʳᵉ', other: '{?}ᵉ' } } }
      ),
      teams: 'Équipes',
      teamsEmpty: 'Aucune équipe pour l’instant',
      title: 'La saison du club'
    },
    shareImageAlt:
      'Le logo Scoreboard à côté de son nom, en blanc sur fond nuit.',
    showcase: {
      live: 'Démo en direct, salle fictive',
      open: 'Voir en grand',
      title: 'La télé d’une salle fictive, en direct'
    }
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
    gamesToWin: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} manche gagnante',
          other: '{?} manches gagnantes'
        }
      }
    }),
    gamesWon: 'manches ',
    serving: 'au service',
    status: {
      finished: 'Terminé',
      live: 'En cours',
      scheduled: 'À venir'
    },
    umpire: 'Arbitre : {name}',
    unnamedSide: 'À désigner',
    winner: 'vainqueur'
  },
  notFound: {
    address: 'Aucune page à l’adresse {path}.',
    home: 'Retour à l’accueil',
    title: 'Page introuvable'
  },
  record: {
    refused: {
      already_started: 'Ce match a déjà commencé.',
      awaiting_confirmation: 'Validez d’abord la manche gagnée.',
      cannot_end: 'Ce match se termine au score.',
      card_not_found: 'Ce carton a déjà été retiré.',
      invalid_score: 'Ce score est impossible.',
      match_not_found: 'Ce match n’existe plus.',
      match_not_on_table: 'Ce match n’est pas sur votre table.',
      match_over: 'Ce match est terminé.',
      no_timeout_to_withdraw: 'Ce temps mort a déjà été retiré.',
      not_started: 'Ce match n’a pas encore commencé.',
      nothing_to_confirm: 'Aucune manche à valider.',
      nothing_to_undo: 'Rien à annuler.',
      timeout_already_taken: 'Ce joueur a déjà pris son temps mort.'
    }
  },
  setup: {
    refused: {
      duplicate_id: 'Un élément apparaît deux fois.',
      player_twice_in_match: 'Un joueur est des deux côtés d’un match.',
      started_match_format_changed:
        'Un match commencé garde son nombre de manches.',
      table_out_of_range: 'Un match est sur une table qui n’existe pas.',
      tournament_inconsistent:
        'Les poules et les matchs du tournoi ne correspondent plus.',
      unknown_display_table: 'Un écran affiche une table qui n’existe pas.',
      unknown_encounter: 'Un match renvoie à une rencontre inconnue.',
      unknown_player: 'Un match renvoie à un joueur inconnu.',
      unknown_team: 'Un joueur renvoie à une équipe inconnue.'
    }
  },
  shell: {
    footer: {
      credit: 'Réalisé par <author>{name}</author>',
      legal: 'Mentions légales et confidentialité',
      source: 'Code source'
    }
  },
  table: {
    free: 'Aucun match',
    name: 'Table {number:number}',
    prefix: 'Table ',
    waiting: 'En attente d’une table'
  },
  time: {
    hoursMinutes: '{hours:number} h {minutes}',
    minutes: '{minutes:number} min',
    now: 'maintenant',
    underAMinute: '< 1 min'
  },
  timing: {
    duration: 'Durée\u00a0: {minutes:number} min',
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
  wall: {
    codeHint:
      'Tapez ce code dans l’organisation de la rencontre, bouton Grand écran',
    home: 'Retour à l’accueil',
    notTheTv: 'Ce n’est pas l’écran de la salle ?',
    offline: 'Pas de connexion. Nouvel essai dans un instant…',
    opening: 'Préparation du code…',
    qrLabel: 'QR code pour brancher cet écran',
    scanHint: 'Ou scannez-le avec le téléphone de l’organisateur',
    title: 'Cet écran attend sa rencontre'
  },
  wallPairing: {
    choose: 'Sur quelle rencontre brancher l’écran {code}\u00a0?',
    invalid: 'Ce lien ne contient pas de code d’écran valable.',
    none: {
      detail: 'Ce téléphone n’a créé aucune rencontre.',
      scan: 'Scannez l’écran avec le téléphone qui a créé la rencontre.',
      type: 'Ou, dans l’organisation de la rencontre, touchez Grand écran et tapez le code\u00a0:'
    },
    title: 'Brancher un écran'
  }
})
