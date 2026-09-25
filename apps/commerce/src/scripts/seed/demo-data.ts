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

export const demoCategories = [
  {
    code: "tents",
    name: "Намети",
    slug: "namety",
    description: "Намети для походів і кемпінгу.",
  },
  {
    code: "sleeping-bags",
    name: "Спальники",
    slug: "spalnyky",
    description: "Спальники для різних сезонів і температур.",
  },
  {
    code: "sleeping-pads",
    name: "Килимки",
    slug: "kylymky",
    description: "Туристичні килимки для комфортного сну.",
  },
  {
    code: "daypacks",
    name: "Одноденні рюкзаки",
    slug: "odnodenni-riukzaky",
    description: "Компактні рюкзаки для коротких маршрутів.",
  },
  {
    code: "trekking-backpacks",
    name: "Трекінгові рюкзаки",
    slug: "trekinhovi-riukzaky",
    description: "Місткі рюкзаки для багатоденних походів.",
  },
  {
    code: "stoves",
    name: "Пальники",
    slug: "palnyky",
    description: "Пальники для похідної кухні.",
  },
  {
    code: "cookware",
    name: "Посуд",
    slug: "posud",
    description: "Посуд для приготування їжі в поході.",
  },
  {
    code: "lighting",
    name: "Освітлення",
    slug: "osvitlennia",
    description: "Ліхтарі та освітлення для табору.",
  },
] as const;

export const demoProducts = [
  { ...demoProduct, categoryCode: "tents" },
  {
    slug: "chornohora-base-3",
    categoryCode: "tents",
    name: "Чорногора Base 3",
    description: "Тримісний намет із двома входами для кемпінгу та походів.",
    options: [
      {
        code: "capacity",
        name: "Місткість",
        optionCode: "3-person",
        optionName: "3 особи",
      },
    ],
    variant: {
      sku: "KG-TENT-CHOR-3P",
      name: "Чорногора Base 3 особи",
      priceWithTax: 1_099_900,
      initialStockOnHand: 3,
    },
  },
  {
    slug: "svydovets-comfort-0",
    categoryCode: "sleeping-bags",
    name: "Свидовець Comfort 0",
    description:
      "Спальник із температурою комфорту 0 °C для трисезонних походів.",
    options: [
      {
        code: "length",
        name: "Довжина",
        optionCode: "regular",
        optionName: "Regular",
      },
      {
        code: "zipper",
        name: "Блискавка",
        optionCode: "left",
        optionName: "Зліва",
      },
    ],
    variant: {
      sku: "KG-BAG-SVYD-REG",
      name: "Свидовець Comfort 0 Regular, блискавка зліва",
      priceWithTax: 429_900,
      initialStockOnHand: 8,
    },
  },
  {
    slug: "petros-down-minus-5",
    categoryCode: "sleeping-bags",
    name: "Петрос Down -5",
    description: "Легкий пуховий спальник із температурою комфорту -5 °C.",
    options: [
      {
        code: "length",
        name: "Довжина",
        optionCode: "regular",
        optionName: "Regular",
      },
    ],
    variant: {
      sku: "KG-BAG-PETR-REG",
      name: "Петрос Down -5 Regular",
      priceWithTax: 749_900,
      initialStockOnHand: 0,
    },
  },
  {
    slug: "tysa-air-r5",
    categoryCode: "sleeping-pads",
    name: "Тиса Air R5",
    description: "Надувний туристичний килимок з теплоізоляцією R-value 5.",
    options: [
      {
        code: "mat-size",
        name: "Розмір килимка",
        optionCode: "regular",
        optionName: "Regular",
      },
    ],
    variant: {
      sku: "KG-MAT-TYSA-REG",
      name: "Тиса Air R5 Regular",
      priceWithTax: 329_900,
      initialStockOnHand: 15,
    },
  },
  {
    slug: "beskyd-35",
    categoryCode: "daypacks",
    name: "Бескид 35",
    description: "Рюкзак на 35 літрів із дощовиком для коротких маршрутів.",
    options: [
      {
        code: "back-size",
        name: "Розмір спинки",
        optionCode: "s-m",
        optionName: "S/M",
      },
    ],
    variant: {
      sku: "KG-PACK-BESK-35",
      name: "Бескид 35 S/M",
      priceWithTax: 459_900,
      initialStockOnHand: 5,
    },
  },
  {
    slug: "gorgany-trek-55",
    categoryCode: "trekking-backpacks",
    name: "Ґорґани Trek 55",
    description: "Трекінговий рюкзак на 55 літрів із регульованою спинкою.",
    options: [
      {
        code: "back-size",
        name: "Розмір спинки",
        optionCode: "m-l",
        optionName: "M/L",
      },
    ],
    variant: {
      sku: "KG-PACK-GORG-55",
      name: "Ґорґани Trek 55 M/L",
      priceWithTax: 629_900,
      initialStockOnHand: 2,
    },
  },
  {
    slug: "vatra-solo",
    categoryCode: "stoves",
    name: "Ватра Solo",
    description: "Компактний газовий пальник для приготування їжі в поході.",
    options: [],
    variant: {
      sku: "KG-STOVE-VATR-SOLO",
      name: "Ватра Solo",
      priceWithTax: 189_900,
      initialStockOnHand: 20,
    },
  },
  {
    slug: "cheremosh-duo",
    categoryCode: "cookware",
    name: "Черемош Duo",
    description: "Легкий набір туристичного посуду для двох людей.",
    options: [],
    variant: {
      sku: "KG-COOK-CHER-DUO",
      name: "Черемош Duo",
      priceWithTax: 159_900,
      initialStockOnHand: 7,
    },
  },
  {
    slug: "molfar-450",
    categoryCode: "lighting",
    name: "Мольфар 450",
    description: "Акумуляторний ліхтар яскравістю 450 люменів для табору.",
    options: [],
    variant: {
      sku: "KG-LIGHT-MOLF-450",
      name: "Мольфар 450",
      priceWithTax: 129_900,
      initialStockOnHand: 11,
    },
  },
] as const;
