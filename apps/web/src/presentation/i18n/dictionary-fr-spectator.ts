import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

/** The spectator's view, in its own chunk: no other screen shows it. */
export const FR_SPECTATOR_DICTIONARY = defineDictionary({
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
    whereWaiting: 'Son match attend une table libre',
    yourPlayers: 'Vos joueurs'
  }
})
