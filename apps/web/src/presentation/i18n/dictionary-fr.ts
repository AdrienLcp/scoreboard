import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

const DAYS_PLURAL = {
  plural: { days: { one: '{?} jour', other: '{?} jours' } }
} as const

/** The reference dictionary: its keys are the type every other locale is checked against. */
export const FR_DICTIONARY = defineDictionary({
  app: {
    name: 'Scoreboard'
  },
  club: {
    code: 'Code du club',
    forget: 'Changer de club',
    hall: {
      empty:
        'Dessinez la salle dans l’onglet Plan d’une journée, puis touchez « Garder ce plan pour le club »\u00a0: chaque nouvelle journée partira de ce plan.',
      help: 'Chaque nouvelle journée part de ce plan. Pour le changer\u00a0: onglet Plan d’une journée, puis « Garder ce plan pour le club ».',
      title: 'Salle'
    },
    home: 'Accueil',
    loading: 'Ouverture du club…',
    logo: {
      add: 'Ajouter le logo de {name}',
      change: 'Changer le logo de {name}',
      notAnImage:
        'Ce fichier n’est pas une image. Choisissez une photo ou une image du logo.',
      refused: 'Le serveur a refusé cette image. Essayez-en une autre.',
      remove: 'Retirer le logo',
      sending: 'Envoi du logo…',
      title: 'Logo'
    },
    missing: 'Aucun club ne répond à ce code. Il a peut-être été effacé.',
    offline: 'Le serveur ne répond pas. Vérifiez la connexion puis réessayez.',
    opponents: {
      add: 'Ajouter le club',
      help: 'Chaque club rencontré une fois, avec ses équipes et ses joueurs, se choisit ensuite dans une liste.',
      name: 'Nom du club adverse',
      remove: 'Retirer ce club',
      summary: defineTranslation('{teams:plural} · {players:plural}', {
        plural: {
          players: { one: '{?} joueur', other: '{?} joueurs' },
          teams: { one: '{?} équipe', other: '{?} équipes' }
        }
      }),
      title: 'Clubs adverses'
    },
    players: {
      add: 'Ajouter le joueur',
      empty: 'Aucun joueur pour l’instant.',
      firstName: 'Prénom',
      lastName: 'Nom',
      points: 'Points',
      remove: 'Retirer',
      removeConfirm: 'Retirer {name}',
      title: 'Joueurs'
    },
    retry: 'Réessayer',
    share: {
      codeHint: 'Dans « Mon club », tapez ce code',
      open: 'Ouvrir sur un autre appareil',
      qrLabel: 'QR code qui ouvre le club',
      scanHint: 'Ou scannez pour ouvrir le club',
      warning:
        'Ce code ouvre et modifie le club\u00a0: ne le donnez qu’à ceux qui préparent les journées.'
    },
    team: {
      colour: 'Couleur',
      format: 'Type de rencontre',
      lineup: 'Dernière composition',
      matchPoints: {
        'one-per-win': '1 point par match gagné',
        'two-per-win': '2 points la victoire, 1 la défaite'
      },
      matchPointsLabel: 'Score de la rencontre',
      name: 'Nom de l’équipe',
      nobody: 'Personne',
      noPlayers: 'Ajoutez d’abord les joueurs du club.',
      remove: 'Retirer l’équipe',
      removeConfirm: 'Retirer {name}',
      tables: 'Tables à domicile',
      tablesChoice: defineTranslation('{count:plural} {tables:list}', {
        plural: { count: { one: 'Table', other: 'Tables' } }
      })
    },
    teams: {
      add: 'Ajouter une équipe',
      empty: 'Aucune équipe pour l’instant.',
      title: 'Équipes'
    },
    title: 'Le club',
    undo: 'Annuler',
    unsaved:
      'La dernière modification n’a pas atteint le serveur\u00a0: elle reste sur cet appareil.',
    welcome: {
      create: 'Ouvrir le club',
      createHelp:
        'Ses équipes, leurs couleurs et ses joueurs sont gardés une fois pour toutes\u00a0; chaque dimanche se prépare en les choisissant.',
      join: 'Ouvrir',
      joinHelp:
        'Sur l’appareil où le club est déjà ouvert\u00a0: « Mon club », puis « Ouvrir sur un autre appareil ». Scannez son QR code, ou tapez son code ici.',
      joinTitle: 'Le club est déjà ouvert ailleurs',
      name: 'Nom du club',
      namePlaceholder: 'PPC Angles',
      title: 'Votre club'
    }
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
  home: {
    bestOf: 'Manches à gagner',
    bestOfHelp:
      'Chaque manche se joue en {points:number} points. Le premier à remporter ce nombre de manches gagne le match.',
    bestOfOption: '{toWin:number} manches gagnantes',
    bestOfOptionDetail: 'au meilleur des {count:number}',
    club: 'Mon club',
    create: 'Créer la rencontre',
    createNote:
      'Vous recevrez un code organisateur\u00a0: il ouvre la préparation et les corrections.',
    creating: 'Création…',
    headline: 'Chaque match en direct, sur grand écran et dans la poche.',
    join: {
      code: 'Code de la rencontre',
      follow: 'Suivre les matchs',
      hint: 'Les dix caractères après /e/ dans le lien, ou le lien entier.',
      invalid:
        'Ce code ne correspond à aucune rencontre\u00a0: vérifiez le lien.',
      title: 'Rejoindre une rencontre',
      umpire: 'Arbitrer une table'
    },
    lead: 'Les arbitres comptent les points depuis leur téléphone, la salle lit les scores de loin, et l’organisateur garde la main sur toute la journée.',
    name: 'Nom de la rencontre',
    namePlaceholder: 'Tournoi interne d’automne',
    shareImageAlt:
      'Le logo Scoreboard à côté de son nom, en blanc sur fond nuit.',
    tableCount: 'Nombre de tables',
    tableCountFromClub: 'Comme la salle de {name}',
    title: 'Nouvelle rencontre'
  },
  legal: {
    device: {
      analyticsOptOut:
        'Votre refus de la mesure d’audience, si vous la désactivez plus bas.',
      body: 'Scoreboard ne dépose aucun cookie. Ce qu’il retient reste dans votre navigateur, pour ce seul site, jusqu’à ce que vous l’effaciez\u00a0:',
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
      body: 'Chaque rencontre garde sur le serveur ce que son organisateur y saisit\u00a0: son nom, celui du club, les noms des joueurs et des équipes, le programme, ainsi que chaque point marqué et son heure.',
      club: defineTranslation(
        'Les équipes, joueurs et clubs adverses qu’un club enregistre sont gardés tant qu’il s’en sert, et effacés {days:plural} après leur dernière modification.',
        DAYS_PLURAL
      ),
      deletion:
        'Son organisateur peut aussi l’effacer tout de suite, depuis l’onglet Réglages de l’organisation.',
      heading: 'Ce que le serveur garde d’une rencontre',
      logs: defineTranslation(
        'Pour diagnostiquer les pannes, l’hébergeur journalise chaque requête\u00a0: son adresse, son heure et l’adresse IP d’où elle vient. Ces journaux ne contiennent aucun nom et sont effacés au bout de {days:plural}.',
        DAYS_PLURAL
      ),
      retention: defineTranslation(
        'Une rencontre est effacée en entier, automatiquement, {days:plural} après sa dernière modification, ou après son début s’il est plus tard.',
        DAYS_PLURAL
      ),
      yourName:
        'Votre nom figure dans une rencontre et vous voulez qu’il disparaisse\u00a0? Demandez-le à son organisateur, ou écrivez-moi depuis <contact>ma page de contact</contact>\u00a0: je l’efface sous un mois.'
    },
    host: {
      body: 'Le site et ses données sont hébergés par\u00a0:',
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
        'Votre navigateur envoie le signal Global Privacy Control\u00a0: vos visites ne sont jamais comptées.',
      retention: defineTranslation(
        'Chaque enregistrement est conservé {months:plural} au plus.',
        { plural: { months: { one: '{?} mois', other: '{?} mois' } } }
      ),
      saveFailed:
        'Votre navigateur n’a pas conservé ce choix. Réessayez, ou activez Global Privacy Control.',
      storageBlocked:
        'Ce navigateur bloque le stockage des sites\u00a0: un refus ne peut pas y être conservé. Activer Global Privacy Control dans votre navigateur refuse la mesure sur tous les sites.',
      switch: 'Compter mes visites'
    },
    publisher: {
      address:
        'Éditeur non professionnel, je donne l’identité de l’hébergeur à la place d’une adresse postale (LCEN, article 6-III-2).',
      body: 'Scoreboard est édité par {name}, à titre de particulier et non de professionnel. Vous pouvez m’écrire depuis <contact>ma page de contact</contact>.',
      heading: 'Éditeur'
    },
    rights: {
      body: 'Le RGPD vous permet d’accéder à ce qui vous concerne, de le rectifier ou de l’effacer, et de vous opposer à son utilisation. Demandez-le depuis <contact>ma page de contact</contact>\u00a0; je réponds sous un mois.',
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
    umpire: 'Arbitre : {name}',
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
      codeHint: 'L’arbitre tape ce code',
      copied: 'Lien copié',
      copy: 'Copier le lien',
      display: 'Grand écran',
      explain:
        'Chaque arbitre scanne le QR code de sa table, ou tape son code sur',
      next: 'Table suivante',
      openConsole: 'Ouvrir la console',
      previous: 'Table précédente',
      print: 'Imprimer',
      qrLabel: 'QR code de la console d’arbitrage de la table {table:number}',
      scanHint: 'ou scanne ce QR code avec son téléphone',
      sheet: {
        scan: 'Arbitre\u00a0: scannez ce QR code avec votre téléphone',
        type: 'ou tapez ce code sur'
      },
      spectator: 'Page des spectateurs',
      table: 'Table {table:number}',
      tables: 'Tables',
      title: 'Codes des tables'
    },
    choosePlayer: 'Choisir un joueur',
    chooseTeam: 'Choisir une équipe',
    club: 'Mon club',
    clubEncounter: {
      absentHint:
        '{empty} vide : un joueur absent toute la journée se met en {later}.',
      absentMove: 'Décaler',
      add: 'Ajouter la rencontre',
      away: 'Adversaire',
      edit: 'Équipes du club',
      home: 'Notre équipe',
      keepLineup: 'Garder cette composition pour la prochaine rencontre',
      lineup: 'Composition',
      loading: 'Ouverture du club…',
      noClub:
        'Préparez une fois les équipes du club\u00a0: chaque rencontre se crée ensuite en deux choix.',
      noOpponent: 'Ajoutez un club adverse',
      noTables: 'Pas assez de tables libres',
      prepare: 'Préparer les équipes du club',
      tables: 'Tables',
      title: 'Depuis le club'
    },
    code: {
      explain:
        'Il vous a été donné à la création de la rencontre. Il ouvre la préparation et les corrections.',
      label: 'Code organisateur',
      submit: 'Ouvrir l’organisation',
      title: 'Organiser cette rencontre',
      yours:
        'Votre code organisateur, à garder pour ouvrir cette page ailleurs\u00a0:'
    },
    correction: {
      addGame: 'Ajouter une manche',
      corrected: 'Score corrigé.',
      game: 'Manche {game:number}',
      impossible: 'Score impossible ici',
      less: 'Un point de moins pour {name}',
      more: 'Un point de plus pour {name}',
      open: 'Corriger',
      openScore: 'Corriger le score',
      playing: 'En cours',
      points: 'Manche {game:number}, points de {name}',
      removeGame: 'Retirer la dernière manche',
      rule: 'Une manche se gagne à {points:number} points avec 2 points d’écart, seule la dernière peut être en cours, et le match s’arrête dès qu’il est gagné.',
      submit: 'Enregistrer le score',
      swap: 'Inverser les points de la manche {game:number}',
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
        'Ce match n’a pas commencé. Un joueur absent ou blessé peut être déclaré forfait.',
      won: 'Gagnée par {name}'
    },
    deletion: {
      confirm: 'Effacer la rencontre définitivement',
      explain: defineTranslation(
        'La rencontre, ses joueurs et ses scores sont effacés automatiquement {days:plural} après la dernière modification. Vous pouvez l’effacer dès maintenant\u00a0: les écrans, les arbitres et les spectateurs la perdent aussitôt, et rien ne pourra être récupéré.',
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
      pair: {
        code: 'Code affiché sur l’écran',
        done: '{name} est branché.',
        error: {
          expired:
            'Ce code n’est plus valable. L’écran en affiche un nouveau\u00a0: tapez-le.',
          network: 'Pas de connexion. Réessayez.',
          refused: 'L’écran n’a pas pu être branché. Réessayez.',
          unknown_display: 'Cet écran a été retiré de la rencontre.',
          wrong_code: 'Votre code organisateur n’est plus le bon.'
        },
        explain:
          'Sur l’ordinateur branché au téléviseur, ouvrez <link>{url}</link>. Il affiche un code\u00a0: tapez-le ici, ou scannez son QR code avec ce téléphone.',
        submit: 'Brancher l’écran',
        title: 'Brancher un écran',
        which: 'Ce que montre l’écran'
      },
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
    forfeit: {
      confirm: defineTranslation('Forfait de {name}\u00a0: {count:plural}', {
        plural: {
          count: { one: '{?} match perdu', other: '{?} matchs perdus' }
        }
      }),
      declare: defineTranslation('Déclarer forfait ({count:plural})', {
        plural: { count: { one: '{?} match', other: '{?} matchs' } }
      }),
      given: defineTranslation('{name} : forfait sur {count:plural}', {
        plural: { count: { one: '{?} match', other: '{?} matchs' } }
      }),
      none: 'Plus aucun match ne l’attend.',
      player: 'Joueur absent',
      undo: 'Annuler le forfait',
      vacant: '{letter} (place vide)'
    },
    hall: {
      cancel: 'Annuler',
      close: 'Fermer la table',
      emptyPlace: 'Mettre la table ici',
      encounters: 'Rencontres',
      free: 'Libre',
      freeLong: 'Aucune rencontre sur cette table.',
      hidden: 'Rangée',
      hintEncounter:
        'Touchez la table où installer {encounter}\u00a0: elle prend aussi sa voisine.',
      hintIdle:
        'Touchez une table pour son QR d’arbitrage, ou une rencontre pour la changer de tables.',
      hintTable:
        'Touchez une place libre ou une autre table pour y mettre la table {table:number}.',
      inUse: 'Utilisée aujourd’hui',
      keepForClub: 'Garder ce plan pour le club',
      keptForClub: 'Plan gardé pour le club',
      label: 'Plan de la salle',
      moveEncounter: 'Déplacer la rencontre',
      moveTable: 'Déplacer la table',
      noEncounter: 'Aucune rencontre\u00a0: ajoutez-en dans Équipes.',
      noTable: 'Sans table',
      number: 'Numéro',
      stands: 'Gradins',
      undo: 'Annuler la dernière modification'
    },
    keep: 'Garder',
    live: {
      free: 'Libre, rien de prévu'
    },
    matches: {
      add: 'Ajouter le match',
      addTitle: 'Nouveau match',
      away: 'Joueur extérieur',
      bestOf: 'Manches',
      bestOfOption: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} manche gagnante',
            other: '{?} manches gagnantes'
          }
        }
      }),
      empty: 'Aucun match. Ajoutez des joueurs, puis leurs matchs.',
      home: 'Joueur à domicile',
      noTable: 'Sans table',
      plannedAt: 'Heure prévue',
      plannedAtSave: 'Enregistrer',
      remove: 'Retirer',
      removeConfirm: 'Retirer ce match',
      table: 'Table'
    },
    pick: {
      addClub: 'Ajouter le club {name}',
      addPlayer: 'Ajouter {name}',
      addTeam: 'Ajouter l’équipe {name}',
      clubPlaceholder: 'Nom du club',
      fullName:
        'Personne ne s’appelle « {typed} » : tapez prénom et nom pour l’ajouter.',
      none: 'Rien ne commence par « {typed} ».',
      nothing: 'Rien à choisir.',
      playerPlaceholder: 'Nom ou premières lettres',
      teamPlaceholder: 'Équipe ou club',
      typeToAdd: 'Tapez un nom pour l’ajouter.'
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
    tableMatch: {
      closeCorrection: 'Fermer la correction',
      correctPrevious: 'Corriger le score de {call}',
      undoCorrection: 'Annuler la correction'
    },
    tabs: {
      encounters: 'Équipes',
      live: 'En direct',
      matches: 'Programme',
      plan: 'Plan',
      players: 'Joueurs',
      settings: 'Réglages',
      tables: 'Tables et écrans',
      tournament: 'Top 12'
    },
    teams: {
      add: 'Ajouter l’équipe',
      count: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} équipe', other: '{?} équipes' } }
      }),
      empty:
        'Aucune équipe\u00a0: utile seulement pour les rencontres par équipes.',
      members: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} joueur', other: '{?} joueurs' } }
      }),
      name: 'Nom de l’équipe'
    },
    title: 'Organisation',
    tournament: {
      build: defineTranslation('{count:plural}', {
        plural: {
          count: { one: 'Créer le match', other: 'Créer les {?} matchs' }
        }
      }),
      clubmates: 'Deux joueurs du même club dans cette poule.',
      clubs: 'Clubs',
      clubsHint:
        'Touchez les clubs du tournoi\u00a0: leurs deux meilleurs joueurs entrent.',
      draw: 'Tirer au sort',
      drawAgain: 'Refaire le tirage au sort',
      drawHint:
        'Des joueurs restent à égalité après le départage\u00a0: un tirage au sort les place, égalité par égalité.',
      final: 'Finale',
      lossPoints: 'Points pour une défaite',
      needPlayers: 'Il faut au moins 4 joueurs, 2 par poule.',
      noClub:
        'Aucun club avec des joueurs\u00a0: ajoutez-les dans la fiche du club, ou dans l’onglet Joueurs.',
      otherClub: 'Autre club',
      otherPlayer: 'Autre joueur',
      players: 'Joueurs',
      playersHint:
        'Touchez un joueur pour l’ajouter ou le retirer, rangés par points.',
      pool: 'Poule {number:number}',
      poolMatch: '{home:number} – {away:number}',
      pools: 'Poules',
      poolsHint:
        'Par points, sans deux joueurs d’un même club. Touchez un joueur puis un autre pour les échanger.',
      ready: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Tournoi prêt\u00a0: {?} match.',
            other: 'Tournoi prêt\u00a0: {?} matchs.'
          }
        }
      }),
      rebuild: defineTranslation('{count:plural}', {
        plural: {
          count: { one: 'Refaire le match', other: 'Refaire les {?} matchs' }
        }
      }),
      remove: 'Retirer le tournoi',
      reseed: 'Revenir aux poules automatiques',
      rules: 'Règles',
      semiFinal: 'Demi-finale {slot:number}',
      swapping:
        'Touchez le joueur qui prend sa place, ou le même pour annuler.',
      tables: 'Tables',
      tablesBracket:
        'Demi-finales tables {first:number} et {second:number}, finale table {first:number}.',
      tablesHint: 'Dans l’ordre du plan de la salle, sans les tables rangées.',
      tablesPool: 'Poule {number:number}\u00a0: tables {tables:list}',
      thirdPlace: 'Petite finale',
      thirdPlaceSwitch: 'Match pour la 3e place',
      tieGroup: 'Poule {pool:number} · places {first:number} à {last:number}',
      tiePair: 'Poule {pool:number} · places {first:number} et {last:number}',
      title: 'Top 12',
      underWay:
        'Le tournoi a commencé\u00a0: les poules et les règles ne changent plus.',
      undo: 'Annuler la dernière modification',
      winPoints: 'Points pour une victoire'
    },
    umpireChoice: {
      candidate: '{name} · {team}',
      label: 'Arbitre',
      nobody: 'Pas d’arbitre',
      sheet: '{name}, à son tour',
      sheetNobody: 'À tour de rôle, personne de libre'
    }
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
      legal: 'Mentions légales et confidentialité'
    }
  },
  spectator: {
    bracket: {
      poolRunnerUp: '2e de la poule {pool}',
      poolWinner: '1er de la poule {pool}',
      semiLoser: 'Perdant de la demi-finale {slot:number}',
      semiWinner: 'Vainqueur de la demi-finale {slot:number}',
      title: 'Phase finale'
    },
    detail: {
      card: '{name}\u00a0: carton jaune',
      cardPenalty: defineTranslation(
        '{name}\u00a0: carton jaune et rouge, {points:plural}',
        { plural: { points: { one: '{?} point', other: '{?} points' } } }
      ),
      timeout: '{name}\u00a0: temps mort pris'
    },
    empty: {
      finished: 'Aucun match terminé pour l’instant.',
      live: 'Aucun match en cours. Les prochains sont dans « À venir ».',
      upcoming: 'Rien d’annoncé pour l’instant.'
    },
    finishedAt: defineTranslation('fini à {at:date}', {
      date: { at: { timeStyle: 'short' } }
    }),
    follow: 'Suivre {name}',
    following: 'Suivi\u00a0: {name}',
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
    pools: {
      complete: 'Terminée',
      drawn: '* Départagés par tirage au sort.',
      long: {
        games: 'Manches gagnées et perdues',
        losses: 'Défaites',
        points: 'Points de poule',
        wins: 'Victoires'
      },
      player: 'Joueur',
      playing: 'En cours',
      pool: 'Poule {name}',
      rank: 'Place',
      short: {
        games: 'Manches',
        losses: 'D',
        points: 'Pts',
        wins: 'V'
      }
    },
    room: {
      free: 'Libre',
      hint: 'Touchez une table pour voir son match.',
      label: 'Plan de la salle',
      next: 'Puis {call}',
      noMatch: 'Aucun match prévu sur la table {table:number}.',
      stands: 'Gradins'
    },
    section: {
      encounters: 'Rencontres',
      finished: 'Résultats',
      hall: 'Salle',
      live: 'En cours',
      pools: 'Poules',
      upcoming: 'À venir'
    },
    sheet: {
      games: 'Manches',
      hide: 'Replier',
      over: 'Rencontre terminée',
      parties: 'Parties',
      points: 'Points',
      progress: '{done:number}/{total:number} parties jouées',
      show: 'Toute la feuille',
      tables: defineTranslation('{count:plural} {tables:list}', {
        plural: { count: { one: 'Table', other: 'Tables' } }
      }),
      totals: 'Totaux de la feuille'
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
  umpire: {
    awaiting: {
      match: '{name} gagne le match, {score}',
      period: '{name} gagne la manche, {score}'
    },
    card: {
      cancel: 'Pas de carton',
      confirmYellow: 'Carton jaune pour {name}',
      confirmYellowRed: defineTranslation(
        'Jaune et rouge pour {name}\u00a0: {points:plural} à {opponent}',
        { plural: { points: { one: '{?} point', other: '{?} points' } } }
      ),
      give: 'Carton…',
      yellow: 'Carton jaune',
      yellowRed: 'Jaune et rouge'
    },
    confirm: {
      match: 'Valider le match',
      period: 'Valider la manche'
    },
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
    discipline: {
      section: 'Temps morts et cartons',
      withdraw: 'Retirer'
    },
    encounter: 'Rencontre',
    end: {
      cancel: 'Revenir au match',
      confirm: 'Confirmer\u00a0: {name} gagne',
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
      who: 'Qui s’arrête\u00a0?',
      why: 'Motif'
    },
    entry: {
      code: 'Code de la table',
      hint: 'Il est affiché sur la table, sous le QR code\u00a0: six lettres ou chiffres.',
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
      last: 'Match précédent\u00a0: {winner} bat {loser} {games}',
      title: 'Qui sert en premier\u00a0?'
    },
    startedAt: defineTranslation('Commencé à {at:date} · {elapsed} de jeu', {
      date: { at: { timeStyle: 'short' } }
    }),
    timeout: {
      call: 'Temps mort',
      running: 'Temps mort · {seconds:number} s',
      used: 'Temps mort pris'
    },
    title: 'Arbitrage',
    undo: 'Annuler le dernier point'
  },
  wall: {
    codeHint:
      'Tapez ce code dans l’organisation de la rencontre, onglet Tables',
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
      type: 'Ou, dans l’organisation de la rencontre, onglet Tables et écrans, tapez le code\u00a0:'
    },
    title: 'Brancher un écran'
  }
})
