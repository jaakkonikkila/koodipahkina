require("dotenv").config();

const BASE_URL = "https://koodipahkina.monad.fi/api";
const TOKEN = process.env.API_TOKEN;

// Funktio pelin luomiseen
async function createGame() {
  const response = await fetch(`${BASE_URL}/game`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      "Error creating game:",
      response.status,
      await response.text()
    );
    return null;
  }

  const data = await response.json();
  console.log("Pelin alkaa!\n");
  return data;
}

// Funktio pelaajan toiminnan suorittamiseen, joka printtaa myös pelin tilanteen
async function performAction(gameId, takeCard) {
  const response = await fetch(`${BASE_URL}/game/${gameId}/action`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ takeCard }),
  });

  if (!response.ok) {
    console.error(
      "Error performing action:",
      response.status,
      await response.text()
    );
    return null;
  }

  const data = await response.json();
  console.log(`\nPelin status:`);
  console.log(`  Kortti: ${data.status.card}`);
  console.log(`  Raha: ${data.status.money}`);
  console.log(`  Kortteja jäjellä: ${data.status.cardsLeft}`);
  data.status.players.forEach((player) => {
    console.log(`  ${player.name}:`);
    console.log(`    Rahat: ${player.money}`);
    console.log(`    Kortit: ${JSON.stringify(player.cards)}`);
  });

  return data.status;
}

module.exports = { createGame, performAction };
