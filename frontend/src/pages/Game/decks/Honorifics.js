import Deck from './Deck.js'

export default () => {
  return new Deck('Honorifics', [
    { prefix: 'Mr. ' },
    { prefix: 'Ms. ' },
    { prefix: 'Miss ' },
    { prefix: 'Mrs. ' },
    { prefix: 'Mx. ' },
    { prefix: 'Master' },
    { prefix: 'Sir ' },
    { prefix: 'Gentleman ' },
    { prefix: 'Sire ' },
    { prefix: 'Mistress ' },
    { prefix: 'Slayer ' },
    { suffix: ' First of His Name, Ruler of the Free Land' },
    { suffix: ' First of Her Name, Ruler of the Free Land' },
    { prefix: 'The Honorable ' },
    { prefix: 'The Right Honorable ' },
    { prefix: 'The Most Honorable ' },
    { suffix: ', his Excellency' },
    { suffix: ', her Excellency' },
    { prefix: 'Madam ' },
    { prefix: 'Dame ' },
    { prefix: 'Lord ' },
    { prefix: 'Lady ' },
    { prefix: 'Dr. ' },
    { prefix: 'Prof. ' },
    { prefix: 'Br. ' },
    { prefix: 'Sr. ' },
    { prefix: 'Fr. ' },
    { prefix: 'Rev. ' },
    { prefix: 'Pr. ' },
    { prefix: 'Elder ' },
    { suffix: '-sama' },
    { suffix: '-san' },
    { suffix: '-chan' },
    { suffix: '-kun' },
    { suffix: '-bō' }
  ])
}
