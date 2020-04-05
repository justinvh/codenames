<template>
  <q-page class="flex flex-center">
    <!-- Portal to update the title with help, settings, new game, etc -->
    <portal to="menu">
      <q-btn @click="() => { showHelpDialog = true }" flat round dense icon="help" />
      <q-btn @click="() => { showUserDialog = true }" flat round dense icon="settings" />
      <q-btn @click="() => { showNewGameDialog = true }" v-if="G.hosting.value" flat round dense icon="fiber_new" />
    </portal>

    <!-- Main page -->
    <q-card class="gameTabs no-margin">

      <!-- Tabs show which team is currently active -->
      <q-tabs
        v-model="G.config.value.turn"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
        @click="G.switchTeams()"
      >
        <q-tab
          name="red"
          :label="G.teams.value.red.label"
          :class="{ redTeam: true, turn: (G.config.value.turn === 'red'), wins: G.teams.value.red.wins }"
        />
        <q-tab
          name="blue"
          :label="G.teams.value.blue.label"
          :class="{ blueTeam: true, turn: (G.config.value.turn === 'blue'), wins: G.teams.value.blue.wins }"
        />
      </q-tabs>

      <q-separator />

      <div class="board">
        <div class="fit row wrap justify-start items-start content-start">
          <div
            v-for="card of G.board.value"
            :key="card.name.value"
            style="width: 20%; height: 20%; position: relative"
          >
            <!-- Well, this is nonsense, but handling mouse/touch events is dumb -->
            <div
              @mousedown="G.startRevealCounter(card, $event)"
              @mouseleave="G.stopRevealCounter(card)"
              @mouseup="G.stopRevealCounter(card)"
              @touchstart="G.startRevealCounter(card, $event)"
              @touchend="G.stopRevealCounter(card)"
              @touchcancel="G.stopRevealCounter(card)"
              :key="card.revealed.value"
              :class="card.className.value"
              style="cursor: pointer; width: 99%; height: 98%; margin: 1%;"
            >
              <!-- Idea here is to show a progress bar to the user as they are clicking a card -->
              <q-linear-progress
                v-if="card.progress.value > 0"
                :key="card.progress.value"
                dark
                :value="card.progress.value"
                size="25px"
                :color="G.config.value.turn === 'blue' ? 'blue' : 'red'"
              />

              <!-- The SVG usage here is a trick for maintaining clear fonts regardless of resolution -->
              <div v-if="card.imageURL.value" class="card-image">
                <img :src="card.imageURL.value" />
              </div>
              <div v-else class="card-text">
                <svg viewBox="0 0 100 50">
                  <text
                    dominant-baseline="middle"
                    text-anchor="middle"
                    x="50%"
                    y="50%"
                    fill="white"
                  >{{ card.name.value }}</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialog for showing user preferences -->
    <q-dialog v-model="showUserDialog" persistent>
      <q-card style="min-width: 250px">
        <q-card-section>
          <div v-if="G.hosting.value">
            <q-input label="Tell players to join this URL" dense :value="fullURL" readonly />
          </div>
          <div v-else class="text-h6">Welcome, player!</div>
        </q-card-section>

        <!-- Player options -->
        <q-card-section class="q-pt-none">
          <q-input label="Call me" dense v-model="G.config.value.player.name" autofocus />
          <q-select
            label="Are you a SPYMASTER?"
            :options='[{ label: "No", value: "player" }, { label: "Yes", value: "spymaster" }]'
            v-model="G.config.value.player.role"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            flat
            class="bg-secondary text-white"
            label="Save"
            v-close-popup
            @click="G.saveProfile()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog for showing help dialog -->
    <q-dialog v-model="showHelpDialog" persistent>
      <q-card style="min-width: 250px">
        <q-card-section>
          <q-banner class="bg-primary text-white">Getting Started</q-banner>
          <div>
            <ol>
              <li>If you are the host, share this page's URL with other players.</li>
              <li>Each player will choose a name and join a team.</li>
              <li>After all players have joined, the host can assign Spymasters.</li>
              <li>The game will decide randomly who goes first. That team will have one additional card.</li>
              <li>The team on the key card light takes the first turn.</li>
              <li>Any player on the team can select a card, but it is best to select a player as the card flipper.</li>
            </ol>
          </div>

          <q-banner class="bg-primary text-white">Winning the Game</q-banner>
          <div>
            The team that contacts all their agents first wins, but:
            <ol>
              <li>The team that played first needs to contact one more agent than the other team: 9 instead of 8 agents.</li>
              <li>If you contact the Assassin, you immediately lose!</li>
            </ol>
          </div>

          <q-banner class="bg-primary text-white">Taking Your Turn</q-banner>
          <div>
            <ol>
              <li>
                The spymaster gives a clue to their team that relates to some of the codenames matching their team on
                the key card.
                <strong>The clue must be one word only, plus the number of words to guess.</strong>
                <ul>
                  <li>
                    For example, a good clue for AMAZON, BED, and MOUTH would be
                    <em>RIVER 3</em>
                  </li>
                  <li>The word must not be any of the words currently visible on the codename grid.</li>
                  <li>The number must relate only to the number of words they want their team to guess.</li>
                  <li>You can relate as few or as many words as you want.</li>
                  <li>The spymaster cannot give any other clues, VERBAL or NON-VERBAL.</li>
                </ul>
              </li>
              <li>
                The rest of the team discusses which codenames to guess and
                <strong>touches the card until it flips</strong>.
                <ol>
                  <li>The team must guess at least once, up to the number the codemaster said plus one.</li>
                  <li>
                    When the team guesses a word, the card will be colored based on the agent, bystander, or assassin
                    card.
                  </li>
                  <li>If the team guessed correctly, they can keep guessing until they run out of guesses.</li>
                  <li>If the team guessed incorrectly, their turn ends.</li>
                </ol>
              </li>
              <li>Play passes to the other team.</li>
            </ol>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            class="bg-secondary text-white"
            label="Got it."
            color="primary"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog to show to the user when they start a new game -->
    <q-dialog
      v-model="showNewGameDialog"
      cancel
      persistent
      title="Confirm"
      message="Start a new game?"
    >
      <q-card style="min-width: 250px">
        <q-card-section>
          <div>
            <q-select
              filled
              v-model="G.config.value.decks"
              :options="G.config.value.deckOptions"
              label="Which decks?"
              multiple
              emit-value
              map-options
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                  <q-item-section>
                    <q-item-label v-html="scope.opt.label"></q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle v-model="G.config.value.decks" :val="scope.opt.value" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat class="bg-red text-white" label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            class="bg-secondary text-white"
            label="Let's do it"
            color="primary"
            @click="G.newGame()"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style src="./Game.css"></style>
<script src="./Game.js"></script>
