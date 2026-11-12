import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

/** The umpire's sheet, in its own chunk: no other screen shows it. */
export const FR_UMPIRE_DICTIONARY = defineDictionary({
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
    putAway: {
      explain:
        'Ses matchs continuent sur d’autres tables\u00a0: scannez le QR de celle où vous arbitrez.',
      title: 'Table rangée pour la journée'
    },
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
  }
})
