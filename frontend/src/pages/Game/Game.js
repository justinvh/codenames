import { ref, computed } from '@vue/composition-api'
import Peer from 'peerjs'

import Card from './Card.js'
import CodenamesDeck from './decks/Codenames'
import UndercoverDeck from './decks/Undercover'
import DuetDeck from './decks/Duet'
import Honorifics from './decks/Honorifics'
import Deck from './decks/Deck'

const DECKS = [CodenamesDeck(), UndercoverDeck(), DuetDeck()]

class Game {
  // The known cards for the current game
  board = ref([])

  // Whether this instance is hosting or not
  hosting = ref(false)

  // Likely to be Quasar's notifier engine
  notifier = null

  // Team members for each group
  teams = ref({
    red: {
      name: 'Red',
      players: {},
      label: '',
      timeTaken: 0,
      cardsFound: 0,
      cardsTotal: 8,
      wins: false
    },

    blue: {
      name: 'Blue',
      players: {},
      label: '',
      timeTaken: 0,
      cardsFound: 0,
      cardsTotal: 8,
      wins: false
    }
  })

  // Configuration of the game
  config = ref({
    first: 'red',
    turn: 'red',
    revealTimeSec: 0.50,
    agentCards: {
      red: 8,
      blue: 8,
      bystanders: 7,
      assassin: 1
    },

    deckOptions: DECKS.map(deck => { return { label: deck.name, value: deck.name } }),
    decks: [DECKS[0].name],

    // Specifically player attributes
    player: {
      id: Math.random(),
      name: Game.randomPlayerName(),
      team: { label: 'Red', value: 'red' },
      isSpy: false,
      isChooser: false,
      role: { label: 'No', value: 'player' }
    }
  })

  // Known connections from this client
  #connections = []

  // When the user holds the mouse down this is populated
  #mouseDownIntervalId = null

  /**
   * Create and attempt to host or join an existing game
   * @param {string} code - The unique identifier for this game
   */
  constructor (code) {
    this.peerID = code
    this.attemptHostGame()
  }

  notifyWarning (message) {
    this.notify({
      type: 'warning',
      message: message
    })
  }

  notifyError (message) {
    this.notify({
      type: 'negative',
      message: message
    })
  }

  notifySuccess (message) {
    this.notify({
      type: 'positive',
      message: message
    })
  }

  /**
   * Generate a random player name following the format [Honorific] [Card] OR [Card] [Honorific]
   * @static
   */
  static randomPlayerName () {
    // Construct a fun playerName
    const card = CodenamesDeck().drawOne()
    const honorific = Honorifics().drawOne()
    if (honorific.prefix) {
      return honorific.prefix + card
    } else if (honorific.suffix) {
      return card + honorific.suffix
    }
  }

  switchTeams () {
    this.invalidateConnections()
  }

  /**
   * Send a given client brand new information about the game for sync.
   * @param {PeerJS.Connection} client - Connection to send game data to
   */
  sendNewState (client) {
    const state = {
      type: 'new',
      cards: [],
      teams: { red: {}, blue: {} },
      first: this.config.value.first,
      turn: this.config.value.turn
    }

    // Build out the team states
    this.buildTeamState(state.teams.red, this.teams.value.red)
    this.buildTeamState(state.teams.blue, this.teams.value.blue)

    this.board.value.forEach(card => {
      state.cards.push(card.toNewObject())
    })

    client.send(state)
  }

  buildTeamState (sTeam, team) {
    sTeam.name = team.name
    sTeam.players = team.players
    sTeam.label = team.label
    sTeam.timeTaken = team.timeTaken
    sTeam.cardsFound = team.cardsFound
    sTeam.cardsTotal = team.cardsTotal
    sTeam.wins = team.wins
  }

  /**
   * Send a given client information about what has changed for a game.
   * @async
   * @param {PeerJS.Connection} client - Connection to send game data to
   */
  sendDeltaState (client) {
    const state = {
      type: 'delta',
      cards: [],
      first: this.config.value.first,
      turn: this.config.value.turn,
      teams: { red: {}, blue: {} }
    }

    // Build out the team states
    this.buildTeamState(state.teams.red, this.teams.value.red)
    this.buildTeamState(state.teams.blue, this.teams.value.blue)

    this.board.value.forEach(card => {
      state.cards.push(card.toDeltaObject())
    })

    client.send(state)
  }

  /**
   * Given a new state for updating, dispatch the appropriate update call
   * @param {Object} state - The dictionary representing new object states
   */
  updateState (state) {
    if (state.type === 'new') {
      this.updateNewState(state)
    } else if (state.type === 'delta') {
      this.updateDeltaState(state)
    }
  }

  updateTeam (oldTeam, newTeam) {
    newTeam.name = oldTeam.name
    newTeam.players = oldTeam.players
    newTeam.label = oldTeam.label
    newTeam.timeTaken = oldTeam.timeTaken
    newTeam.cardsFound = oldTeam.cardsFound
    newTeam.cardsTotal = oldTeam.cardsTotal
    newTeam.wins = oldTeam.wins
  }

  /**
   * Update the current Game instance with a brand new state from a different client
   * @param {Object} state - The game state that will be merged into the current one
   */
  updateNewState (state) {
    const cards = []

    if (this.hosting.value) {
      return
    }

    this.updateTeam(state.teams.red, this.teams.value.red)
    this.updateTeam(state.teams.blue, this.teams.value.blue)

    if (state.turn !== this.config.value.turn) {
      this.notify(`${state.turn.toUpperCase()}'s turn`)
    }

    this.config.value.turn = state.turn
    this.config.value.first = state.first

    state.cards.forEach(cardState => {
      const card = new Card(this.config, cardState.name, cardState.group)
      card.className.value = cardState.className
      card.setRevealed(cardState.revealed)
      cards.push(card)
    })

    this.refreshTeams()
    this.board.value = cards
  }

  /**
   * Update the current Game instance with a delta state from a different client
   * @param {Object} state - The game state that will be merged into the current one
   */
  updateDeltaState (state) {
    if (!this.hosting.value) {
      this.updateTeam(state.teams.red, this.teams.value.red)
      this.updateTeam(state.teams.blue, this.teams.value.blue)
    }

    this.config.value.turn = state.turn
    this.config.value.first = state.first

    for (let i = 0; i < state.cards.length; ++i) {
      const card = this.board.value[i]
      if (state.cards[i].revealed) {
        card.setRevealed(state.cards[i].revealed)
      }
      card.refreshClassName()
    }

    this.refreshTeams()
  }

  /**
   * Attempts to host a new game and attempts to join otherwise.
   */
  attemptHostGame () {
    const self = this

    // Use the /:{code} to attempt a new WebRTC connection
    this.peer = new Peer(this.peerID, {
      host: 'play.mena.dance',
      port: 443,
      secure: true,
      path: '/peerjs'
    })

    // If we are unable to host, then attempt to join the game instead
    this.peer.on('error', () => {
      self.hosting.value = false
      self.joinGame()
    })

    // Great, this is an available connection. Start a new game.
    this.peer.on('open', id => {
      self.notifySuccess(`Hosting a new game with id ${self.peerID}`)
      self.hosting.value = true
      self.newGame()
    })

    // If a peer connects, then we need to handle dispatching new data to them
    const peerInterval = {}
    this.peer.on('connection', (conn) => {
      // On initializing we will send a brand new state, since we are host and god
      const connID = conn.peer
      const connPlayer = connID

      conn.on('open', () => {
        conn.outOfDate = true
        self.#connections.push(conn)
        self.sendNewState(conn)
        self.notifySuccess(`${connPlayer} connected.`)

        // Aggressively send out delta states to the player when they get out of date
        peerInterval[connID] = setInterval(() => {
          if (!conn.outOfDate) {
            return
          }

          if (conn.newGame) {
            self.sendNewState(conn)
          } else {
            self.sendDeltaState(conn)
          }

          conn.outOfDate = false
        }, 250)
      })

      conn.on('close', () => {
        self.notify(`${connPlayer} disconnected.`)
        if (connID in peerInterval) {
          clearInterval(peerInterval[connID])
          delete peerInterval[connID]
        }
      })

      conn.on('error', () => {
        if (connID in peerInterval) {
          clearInterval(peerInterval[connID])
          delete peerInterval[connID]
        }
      })

      // If the client is sending us data, then we need to dispatch it to the other players
      conn.on('data', data => {
        self.updateDeltaState(data)
        self.#connections.forEach(other => {
          if (other.peer === conn.peer) {
            return
          }
          other.outOfDate = true
        })
      })
    })
  }

  /**
   * Attempts to join an existing game
   */
  joinGame () {
    const self = this
    let connInterval = null

    // Create a new WebRTC connection with no preset ID (as we are a client)
    const peer = new Peer(null, {
      host: 'play.mena.dance',
      port: 443,
      secure: true,
      path: '/peerjs'
    })

    peer.on('disconnected', () => {
      self.notifyError('Lost the connection to the host. Reconnecting.')
      if (connInterval) {
        clearInterval(connInterval)
      }
      peer.destroy()
      setTimeout(() => { self.joinGame() }, 500)
    })

    peer.on('open', connID => {
      // We were able to open a new connection, now attempt to find the host
      // based on the /:code from the routed path
      const conn = peer.connect(self.peerID)
      self.notifyWarning(`Connecting to the server at ${self.peerID}`)
      conn.on('open', () => {
        conn.outOfDate = false
        self.#connections.push(conn)
        self.notifySuccess(`Connected to the server at ${self.peerID}`)

        // Aggressively try to get the host of out of a stale state
        connInterval = setInterval(() => {
          if (conn.outOfDate) {
            self.sendNewState(conn)
            conn.outOfDate = false
          }
        }, 250)
      })

      // Host wants us to update, so we need to handle a medley of state changes
      conn.on('data', data => {
        self.updateState(data)
      })

      conn.on('error', () => {
        peer.destroy()
      })
    })
  }

  /**
   * Invalidate any connection that exists between this client and others.
   */
  invalidateConnections (mode) {
    const newGame = mode?.newGame === true
    this.#connections.forEach(conn => {
      conn.outOfDate = true
      conn.newGame = newGame
    })
  }

  /**
   * The player is trying to reveal a card, so we give them a buffer in case
   * it is a mistake. If the player holds down long enough, then we reveal the
   * card and invalid the state of all the connections so data can be moved.
   * @param {Card} card - The card we are trying to reveal
   */
  startRevealCounter (card, $e) {
    const cfg = this.config.value
    const player = cfg.player

    $e.preventDefault()

    if (player.isSpy) {
      return false
    }

    // Card is already revealed
    if (card.revealed.value) {
      return false
    }

    // We are already holding down the mouse
    if (this.#mouseDownIntervalId) {
      return false
    }

    this.#mouseDownIntervalId = true

    // Attempt to sample at 10ms intervals until we are past our threshold
    const start = new Date()
    const config = this.config.value
    card.progress.value = 0
    this.#mouseDownIntervalId = setInterval(() => {
      if (card.progress.value >= 1.0) {
        clearInterval(this.#mouseDownIntervalId)
        this.revealCard(card)
        return
      }
      const diff = ((new Date()) - start) / 1000.0
      card.progress.value = Math.max(0, Math.min((diff / config.revealTimeSec), 1.0))
    }, 25)

    return true
  }

  /**
   * Reveal a card on the board and give points to the current player
   * @param {Card} card - Card to reveal on the board
   */
  revealCard (card) {
    const group = card.group.value
    card.setRevealed(true)

    if (group === 'assassin') {
      const cfg = this.config.value
      const winners = this.teams.value[{
        red: 'blue',
        blue: 'red'
      }[cfg.turn]]
      winners.wins = true
      this.refreshTeams()
    } else {
      const team = this.teams.value[group]
      if (team) {
        ++team.cardsFound
        this.refreshTeams()
      }
    }

    this.invalidateConnections()
  }

  revealAllCards () {
    this.board.value.forEach(card => {
      card.setRevealed(true)
    })
  }

  /**
   * Player has released the mouse button, so cancel the timer, but not the reveal state.
   * @param {Card} card - The card we were revealing
   */
  stopRevealCounter (card) {
    clearInterval(this.#mouseDownIntervalId)
    card.progress.value = 0
    this.#mouseDownIntervalId = null
  }

  /**
   * Randomly select an element from an array
   * @param {Array} arr - Array to randomly select from
   */
  static choice (arr) {
    return arr[Math.floor(Math.random() * arr.length)].toLowerCase()
  }

  /**
   * Constructs a new Deck from combining existing decks
   * @param {Array} whichDecks - List of Deck names to merge into a super deck
   */
  static buildDeck (whichDecks) {
    const deck = new Deck(whichDecks.join(', '), [])

    DECKS.forEach(available => {
      if (whichDecks.indexOf(available.name) >= 0) {
        deck.addDeck(available)
      }
    })

    if (deck.empty()) {
      deck.addDeck(DECKS[0])
    }

    return deck
  }

  resetTeam (team) {
    team.cardsFound = 0
    team.cardsTotal = 8
    team.wins = false
  }

  /**
   * Start fresh. Retrieve a new set of cards.
   */
  newGame () {
    const config = this.config.value
    const agentCards = config.agentCards

    // Build a brand new composite deck
    const deck = Game.buildDeck(config.decks)

    // Reset the board for new cards
    this.board.value = []

    // Randomly decide who goes first
    config.first = Game.choice(['red', 'blue'])
    config.turn = config.first

    // Remove spymaster from all players
    if (config.player.role.value === 'spymaster') {
      config.player.role = { label: 'Player', value: 'player' }
      config.player.isSpy = false
    }

    this.resetTeam(this.teams.value.red)
    this.resetTeam(this.teams.value.blue)

    // Iterate through each of the agent classes so we sample per class
    for (const agent in agentCards) {
      let count = agentCards[agent]

      // Player who goes first gets one additional card
      if (agent === config.first) {
        count += 1
      }

      const team = this.teams.value[agent]
      if (team) {
        team.cardsTotal = count
      }

      // Add cards from the deck and put them on the board
      for (const card of deck.draw(count)) {
        this.board.value.push(new Card(this.config, card, agent))
      }
    }

    // Shuffle the board cards to emulate drawing a configuration
    Deck.shuffle(this.board.value)

    // Invalidate all known connections, so that they get brand new cards.
    this.refreshTeams()
    this.invalidateConnections({ newGame: true })

    // Refresh the board given the player's settings
    this.board.value.forEach(card => {
      card.refreshClassName()
    })
  }

  /**
   * Refresh metadata about the teams
   */
  refreshTeams () {
    const teams = this.teams.value
    for (const key in teams) {
      const team = teams[key]
      team.label = `${team.name} - ${team.cardsFound} / ${team.cardsTotal}`

      if (team.wins || team.cardsFound === team.cardsTotal) {
        team.label = `${team.name} WINS`
        team.wins = true
      }
    }
  }

  /**
   * Binds a function to send notifications to
   */
  bindNotifier (notifier) {
    this.notifier = notifier
  }

  /**
   * Sends a message to the player if the notifier system is available
   * @param {String} msg - Send this to the player
   */
  notify (msg) {
    if (this.notifier) {
      this.notifier(msg)
    }
  }

  /**
   * Save the user's profile and push it to other players
   */
  saveProfile () {
    const teams = this.teams.value
    const cfg = this.config.value
    const player = cfg.player

    // Remove the player from both teams
    delete teams.red.players[player.id]
    delete teams.blue.players[player.id]

    // Add the player to the new team
    teams[player.team.value][player.id] = player

    // Refresh team information
    this.refreshTeams()

    player.isSpy = false
    player.isChooser = false

    if (player.role.value === 'spymaster') {
      player.isSpy = true
    } else if (player.role.value === 'chooser') {
      player.isChooser = true
    }

    // Refresh the board given the player's settings
    this.board.value.forEach(card => {
      card.refreshClassName()
    })
  }
}

export default {
  name: 'Game',

  props: ['code'],

  setup (initProps, setupContext) {
    const notifier = setupContext.root.$q.notify

    const G = new Game(initProps.code)
    G.bindNotifier(notifier)

    const fullURL = computed(() => {
      return window.location.href
    })

    // If the user preference dialog should be shown
    const showUserDialog = ref(false)
    const showNewGameDialog = ref(false)
    const showHelpDialog = ref(false)
    const helpTab = ref('intro')
    const gameTab = ref('board')
    const splitterModel = ref(20)

    return { G, showUserDialog, showNewGameDialog, showHelpDialog, splitterModel, gameTab, helpTab, fullURL }
  }
}
