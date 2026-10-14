import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

const DAYS_PLURAL = {
  plural: { days: { one: '{?} jour', other: '{?} jours' } }
} as const

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
      soon: 'Premiers matchs dans un instant',
      tables: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} table', other: '{?} tables' } }
      })
    }
  },
  encounter: {
    format: {
      'fftt-3-players-10-games': '3 joueurs, 10 matchs',
      'fftt-4-players-14-games': '4 joueurs, 14 matchs'
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
  home: {
    bestOf: 'Manches à gagner',
    bestOfHelp:
      'Chaque manche se joue en {points:number} points. Le premier à remporter ce nombre de manches gagne le match.',
    bestOfOption: '{toWin:number} manches gagnantes',
    bestOfOptionDetail: 'au meilleur des {count:number}',
    create: 'Créer la rencontre',
    createNote:
      'Vous recevrez un code organisateur : il ouvre la préparation et les corrections.',
    creating: 'Création…',
    headline: 'Chaque match en direct, sur grand écran et dans la poche.',
    join: {
      code: 'Code de la rencontre',
      follow: 'Suivre les matchs',
      hint: 'Les dix caractères après /e/ dans le lien, ou le lien entier.',
      invalid: 'Ce code ne correspond à aucune rencontre : vérifiez le lien.',
      title: 'Rejoindre une rencontre',
      umpire: 'Arbitrer une table'
    },
    lead: 'Les arbitres comptent les points depuis leur téléphone, la salle lit les scores de loin, et l’organisateur garde la main sur toute la journée.',
    name: 'Nom de la rencontre',
    namePlaceholder: 'Tournoi interne d’automne',
    shareImageAlt:
      'Le logo Scoreboard à côté de son nom, en blanc sur fond nuit.',
    tableCount: 'Nombre de tables',
    title: 'Nouvelle rencontre'
  },
  legal: {
    device: {
      analyticsOptOut:
        'Votre refus de la mesure d’audience, si vous la désactivez plus bas.',
      body: 'Scoreboard ne dépose aucun cookie. Ce qu’il retient reste dans votre navigateur, pour ce seul site, jusqu’à ce que vous l’effaciez :',
      eventPart: 'rencontre',
      followed: 'Les joueurs que vous suivez dans la vue spectateur.',
      heading: 'Ce que votre navigateur garde',
      organiser:
        'Le code organisateur d’une rencontre, pour rouvrir son organisation sans le retaper. Il est oublié dès que la rencontre est effacée.',
      outbox:
        'Les points marqués par un arbitre que le serveur n’a pas encore confirmés, pour n’en perdre aucun quand le réseau tombe.',
      outboxPart: 'rencontre:code'
    },
    event: {
      body: 'Chaque rencontre garde sur le serveur ce que son organisateur y saisit : son nom, celui du club, les noms des joueurs et des équipes, le programme, ainsi que chaque point marqué et son heure.',
      deletion:
        'Son organisateur peut aussi l’effacer tout de suite, depuis l’onglet Réglages de l’organisation.',
      heading: 'Ce que le serveur garde d’une rencontre',
      logs: defineTranslation(
        'Pour diagnostiquer les pannes, l’hébergeur journalise chaque requête : son adresse, son heure et l’adresse IP d’où elle vient. Ces journaux ne contiennent aucun nom et sont effacés au bout de {days:plural}.',
        DAYS_PLURAL
      ),
      retention: defineTranslation(
        'Une rencontre est effacée en entier, automatiquement, {days:plural} après sa dernière modification.',
        DAYS_PLURAL
      ),
      yourName:
        'Votre nom figure dans une rencontre et vous voulez qu’il disparaisse ? Demandez-le à son organisateur, ou écrivez-moi depuis <contact>ma page de contact</contact> : je l’efface sous un mois.'
    },
    host: {
      body: 'Le site et ses données sont hébergés par :',
      heading: 'Hébergeur'
    },
    intro:
      'Qui édite Scoreboard, ce qu’il garde d’une rencontre et pour combien de temps, et comment l’effacer.',
    measurement: {
      body: 'Les visites sont comptées par un outil que j’ai construit, sans cookie. Une page vue enregistre l’adresse de la page, le site d’où vous venez, la langue et le thème de votre navigateur, la largeur de sa fenêtre et la vitesse d’affichage de la page. Elle n’enregistre ni adresse IP, ni rien qui distingue un visiteur d’un autre.',
      counted: 'Vos visites sont comptées, anonymement.',
      exemption:
        'Cette mesure est dispensée de consentement selon les lignes directrices de la CNIL, et vous pouvez tout de même la refuser pour ce navigateur.',
      heading: 'Mesure d’audience',
      refused: 'Vos visites ne sont pas comptées dans ce navigateur.',
      refusedByBrowser:
        'Votre navigateur envoie le signal Global Privacy Control : vos visites ne sont jamais comptées.',
      retention: defineTranslation(
        'Chaque enregistrement est conservé {months:plural} au plus.',
        { plural: { months: { one: '{?} mois', other: '{?} mois' } } }
      ),
      saveFailed:
        'Votre navigateur n’a pas conservé ce choix. Réessayez, ou activez Global Privacy Control.',
      storageBlocked:
        'Ce navigateur bloque le stockage des sites : un refus ne peut pas y être conservé. Activer Global Privacy Control dans votre navigateur refuse la mesure sur tous les sites.',
      switch: 'Compter mes visites'
    },
    publisher: {
      address:
        'Éditeur non professionnel, je donne l’identité de l’hébergeur à la place d’une adresse postale (LCEN, article 6-III-2).',
      body: 'Scoreboard est édité par {name}, à titre de particulier et non de professionnel. Vous pouvez m’écrire depuis <contact>ma page de contact</contact>.',
      heading: 'Éditeur'
    },
    rights: {
      body: 'Le RGPD vous permet d’accéder à ce qui vous concerne, de le rectifier ou de l’effacer, et de vous opposer à son utilisation. Demandez-le depuis <contact>ma page de contact</contact> ; je réponds sous un mois.',
      complaint:
        'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la <authority>CNIL</authority>.',
      heading: 'Vos droits'
    },
    thirdParties: {
      body: 'Votre navigateur ne communique qu’avec ce site et avec l’outil de mesure d’audience, analytics.adrienlcp.com, que j’héberge aussi chez Cloudflare. Cloudflare reçoit votre adresse IP à chaque requête, pour servir la page et protéger le site des abus. Les polices et les QR codes sont servis par le site lui-même.',
      heading: 'Qui d’autre reçoit vos données'
    },
    title: 'Mentions légales et confidentialité'
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
      copied: 'Lien copié',
      copy: 'Copier le lien',
      display: 'Grand écran',
      explain:
        'Chaque arbitre scanne le QR code de sa table, ou tape son code sur',
      openConsole: 'Ouvrir la console',
      qrLabel: 'QR code de la console d’arbitrage de la table {table:number}',
      spectator: 'Page des spectateurs',
      title: 'Codes des tables'
    },
    choosePlayer: 'Choisir un joueur',
    chooseTeam: 'Choisir une équipe',
    code: {
      explain:
        'Il vous a été donné à la création de la rencontre. Il ouvre la préparation et les corrections.',
      label: 'Code organisateur',
      submit: 'Ouvrir l’organisation',
      title: 'Organiser cette rencontre',
      yours:
        'Votre code organisateur, à garder pour ouvrir cette page ailleurs :'
    },
    correction: {
      hint: 'Les manches dans l’ordre, la dernière peut être en cours.',
      invalid: 'Écrivez les manches ainsi : 11-7 6-4',
      label: 'Score, manche par manche',
      open: 'Corriger',
      submit: 'Enregistrer le score',
      undo: 'Annuler la dernière action',
      walkover: {
        away: 'Forfait de l’extérieur',
        home: 'Forfait du domicile'
      },
      walkoverConfirm: {
        away: 'Confirmer le forfait de l’extérieur',
        home: 'Confirmer le forfait du domicile'
      },
      walkoverExplain:
        'Ce match n’a pas commencé. Un joueur absent ou blessé peut être déclaré forfait.'
    },
    deletion: {
      confirm: 'Effacer la rencontre définitivement',
      explain: defineTranslation(
        'La rencontre, ses joueurs et ses scores sont effacés automatiquement {days:plural} après la dernière modification. Vous pouvez l’effacer dès maintenant : les écrans, les arbitres et les spectateurs la perdent aussitôt, et rien ne pourra être récupéré.',
        DAYS_PLURAL
      ),
      label: 'Effacer la rencontre',
      title: 'Effacement de la rencontre'
    },
    displays: {
      add: 'Ajouter l’écran',
      addTitle: 'Nouvel écran',
      all: 'Écran principal',
      allTables: 'toutes les tables',
      explain:
        'Un écran montre les tables de la première à la dernière. Ouvrez son lien sur l’ordinateur branché au téléviseur.',
      first: 'Première table',
      last: 'Dernière table',
      name: 'Nom de l’écran',
      namePlaceholder: 'Salle B',
      open: 'Ouvrir',
      remove: 'Retirer {name}',
      title: 'Écrans'
    },
    encounter: {
      add: 'Créer la rencontre par équipes',
      away: 'Équipe extérieure',
      empty:
        'Aucune rencontre par équipes. Créez d’abord les équipes et leurs joueurs.',
      format: 'Type de rencontre',
      formatHelp:
        'Le type de rencontre fixe le nombre de joueurs par équipe et l’ordre des matchs, comme la feuille officielle FFTT.',
      home: 'Équipe à domicile'
    },
    keep: 'Garder',
    live: {
      free: 'Libre, rien de prévu'
    },
    matches: {
      add: 'Ajouter le match',
      addTitle: 'Nouveau match',
      away: 'Joueur extérieur',
      empty: 'Aucun match. Ajoutez des joueurs, puis leurs matchs.',
      home: 'Joueur à domicile',
      noTable: 'Sans table',
      plannedAt: 'Heure prévue',
      plannedAtSave: 'Enregistrer',
      remove: 'Retirer',
      removeConfirm: 'Retirer ce match',
      table: 'Table'
    },
    players: {
      add: 'Ajouter le joueur',
      count: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} joueur', other: '{?} joueurs' } }
      }),
      empty: 'Aucun joueur pour l’instant.',
      name: 'Nom du joueur',
      noTeam: 'Sans équipe',
      remove: 'Retirer {name}',
      team: 'Équipe'
    },
    remove: 'Retirer',
    save: 'Enregistrer',
    settings: {
      club: 'Nom du club',
      name: 'Nom de la rencontre',
      startsAt: 'Début de la rencontre',
      startsAtHelp:
        'Sert à annoncer l’heure des premiers matchs et à estimer celle des suivants.',
      tableCount: 'Nombre de tables'
    },
    summary: '{tables:number} tables · {matches:number} matchs',
    tabs: {
      encounters: 'Équipes',
      live: 'En direct',
      matches: 'Programme',
      players: 'Joueurs',
      settings: 'Réglages',
      tables: 'Tables et écrans'
    },
    teams: {
      add: 'Ajouter l’équipe',
      count: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} équipe', other: '{?} équipes' } }
      }),
      empty: 'Aucune équipe : utile seulement pour les rencontres par équipes.',
      members: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} joueur', other: '{?} joueurs' } }
      }),
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
  shell: {
    footer: {
      legal: 'Mentions légales et confidentialité'
    }
  },
  spectator: {
    empty: {
      finished: 'Aucun match terminé pour l’instant.',
      live: 'Aucun match en cours. Les prochains sont dans « À venir ».',
      upcoming: 'Rien d’annoncé pour l’instant.'
    },
    finishedAt: defineTranslation('fini à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    follow: 'Suivre {name}',
    following: 'Suivi : {name}',
    followPlayer: 'Suivre un joueur',
    game: 'Manche',
    gameByGame: 'Score manche par manche',
    noPlayerMatches: 'Aucun joueur ne correspond à « {typed} »',
    noTable: 'table à définir',
    noTime: 'heure à venir',
    others: 'Les autres',
    playedFromTo: defineTranslation('De {from:date} à {to:date}', {
      date: { from: { timeStyle: 'short' }, to: { timeStyle: 'short' } }
    }),
    section: {
      finished: 'Résultats',
      live: 'En cours',
      upcoming: 'À venir'
    },
    tablesInPlay: 'Tables en jeu',
    title: 'Matchs',
    unfollow: 'Ne plus suivre {name}',
    walkoverAt: defineTranslation('forfait, {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    whereLive: 'Table {table:number} · en cours',
    whereUnplaced: 'Pas encore dans un match',
    yourPlayers: 'Vos joueurs'
  },
  table: {
    free: 'Aucun match',
    name: 'Table {number:number}',
    prefix: 'Table '
  },
  time: {
    hoursMinutes: '{hours:number} h {minutes}',
    minutes: '{minutes:number} min',
    now: 'maintenant',
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
    connection: {
      offline: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Hors ligne — {?} point en attente',
            other: 'Hors ligne — {?} points en attente'
          }
        }
      }),
      online: 'Connecté',
      sending: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Envoi de {?} point…',
            other: 'Envoi de {?} points…'
          }
        }
      })
    },
    deuce: 'Égalité — deux points d’écart',
    encounter: 'Rencontre',
    end: {
      cancel: 'Revenir au match',
      confirm: 'Confirmer : {name} gagne',
      explain:
        'Le match s’arrête ici et l’adversaire est déclaré vainqueur. L’organisateur pourra corriger.',
      open: 'Fin du match / abandon…',
      pick: 'Choisir le joueur',
      reason: {
        retirement: 'Abandon en cours de match',
        walkover: 'Forfait'
      },
      section: 'Fin de match',
      title: 'Fin du match / abandon',
      who: 'Qui s’arrête ?',
      why: 'Motif'
    },
    entry: {
      code: 'Code de la table',
      hint: 'Il est affiché sur la table, sous le QR code : six lettres ou chiffres.',
      invalid: 'Ce code fait six caractères, sans 0, 1, I ni O.',
      missing: 'Saisissez le code inscrit sur la table.',
      placeholder: 'A7K2PQ',
      submit: 'Ouvrir le match',
      title: 'Arbitrer une table'
    },
    finished: 'Match terminé — {name} gagne {games}',
    gameOn: 'Manche {number:number} en cours',
    gameShort: 'M{number:number}',
    gamesWon: 'Manches',
    idle: {
      explain:
        'Le prochain match apparaîtra ici dès que l’organisateur l’aura placé sur cette table.',
      title: 'Aucun match sur cette table pour l’instant'
    },
    keys: {
      backspace: 'Retour',
      points: 'point à gauche ou à droite',
      title: 'Clavier',
      undo: 'annuler'
    },
    matchOver: 'fin',
    noPoints: 'Aucun point marqué depuis l’ouverture.',
    point: 'Point pour {name}, {score:number} actuellement',
    pointFor: 'Point {name}',
    recent: 'Derniers points',
    serve: 'Service',
    serveTurn: {
      first: '1er service',
      lone: 'Service unique',
      second: '2e service'
    },
    start: {
      last: 'Match précédent : {winner} bat {loser} {games}',
      title: 'Qui sert en premier ?'
    },
    startedAt: defineTranslation('Commencé à {at:date} · {elapsed} de jeu', {
      date: { at: { timeStyle: 'short' } }
    }),
    swap: 'Changer de côté',
    title: 'Arbitrage',
    undo: 'Annuler le dernier point'
  }
})
