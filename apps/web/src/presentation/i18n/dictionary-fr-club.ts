import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

import { DAYS_PLURAL } from './dictionary-fr'

/** What only a club's own screens show: its page, its season and the events its organiser runs. */
export const FR_CLUB_DICTIONARY = defineDictionary({
  club: {
    backToEvent: 'Retour à la rencontre',
    championship: {
      composer: {
        dates: 'Dates des journées',
        datesHelp:
          'Une date posée place les journées suivantes deux semaines plus tard ; chacune se corrige ensuite.',
        noNumber: 'Pas encore connu',
        number: 'Numéro de poule',
        outcome: {
          draw: 'Nul',
          forfeit: 'Forfait',
          loss: 'Défaite',
          win: 'Victoire'
        },
        phase: 'Phase',
        points: 'Points au classement',
        pointsChoice: defineTranslation('{count:plural}', {
          plural: { count: { one: '{?} point', other: '{?} points' } }
        }),
        remove: 'Retirer cette poule',
        removeConfirm: 'Retirer la poule et ses résultats',
        size: 'Nombre d’équipes',
        sizeChoice: '{count} équipes',
        summary: '{teams} équipes · {rounds} journées',
        teamNumber: 'N° {number}',
        teams: 'Équipes, dans l’ordre du calendrier',
        title: 'Poule et calendrier de la fédération'
      },
      earlier: defineTranslation('{count:plural}', {
        plural: {
          count: { one: 'Phase précédente', other: '{?} phases précédentes' }
        }
      }),
      help: 'Recopiez une fois la poule et le calendrier de la fédération : le classement se calcule tout seul, et chaque dimanche la console prépare les rencontres de la journée.',
      newPool: 'Nouvelle poule',
      newPoolTeam: 'Pour l’équipe',
      next: 'Prochaine journée : J{number}',
      noOwnTeam: 'Aucune équipe du club',
      noTeam: 'Ajoutez d’abord une équipe du club.',
      phase: 'Phase {phase} · {season}–{nextSeason}',
      points: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} pt', other: '{?} pts' } }
      }),
      poolNumber: 'Poule {number}',
      rank: defineTranslation('{rank:plural}', {
        plural: { rank: { one: '{?}er', other: '{?}e' } }
      }),
      rounds: {
        away: 'À l’extérieur',
        date: defineTranslation('{at:date}', {
          date: { at: { day: 'numeric', month: 'short', weekday: 'short' } }
        }),
        followed: 'Le score arrivera de la feuille de la journée.',
        forfeit: 'Forfait {name}',
        forfeitOurs: 'Forfait',
        forfeitTheirs: 'Forfait adverse',
        fromSheet: 'Score venu de la feuille de la journée.',
        home: 'À domicile',
        invert: 'Inverser : {name} reçoit',
        long: 'Journée {number}',
        notPlayed: 'Pas encore joué',
        rest: 'Exempt',
        short: 'J{number}',
        title: 'Calendrier',
        undated: 'Date à venir'
      },
      standings: {
        drawn: 'Nuls',
        drawnShort: 'N',
        lost: 'Défaites',
        lostShort: 'D',
        played: 'Joués',
        playedShort: 'J',
        points: 'Points',
        pointsShort: 'Pts',
        rank: 'Classement',
        rankShort: 'Clt',
        team: 'Équipe',
        title: 'Classement',
        won: 'Victoires',
        wonShort: 'V'
      },
      title: 'Championnat',
      unknownTeam: 'Équipe {number}'
    },
    code: 'Code du club',
    federation: {
      down: 'La FFTT ne répond pas pour l’instant. Rien n’est perdu : réessayez plus tard.',
      noClub:
        'Aucun club FFTT ne répond à « {typed} ». Essayez un autre mot du nom, ou le numéro à 8 chiffres du club.',
      offline: 'La recherche FFTT attend le réseau.',
      ourQuestion: 'Est-ce votre club à la FFTT ?',
      searching: 'Recherche à la FFTT…',
      searchLabel: 'Nom ou numéro du club',
      season: {
        byHand: 'Résultats saisis à la main',
        byHandSummary:
          'Ce que vos feuilles ont donné, gardé pour la console et pour quand la FFTT ne répond pas.',
        down: 'La FFTT ne répond pas : voici la poule recopiée à la main. Son classement reviendra dès qu’elle répondra.',
        loading: 'Classement et calendrier à la FFTT…',
        offline: 'Hors ligne : voici la poule recopiée à la main.',
        ourSheet: 'notre feuille',
        sheetDown: 'La FFTT ne donne pas cette feuille pour l’instant.',
        sheetLoading: 'Feuille de la rencontre à la FFTT…',
        sheetOffline: 'Hors ligne : la feuille attend le réseau.'
      },
      source: 'Source : FFTT',
      tag: 'FFTT',
      theirQuestion: 'Quel est {club} à la FFTT ?',
      unlink: 'Délier de la FFTT',
      why: 'Un toucher, et ses licenciés arrivent avec leurs points.'
    },
    forget: 'Changer de club',
    hall: {
      default: 'Plan des prochains événements',
      delete: 'Supprimer le plan {name}',
      empty:
        'Dessinez la salle dans l’onglet Plan d’une journée, puis touchez « Plans enregistrés » et « Enregistrer ce plan » : chaque nouvel événement partira de ce plan.',
      help: 'Chaque nouvel événement part du plan étoilé. Pour en ajouter un : onglet Plan d’une journée, « Plans enregistrés », puis « Enregistrer ce plan ».',
      makeDefault: 'En faire le plan par défaut',
      title: 'Salle'
    },
    home: 'Accueil',
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
      title: 'Votre club'
    }
  },
  organiser: {
    access: {
      codeHint: 'L’arbitre tape ce code',
      copied: 'Lien copié',
      copy: 'Copier le lien',
      display: 'Grand écran',
      displayHere: 'Afficher sur cet appareil',
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
    chooser: {
      blockFreeHint: 'Libres, elles servent aux matchs hors rencontre.',
      blockHint: '{encounter} prendra les tables de la rencontre choisie.',
      close: 'Fermer',
      free: 'Libres',
      freeTables: 'Tables libres',
      here: 'Ici',
      noTables: 'Sans tables',
      playsOn: '{encounter} joue sur',
      playsThere: 'y joue',
      singleTable: 'Une seule table montée',
      table: 'Table {table:number}',
      tables: 'Tables {tables}',
      tablesHint: 'Une rencontre qui y joue déjà prend les tables {tables}.',
      tablesUnseatedHint:
        'Une rencontre qui y joue déjà se retrouve sans tables.'
    },
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
      tablesAfterTeam: 'Choisies avec notre équipe',
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
      addScreen: 'Ajouter un écran',
      addTitle: 'Nouvel écran',
      all: 'Écran principal',
      allTables: 'toutes les tables',
      connect: 'Connecter un grand écran',
      connected: 'Connecté',
      everyTable: 'Toutes les tables',
      explain:
        'Un écran montre les tables de la première à la dernière. Ouvrez son lien sur l’ordinateur branché au téléviseur.',
      first: 'Première table',
      last: 'Dernière table',
      name: 'Nom de l’écran',
      namePlaceholder: 'Salle B',
      notConnected: 'Pas connecté',
      open: 'Ouvrir',
      pair: {
        close: 'Fermer',
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
      screenName: 'Écran {number:number}',
      screens: 'Grands écrans',
      see: 'Voir',
      shareRun: 'Tables {first:number} à {last:number}',
      tables: 'Tables affichées',
      title: 'Écrans',
      view: {
        encounters: 'Par rencontre',
        hall: 'Comme dans la salle',
        label: 'Vue de {name}',
        pools: 'Par poule',
        unavailable: 'Le plan de la salle ne permet pas encore cette vue.'
      }
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
    encountersStep: {
      addAnother: 'Ajouter une rencontre',
      added: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Rencontre ajoutée.',
            other: '{?} rencontres ajoutées.'
          }
        }
      }),
      away: 'À l’extérieur, hors de la salle : {encounters:list}.',
      awayAt: '{team} à {at}',
      changeFormat: 'Changer de format',
      chooseTables: 'Choisir les tables',
      empty:
        'Aucune rencontre pour l’instant : ajoutez celles de la journée ci-dessous.',
      firstTable: '1ʳᵉ table',
      grip: 'Glisser sur un bloc du plan',
      hall: 'Dans la salle',
      hallHint:
        'Glissez une rencontre sur un bloc, ou touchez le bandeau d’un bloc pour choisir qui y joue.',
      lineupChanged: 'Composition de {team} changée.',
      orderOneTable:
        'La feuille de {count:number} parties suit l’ordre officiel, {first} en premier.',
      orderTwoTables:
        'La feuille de {count:number} parties suit l’ordre officiel : {first} sur {firstTable}, {second} sur {secondTable}, puis en alternance.',
      receives: 'reçoit',
      roundTitle: defineTranslation(
        'Journée {number:number} · {count:plural}',
        {
          plural: {
            count: {
              one: '{?} rencontre à la maison',
              other: '{?} rencontres à la maison'
            }
          }
        }
      ),
      seated: '{seated:number}/{total:number}',
      secondTable: '2ᵉ table',
      swapped: '{one} et {other} échangent leurs tables.',
      tablesOf: 'Tables de {encounter} : {tables}',
      theFirstTable: 'la 1ʳᵉ table',
      theSecondTable: 'la 2ᵉ table',
      theTable: 'la table {table:number}',
      title: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} rencontre à la maison',
            other: '{?} rencontres à la maison'
          }
        }
      }),
      toChoose: 'à choisir'
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
    format: {
      championship:
        'Une rencontre sur deux tables, la feuille de 20 parties dans l’ordre officiel.',
      free: 'Des matchs un par un, sur la table de votre choix.',
      pools:
        'Tout le monde se rencontre dans sa poule, puis demi-finales et finale.',
      title: 'Quel format, aujourd’hui ?',
      top12: 'Le Top 12 du club en est un réglage tout prêt.'
    },
    hall: {
      cancel: 'Annuler',
      close: 'Fermer la table',
      freeLong: 'Aucune rencontre sur cette table.',
      label: 'Plan de la salle',
      noTable: 'Sans table',
      stands: 'Gradins'
    },
    hallStep: {
      print: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Imprimer le QR de la table',
            other: 'Imprimer les QR des {?} tables'
          }
        }
      }),
      qrHint:
        'Une feuille par table, posée dessus : l’arbitre la scanne et compte les points.',
      qrTitle: 'QR des tables'
    },
    keep: 'Garder',
    live: {
      blockLabel: 'Tables {block} : {encounter}. Choisir la rencontre.',
      byTable: 'Par table',
      closeTable: 'Fermer la table {table:number}',
      empty: {
        explain:
          'Chaque match démarre au premier point compté par son arbitre, depuis le QR de sa table. Ses scores s’afficheront ici, et sur le grand écran.',
        title: 'Rien n’a commencé',
        wall: 'Voir le grand écran'
      },
      free: 'Libre, rien de prévu',
      freeTable: 'Table libre',
      next: 'Puis {call}',
      pill: {
        deuce: 'Égalité',
        'game-won': 'Manche gagnée',
        'match-won': 'Match gagné'
      },
      tableFree: 'Table {table:number}, libre',
      tableLive:
        'Table {table:number}, {call} : {home} {homeScore:number}, {away} {awayScore:number}',
      tableNext: 'Table {table:number}, libre, puis {call}',
      title: 'Les tables, en direct',
      waiting: 'En attente d’une table'
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
      roster: {
        choose: 'Choisir',
        close: 'Fermer la liste',
        down: 'La FFTT ne répond pas : seuls les joueurs déjà saisis sont proposés.',
        free: 'Libérer la lettre',
        licensees: 'Licenciés de {club}',
        loading: 'Licenciés de {club}…',
        noMatch:
          'Personne ne commence par « {typed} ». Une licence marche aussi.',
        offline: 'Hors ligne : seuls les joueurs déjà saisis sont proposés.',
        playedFor: 'Ont joué pour {team}',
        search: 'Premières lettres ou licence',
        typed: 'Saisis à la main',
        typedMark: 'saisi à la main'
      },
      teamPlaceholder: 'Équipe ou club',
      typeToAdd: 'Tapez un nom pour l’ajouter.'
    },
    plan: {
      add: 'Ajouter une table',
      added: 'Table {table:number} ajoutée.',
      away: {
        free: 'Libre',
        freeBefore: 'Libre · son prochain match, {call}, attendra',
        keep: 'Garder la table {table:number} montée',
        movedOn:
          'Le match de la table {from:number} continue sur la table {to:number}.',
        movedWaiting:
          'Le match de la table {from:number} attend une table libre.',
        onTable: 'Sur la table {table:number}',
        options: 'Où continuer le match de la table {table:number}',
        question: 'Un match s’y joue. Où le continuer ?',
        suite: 'Le score et l’arbitre suivent le match.',
        wait: 'En attente',
        waitHint: 'Il reprendra sur la première table libérée.'
      },
      blockCleared: 'Plus de rencontre sur les tables {block}.',
      blockLabel:
        'Tables {block} : {encounter}. Choisir la rencontre, ou glisser pour déplacer le bloc.',
      blockSeated: '{encounter} joue sur les tables {block}.',
      changed: 'Modification enregistrée.',
      chooseFor: 'Sur les tables {block}',
      chooseOn: 'Rencontre des tables {block}',
      delete: 'Supprimer la table',
      deleted: 'Table {table:number} supprimée.',
      deletedRenumbered:
        'Table {table:number} supprimée : les tables sont renumérotées de 1 à {count:number}, réimprimez leurs QR.',
      deleteTable: 'Supprimer la table {table:number} pour de bon',
      dropToPutAway: 'Lâcher ici pour ranger {what} pour la journée',
      hallOf: defineTranslation('Salle à {count:plural}', {
        plural: {
          count: { one: '{?} table', other: '{?} tables' }
        }
      }),
      hint: 'Glissez les tables où elles sont dans la salle ; touchez-en une pour son QR d’arbitrage.',
      isDefault: '{name}, plan des prochains événements',
      makeDefault: 'Faire de {name} le plan des prochains événements',
      movedBlock: 'Bloc {block} déplacé.',
      movedTable: 'Table {table:number} déplacée.',
      noEncounter: 'Aucune rencontre',
      noneSaved: 'Aucun plan enregistré pour le club.',
      noRoomBack: 'Pas de place à cet endroit : la table est revenue.',
      noRoomHere:
        'Pas de place à cet endroit : la table est restée dans la réserve.',
      noRoomToTurn:
        'Pas la place de tourner la table {table:number} ici : déplacez-la d’abord.',
      noRoomToTurnBlock:
        'Pas la place de tourner le bloc {block} ici : déplacez-le d’abord.',
      playing: 'Un match s’y joue',
      putAway: 'Ranger pour la journée',
      putAwayBlock: 'Bloc {block} rangé pour la journée.',
      putAwayDone: 'Table {table:number} rangée pour la journée.',
      putAwayTable:
        'Ranger la table {table:number} dans la réserve pour la journée',
      putBackDone: 'Table {table:number} remise sur le plan.',
      putBackHint: 'Toucher pour la remettre, ou la glisser sur le plan',
      putBackResumed:
        'Table {table:number} remise sur le plan : le match en attente y reprend.',
      putBackTable: 'Table {table:number}, rangée : la remettre sur le plan',
      reserve: 'Réserve',
      reserveEmpty: 'Glissez ici une table à ranger pour la journée',
      reserveHint:
        'Touchez une table pour la remettre à sa place, ou glissez-la sur le plan.',
      reserveLabel: 'Réserve : les tables rangées pour la journée',
      save: 'Enregistrer ce plan',
      saveAsDefault: 'Par défaut pour les prochains événements',
      saved: 'Plans enregistrés',
      saveName: 'Nom du plan',
      swap: 'Échanger',
      swappedBlocks: 'Blocs {one} et {other} échangés.',
      swappedTables: 'Tables {one:number} et {other:number} échangées.',
      tableLabel:
        'Table {table:number}. Glisser pour la déplacer, dans la réserve pour la ranger ; flèches pour la déplacer, R pour la tourner.',
      theBlock: 'le bloc {block}',
      theTable: 'la table {table:number}',
      turn: 'Tourner la table',
      turnBlock: 'Tourner le bloc {block}',
      turnedBlock: 'Bloc {block} tourné.',
      turnedTable: 'Table {table:number} tournée.',
      turnTable: 'Tourner la table {table:number}',
      used: 'Plan « {name} » mis en place.'
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
    round: {
      add: 'Ajouter',
      addAll: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Ajouter la rencontre à domicile',
            other: 'Ajouter les {?} rencontres à domicile'
          }
        }
      }),
      added: 'Ajoutée',
      help: 'Chaque équipe du club arrive avec sa dernière composition, sur ses tables.',
      home: 'À domicile, contre',
      title: 'Journée {number} du championnat',
      titleMixed: 'Rencontres du championnat',
      unknown: 'Adversaire à choisir dans Mon club'
    },
    save: 'Enregistrer',
    settings: {
      club: 'Nom du club',
      name: 'Nom de la rencontre',
      startsAt: 'Début de la rencontre',
      startsAtHelp:
        'Sert à annoncer l’heure des premiers matchs et à estimer celle des suivants.',
      tableCount: 'Nombre de tables'
    },
    steps: {
      back: 'Retour à la journée',
      encounters: 'Rencontres',
      format: {
        championship: 'Championnat par équipes',
        free: 'Matchs libres',
        pools: 'Poules puis tableau'
      },
      hall: 'Salle',
      home: 'Accueil',
      label: 'Étapes de la journée',
      live: 'En direct',
      next: {
        encounters: 'Suivant : les rencontres',
        live: 'Suivant : en direct'
      },
      settings: 'Réglages',
      status: {
        encountersReady: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} rencontre prête',
              other: '{?} rencontres prêtes'
            }
          }
        }),
        formatToChoose: 'Format à choisir',
        freeMatches: defineTranslation('{count:plural}', {
          plural: { count: { one: '{?} match', other: '{?} matchs' } }
        }),
        lineupsToDo: defineTranslation('{count:plural}', {
          plural: {
            count: { one: '{?} compo à faire', other: '{?} compos à faire' }
          }
        }),
        noEncounter: 'Rencontres à ajouter',
        noScreen: 'pas d’écran',
        nothingRunning: 'Rien en cours',
        pools: defineTranslation('{count:plural}', {
          plural: {
            count: { one: 'Poules · {?} joueur', other: 'Poules · {?} joueurs' }
          }
        }),
        running: defineTranslation('{count:plural}', {
          plural: {
            count: { one: '{?} match en cours', other: '{?} matchs en cours' }
          }
        }),
        screens: defineTranslation('{count:plural}', {
          plural: { count: { one: '{?} écran', other: '{?} écrans' } }
        }),
        tables: defineTranslation('{count:plural}', {
          plural: { count: { one: '{?} table', other: '{?} tables' } }
        }),
        unseated: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} rencontre sans tables',
              other: '{?} rencontres sans tables'
            }
          }
        })
      }
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
  }
})
