export const minikitConfig = {
  accountAssociation: {
    // leave empty until you paste the signed values later
    header: "",
    payload: "",
    signature: "",
  },

  miniapp: {
    version: "1",
    name: "DopeWars on Base",
    subtitle: "Trade, Hustle, Survive.",
    description:
      "A turn-based cyberpunk trading and survival game built fully on Base. Buy low, sell high, hustle, stash, and collect ICE.",

    iconUrl: `${ROOT_URL}/ICE.png`,
    splashImageUrl: `${ROOT_URL}/DopeWars-on-Base-spl.png`,
    splashBackgroundColor: "#050014",

    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,

    primaryCategory: "gaming",
    tags: ["game", "onchain", "roguelike", "base", "ice"],

    screenshotUrls: [`${ROOT_URL}/home.png`],
    heroImageUrl: `${ROOT_URL}/home.png`,

    tagline: "Survive 30 days. Hit 100k net worth. Earn ICE.",
    ogTitle: "DopeWars on Base",
    ogDescription:
      "A fast, addictive onchain strategy game on Base. Every choice matters.",
    ogImageUrl: `${ROOT_URL}/DopeWars-on-Base-spl.png`,
  },
} as const;
