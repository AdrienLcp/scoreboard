import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

import { DAYS_PLURAL } from './dictionary-fr'

/** The legal page's strings, in its own chunk: no other page shows them. */
export const FR_LEGAL_DICTIONARY = defineDictionary({
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
      federation:
        'Les licenciés, leurs points, les clubs et les poules viennent de la Fédération française de tennis de table (FFTT) : le site les lui demande et les garde en cache {hours} heures au plus, comme ses conditions d’utilisation le permettent, sans les enregistrer. Seul le numéro FFTT d’un club relié est gardé avec le club. Pour corriger une licence ou des points, adressez-vous à votre club ou à la FFTT.',
      heading: 'Qui d’autre reçoit vos données'
    },
    title: 'Mentions légales et confidentialité'
  }
})
