export default class Deck {
  #universe = []
  #cards = []

  constructor (name, cards) {
    this.name = name
    this.#universe = cards
    this.reset()
  }

  /**
   * Open up a new deck
   */
  reset () {
    this.#cards = Deck.shuffle([...this.#universe])
  }

  /**
   * Opens a new deck from the other set and merges it with this one
   * @note Shuffle in the other cards into the *existing* deck, don't start fresh
   * @param {Deck} other - The deck to merge with this one
   */
  addDeck (otherDeck) {
    const otherCards = otherDeck.knownCards()
    this.#universe = [...this.knownCards(), ...otherCards]
    this.#cards = Deck.shuffle([...this.#cards, ...otherCards])
  }

  /**
   * @return List of known cards to this deck
   */
  knownCards () {
    return [...this.#universe]
  }

  /**
   * @returns Number of cards that are remaining in the deck
   */
  size () {
    return this.#cards.length
  }

  /**
   * @returns True if the deck has no remaining cards
   */
  empty () {
    return this.size() === 0
  }

  /**
   * Yield n cards from the top of the shuffled deck
   * @param {int} n - Number of cards to draw
   */
  * draw (n) {
    if (n > this.size()) {
      throw new Error('Not enough cards to draw')
    }

    while (n--) {
      yield this.#cards.shift()
    }
  }

  /**
   * Draw a single card from the deck (as a non-generator)
   */
  drawOne () {
    if (this.empty()) {
      throw new Error('Not enough cards to draw')
    }

    return this.#cards.shift()
  }

  /**
   * Discard N cards from the deck if possible
   * @param {int} n - Number of cards to discard
   */
  discard (n) {
    if (n > this.size()) {
      throw new Error('Not enough cards to discard')
    }

    for (let i = 0; i < n; ++i) {
      this.#cards.shift()
    }
  }

  /**
   * Yield n cards from the top of the deck w/o removing them
   * @param {int} n - Number of cards to peek
   */
  * peek (n) {
    if (n > this.size()) {
      throw new Error('Not enough cards to peek')
    }

    for (let i = 0; i < n; ++i) {
      yield this.#cards[i]
    }
  }

  /**
   * Randomly shuffle an existing array in place
   * @static
   * @param {array} arr - Array to randomly shuffle in place
   * @return {array}
   */
  static shuffle (arr) {
    let currentIndex = arr.length
    let temporaryValue, randomIndex

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = arr[currentIndex]
      arr[currentIndex] = arr[randomIndex]
      arr[randomIndex] = temporaryValue
    }

    return arr
  }
}
