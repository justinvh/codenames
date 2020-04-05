import { ref } from '@vue/composition-api'

export default class Card {
  // A pretty name that is shown to the player
  name = ref('')

  // What group this card belongs to (red, blue, etc)
  group = ref('')

  // How progress has occured for the reveal
  progress = ref(0)

  // Whether the card has been revealed to the player
  revealed = ref(false)

  // If set, then use an image instead of text
  imageURL = ref(null)

  // What CSS class names should be used when rendering
  className = ref({})

  constructor (config, name, group) {
    this.config = config
    this.name.value = name
    this.group.value = group
  }

  /**
   * Serialize a delta representation of this object
   */
  toDeltaObject () {
    return {
      revealed: this.revealed.value
    }
  }

  /**
   * Serialize a new representation of this object
   */
  toNewObject () {
    return {
      name: this.name.value,
      group: this.group.value,
      revealed: this.revealed.value,
      className: this.className.value
    }
  }

  /**
   * Set whether the card should be revealed
   * @param {boolean} state - True if the card is revealed
   */
  setRevealed (state) {
    this.revealed.value = state
    this.progress.value = 0
    this.className.value = this.getCardClass()
  }

  /**
   * Force re-evaluation of the current object's classname
   */
  refreshClassName () {
    this.className.value = this.getCardClass()
  }

  /**
   * Use the Bing Image API to find an image
   */
  asImage () {
    // Add your Bing Search V7 subscription key and endpoint to your environment variables.
    const self = this
    const subscriptionKey = this.config.value.bing?.subscriptionKey
    let endpoint = this.config.value.bing?.endpoint

    const query = this.name.value
    const mkt = 'en-US'

    const qs = new URLSearchParams(Object.entries({ q: query, mkt: mkt })).toString()
    endpoint += `?${qs}`

    fetch(endpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      },
      json: true
    }).then(response => {
      return response.json()
    }).then(data => {
      self.imageURL.value = data.value[0].contentUrl
    })
  }

  /**
   * Retrieves the expected CSS class names for the card
   * @returns {Object} Represents which classes are on or off
   */
  getCardClass () {
    const group = this.group.value
    const classes = { spy: false }
    const player = this.config.value.player
    if (this.revealed.value) {
      classes[group] = true
    } else if (player.isSpy) {
      classes[group] = true
      classes.spy = true
    } else {
      classes.blank = true
    }
    return classes
  }
}
