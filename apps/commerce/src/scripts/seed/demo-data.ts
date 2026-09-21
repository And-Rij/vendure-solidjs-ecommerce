export const demoProduct = {
  slug: "polonyna-trek",
  name: "Полонина Trek",
  description: "Двомісний туристичний намет для походів і кемпінгу.",
  options: [
    {
      code: "capacity",
      name: "Місткість",
      optionCode: "2-person",
      optionName: "2 особи",
    },
    {
      code: "color",
      name: "Колір",
      optionCode: "forest",
      optionName: "Forest",
    },
  ],
  variant: {
    sku: "KG-TENT-POL-2P-FST",
    name: "Полонина Trek 2 особи Forest",
    priceWithTax: 899_900,
    initialStockOnHand: 12,
  },
} as const;
