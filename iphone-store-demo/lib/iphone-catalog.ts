// Catalog used by the demo iPhone store. The same data is mirrored in
// architecture/seed_iphone.sql so a fresh database can be seeded with SQL.
export const IPHONE_IMAGE = "/iphone.svg";

export interface IphoneCategorySeed {
  name: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export interface IphoneProductSeed {
  categorySlug: string;
  name: string;
  name_en: string;
  slug: string;
  sku: string;
  price: number;
  sale_price: number | null;
  stock: number;
  description: string;
  description_en: string;
  image_url: string;
}

interface SeriesConfig {
  name: string;
  slug: string;
  basePrice: number;
  variants: Array<{ key: string; name: string; priceDelta: number }>;
}

const STEEL_BLUE_VARIANTS = [
  { key: "standard", name: "iPhone 13", priceDelta: 0 },
  { key: "mini", name: "iPhone 13 mini", priceDelta: -1_000_000 },
  { key: "pro", name: "iPhone 13 Pro", priceDelta: 4_000_000 },
  { key: "pro-max", name: "iPhone 13 Pro Max", priceDelta: 7_000_000 },
];

const SERIES: SeriesConfig[] = [
  {
    name: "iPhone 13",
    slug: "iphone-13",
    basePrice: 14_990_000,
    variants: STEEL_BLUE_VARIANTS,
  },
  {
    name: "iPhone 14",
    slug: "iphone-14",
    basePrice: 16_990_000,
    variants: [
      { key: "standard", name: "iPhone 14", priceDelta: 0 },
      { key: "plus", name: "iPhone 14 Plus", priceDelta: 3_000_000 },
      { key: "pro", name: "iPhone 14 Pro", priceDelta: 6_000_000 },
      { key: "pro-max", name: "iPhone 14 Pro Max", priceDelta: 9_000_000 },
    ],
  },
  {
    name: "iPhone 15",
    slug: "iphone-15",
    basePrice: 19_990_000,
    variants: [
      { key: "standard", name: "iPhone 15", priceDelta: 0 },
      { key: "plus", name: "iPhone 15 Plus", priceDelta: 3_000_000 },
      { key: "pro", name: "iPhone 15 Pro", priceDelta: 7_000_000 },
      { key: "pro-max", name: "iPhone 15 Pro Max", priceDelta: 10_000_000 },
    ],
  },
  {
    name: "iPhone 16",
    slug: "iphone-16",
    basePrice: 22_990_000,
    variants: [
      { key: "standard", name: "iPhone 16", priceDelta: 0 },
      { key: "plus", name: "iPhone 16 Plus", priceDelta: 3_000_000 },
      { key: "pro", name: "iPhone 16 Pro", priceDelta: 7_000_000 },
      { key: "pro-max", name: "iPhone 16 Pro Max", priceDelta: 11_000_000 },
    ],
  },
  {
    name: "iPhone 17",
    slug: "iphone-17",
    basePrice: 25_990_000,
    variants: [
      { key: "standard", name: "iPhone 17", priceDelta: 0 },
      { key: "plus", name: "iPhone 17 Plus", priceDelta: 3_000_000 },
      { key: "pro", name: "iPhone 17 Pro", priceDelta: 8_000_000 },
      { key: "pro-max", name: "iPhone 17 Pro Max", priceDelta: 12_000_000 },
    ],
  },
  {
    name: "iPhone 18",
    slug: "iphone-18",
    basePrice: 28_990_000,
    variants: [
      { key: "standard", name: "iPhone 18", priceDelta: 0 },
      { key: "plus", name: "iPhone 18 Plus", priceDelta: 3_000_000 },
      { key: "pro", name: "iPhone 18 Pro", priceDelta: 8_000_000 },
      { key: "pro-max", name: "iPhone 18 Pro Max", priceDelta: 13_000_000 },
    ],
  },
];

export const IPHONE_CATEGORIES: IphoneCategorySeed[] = SERIES.map(
  (series, index) => ({
    name: series.name,
    name_en: series.name,
    slug: series.slug,
    sort_order: index + 1,
  }),
);

export const IPHONE_PRODUCTS: IphoneProductSeed[] = SERIES.flatMap(
  (series, seriesIndex) =>
    series.variants.map((variant, variantIndex) => {
      const index = seriesIndex * 4 + variantIndex + 1;
      const price = series.basePrice + variant.priceDelta;
      return {
        categorySlug: series.slug,
        name: variant.name,
        name_en: variant.name,
        slug:
          variant.key === "standard"
            ? series.slug
            : `${series.slug}-${variant.key}`,
        sku: `IPHONE-${String(index).padStart(3, "0")}`,
        price,
        sale_price: index % 3 === 0 ? price - 500_000 : null,
        stock: 20 + ((index * 7) % 30),
        description: `${variant.name} chính hãng, bảo hành 12 tháng. Dung lượng 128GB, nhiều màu sắc để lựa chọn.`,
        description_en: `${variant.name} — 128GB, official 12-month warranty.`,
        image_url: IPHONE_IMAGE,
      };
    }),
);
