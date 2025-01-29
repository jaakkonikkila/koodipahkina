const { createGame, performAction } = require("./api");


// Funktio, joka tarkistaa, onko kortti osa jotain korttiriviä
function isPartOfSequence(card, cardRows) {
  return cardRows.some(
    (row) => row.includes(card - 1) || row.includes(card + 1)
  );
}

/*  
  Bottistrategia: Alustavasti korttien ottamista vältetään.

  Kortti nostetaan seuraavissa tilanteissa:
  - Jos ei ole rahaa, kortti on pakko ottaa.
  - Jos kortin ja pöydällä olevien kolikoiden erotus on alle 9, kortti otetaan.
  - Jos oma rahaa on alle 6, kortti on alle 15 ja pöydällä yli 4 kolikkoa, kortti otetaan.
  - Jos kortti on alle 25, pöydällä on yli 6 rahaa ja jäljellä olevia kortteja yli 15, kortti otetaan.

  Tilanne, jossa kortti sopii omaan korttiriviin:
  - Koitetaan saada lisää rahaa tai pakotetaan vastustaja ottamaan kortti, joka ei sovi hänen korttiriviinsä.

  Loppupeli (kun kortteja on jäljellä alle 5):
  - Jos omia kolikoita on enemmän kuin jäljellä olevia kortteja, korttia ei oteta.
*/
async function playGame() {
  const { status, gameId } = await createGame();
  if (!gameId) {
    console.error("Pelin luominen epäonnistui");
    return;
  }

  let gameFinished = false;
  let currentStatus = status;

  // Pelataan kunnes peli on ohitse
  while (!gameFinished) {
    // Alustava valinta on olla ottamatta korttia
    let takeCard = false;

    const currentCard = currentStatus.card;
    const coinsOnCard = currentStatus.money;
    const myData = currentStatus.players.find(
      (player) => player.name === "jaakkonikkila"
    );
    const myCoins = myData.money;
    const myCardRows = myData.cards;
    const cardsLeft = currentStatus.cardsLeft;

    // Etsi muut pelaajat
    const otherPlayers = currentStatus.players.filter(
      (player) => player.name !== "jaakkonikkila"
    );

    // Jos kolikoita ei ole, kortti on pakko ottaa
    if (myCoins === 0) {
      takeCard = true;
      console.log(
        `Ei kolikoita, pakko ottaa kortti ${currentCard}. Pöydällä ${coinsOnCard} kolikkoa.`
      );
    } else {
      // Tarkista, kuuluuko kortti omaan korttiriviin
      const fitsMySequence = isPartOfSequence(currentCard, myCardRows);

      if (fitsMySequence) {
        // Lasketaan onko vastustajilla vähän rahaa
        const opponentsLowOnCoins = otherPlayers.every(
          (player) => player.money > 2
        );

        // Jos vastustajilla vähän rahaa ja kortin ja kolikoiden erotus yli 13, ei oteta korttia
        if (
          opponentsLowOnCoins &&
          currentCard - coinsOnCard > 13 &&
          myCoins > 2
        ) {
          takeCard = false;
          console.log(
            `Kaikilla vastustajilla vähän rahaa, ei oteta korttia ${currentCard}, vaikka se sopii korttijonoon. Pöydällä ${coinsOnCard} kolikkoa.`
          );
        }

        // Jos Rahaa pöydällä yli 2, kuuluu omaan korttiriviin ja kortti alle 20, kortti otetaan
        if (coinsOnCard > 2 && currentCard < 20) {
          takeCard = true;
          console.log(
            `Kortti ${currentCard} kuuluu omaan korttiriviin ja pöydällä ${coinsOnCard} kolikkoa. Kortti otetaan.`
          );
        } else {
          // Jos kortti on osa omaa korttiriviä, tarkistetaan sopiiko kortti muiden korttiriveihin
          const cardFitsOthers = otherPlayers.some((player) =>
            isPartOfSequence(currentCard, player.cards)
          );

          // Jos sopii muiden riveihin niin kortti otetaan
          if (cardFitsOthers) {
            takeCard = true;
            console.log(
              `Kortti ${currentCard} sopii vastustajien korttiriveihin, otetaan.`
            );
          } else {
            // Jos kortti ei sovi muiden riveihin, tarkistetaan onko kortti iso
            if (currentCard > 22) {
              takeCard = false;
              console.log(
                `Iso kortti ${currentCard} ja pöydällä ${coinsOnCard} kolikkoa, ei oteta, toivotaan lisää rahaa.`
              );
            } else {
              takeCard = true;
              console.log(
                `Kortti ${currentCard} kuuluu omaan korttiriviin ja pöydällä ${coinsOnCard} kolikkoa. Kortti otetaan.`
              );
            }
          }
        }
      }

      // Jos pöydällä yli 6 rahaa, ja pelattavia kortteja paljon, alle 25 kortti otetaan
      if (coinsOnCard > 6 && cardsLeft > 15 && currentCard < 25) {
        takeCard = true;
        console.log(
          `Pöydällä ${coinsOnCard} kolikkoa ja ${cardsLeft} korttia jäljellä. Kortti ${currentCard} otetaan.`
        );
      }

      // Jos alle 6 kolikkoa ja kortti alle 15 ja kolikoita pöydällä yli 4, kortti otetaan
      if (myCoins < 6 && currentCard < 15 && coinsOnCard > 4) {
        takeCard = true;
        console.log(
          `Vähän kolikoita (${myCoins}), kortti ${currentCard} otetaan koska pöydällä ${coinsOnCard} kolikkoa.`
        );
      }

      // Jos kortin ja kolikkojen erotus vähemmän kuin 9 ja kolikoita pöydällä, kortti otetaan
      if (coinsOnCard > 0 && currentCard - coinsOnCard <= 8) {
        takeCard = true;
        console.log(
          `Kortin ${currentCard} ja kolikoiden (${coinsOnCard}) ero vähemmän kuin 9, kortti otetaan.`
        );
      }

      // Jos kolikoita enemmän kuin kortteja jäljellä ja kortteja jäljellä alle 5, korttia ei oteta
      if (myCoins > cardsLeft && cardsLeft < 5) {
        takeCard = false;
        console.log(
          `Liikaa kolikoita (${myCoins}) verrattuna jäljellä oleviin kortteihin (${cardsLeft}). Korttia ei oteta.`
        );
      }
    }
    currentStatus = await performAction(gameId, takeCard);
    gameFinished = currentStatus.finished;
  }

  console.log("Peli päättyi!\n");

  // Pisteiden laskenta
  const scores = currentStatus.players.map((player) => {
    let cardPoints = player.cards.reduce(
      (sum, row) => sum + Math.min(...row),
      0
    );
    let totalScore = cardPoints - player.money;

    return {
      name: player.name,
      money: player.money,
      cardPoints: cardPoints,
      totalScore: totalScore,
    };
  });

  console.log("Lopulliset pisteet:");
  scores.forEach((player) => {
    console.log(
      `   ${player.name}: Korttipisteet: ${
        player.cardPoints
      }, Rahamiinukset: ${-player.money}, Kokonaispisteet: ${player.totalScore}`
    );
  });
}

// Funktio, joka pelaa useamman pelin
async function playMultipleGames() {
  for (let i = 0; i < 9; i++) {
    console.log(`Peli ${i + 1} alkaa... \n`);
    await playGame();
    console.log(`Peli ${i + 1} päättyi.\n`);
  }
}

// Käynnistä usean pelin pelisarja
//playMultipleGames();

// Käynnistä peli kerran
playGame();
