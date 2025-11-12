/**
 * Generates a random name using adjective + noun combination
 */
export function generateRandomName(): string {
  const adjectives = [
    "Swift", "Bright", "Calm", "Bold", "Clever", "Daring", "Eager", "Fierce",
    "Gentle", "Happy", "Jolly", "Kind", "Lively", "Mighty", "Noble", "Proud",
    "Quick", "Radiant", "Silent", "Tough", "Vivid", "Wise", "Zesty", "Brave",
    "Cool", "Dazzling", "Epic", "Fancy", "Golden", "Heroic", "Jazzy", "Keen"
  ];

  const nouns = [
    "Tiger", "Eagle", "Wolf", "Lion", "Fox", "Bear", "Hawk", "Falcon",
    "Panther", "Jaguar", "Dragon", "Phoenix", "Griffin", "Raven", "Owl",
    "Shark", "Dolphin", "Stallion", "Leopard", "Cobra", "Viper", "Python",
    "Falcon", "Hawk", "Eagle", "Raven", "Owl", "Sparrow", "Robin", "Finch"
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective}${noun}${number}`;
}

