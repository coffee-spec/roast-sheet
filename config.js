// Nostalgica Roast Sheet — settings. Edit these numbers, then redeploy the web folder.
(function (root) {
  const CONFIG = {
    // How far back to look for open orders (counted from the start of today).
    lookbackDays: 7,

    // Batch size (green lb) and moisture loss per coffee type.
    batches: {
      blend: { label: "Blend", greenLb: 16, moistureLoss: 0.13 },
      so: { label: "Single origin", greenLb: 10, moistureLoss: 0.12 },
    },

    // Subscription variants use short names. Map them to the real product title.
    aliases: {
      "Equinox": "Equinox Espresso",
      "Equinox Espresso": "Equinox Espresso",
      "Noxturnal": "Noxturnal Decaf",
    },

    // Fallback type for coffees that only show up inside subscriptions.
    // Regular products are classified from their "Blend" / "Single Origin" tag.
    knownTypes: {
      "Paper Route": "blend",
      "Equinox Espresso": "blend",
      "Berry Fight": "blend",
      "Cold Brew Blend": "blend",
      "Noxturnal Decaf": "so",
    },

    // Post-roast blends: components are roasted separately, then mixed by batch ratio.
    // batches = how many batches of that component go into one full mix.
    blendRecipes: {
      "Equinox Espresso": [
        { name: "Colombia / Guatemala", batches: 2 },
        { name: "Ethiopia", batches: 1 },
      ],
      "Paper Route": [
        { name: "Colombia / Guatemala", batches: 1 },
        { name: "Ethiopia natural", batches: 1 },
      ],
    },

    // Name used for single-origin subscriptions where the roaster picks the coffee.
    soPickName: "Single-origin subscription (roaster's pick)",

    // Fulfillment statuses that mean "still needs roasting/bagging".
    // READY_FOR_PICKUP is left out on purpose: those bags are already packed.
    activeStatuses: ["UNFULFILLED", "PARTIALLY_FULFILLED", "IN_PROGRESS", "ON_HOLD", "PENDING_FULFILLMENT", "OPEN"],

    apiVersion: "2026-10",
    maxPages: 10, // 100 orders per page
  };
  if (typeof module !== "undefined") module.exports = CONFIG;
  else root.ROAST_CONFIG = CONFIG;
})(this);
