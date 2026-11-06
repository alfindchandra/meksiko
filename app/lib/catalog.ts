import type { Product } from './sales';

export type Outlet = { id: string; name: string; city?: string };

export const OUTLETS: Outlet[] = [
    {
        "id":  "outlet-01",
        "name":  "DANDER 2",
    },
    {
        "id":  "outlet-02",
        "name":  "GAYAM",
    },
    {
        "id":  "outlet-03",
        "name":  "TAMBAKREJO 2",
    },
    {
        "id":  "outlet-04",
        "name":  "KASIMAN",
    },
    {
        "id":  "outlet-05",
        "name":  "BALEN",
    },
    {
        "id":  "outlet-06",
        "name":  "SUMBEREJO",
    },
    {
        "id":  "outlet-07",
        "name":  "BORNO",
    },
    {
        "id":  "outlet-08",
        "name":  "NGRAHO 2",
    },
    {
        "id":  "outlet-09",
        "name":  "DANDER 1",
    },
    {
        "id":  "outlet-10",
        "name":  "KALITIDU",
    },
    {
        "id":  "outlet-11",
        "name":  "NGASEM",
    },
    {
        "id":  "outlet-12",
        "name":  "SUGIHWARAS",
    },
    {
        "id":  "outlet-13",
        "name":  "BUBULAN",
    },
    {
        "id":  "outlet-14",
        "name":  "SUKOSEWU",
    },
    {
        "id":  "outlet-15",
        "name":  "TAMBAKREJO",
    },
    {
        "id":  "outlet-16",
        "name":  "TEMAYANG",
    },
    {
        "id":  "outlet-17",
        "name":  "KANOR",
    },
    {
        "id":  "outlet-18",
        "name":  "KUNCI",
    },
    {
        "id":  "outlet-19",
        "name":  "KEDUNGADEM",
    },
    {
        "id":  "outlet-20",
        "name":  "BALEN 3",
    },
    {
        "id":  "outlet-21",
        "name":  "PADANGAN",
    },
    {
        "id":  "outlet-22",
        "name":  "PADANGAN 2",
    },
    {
        "id":  "outlet-23",
        "name":  "KAPAS",
    },
    {
        "id":  "outlet-24",
        "name":  "MALO",
    },
    {
        "id":  "outlet-25",
        "name":  "BORNO 2",
    },
    {
        "id":  "outlet-26",
        "name":  "KALITIDU 2",
    },
    {
        "id":  "outlet-27",
        "name":  "BALEN 2",
    },
    {
        "id":  "outlet-28",
        "name":  "SUKOSEWU 2",
    },
    {
        "id":  "outlet-29",
        "name":  "NGRAHO",
    },
    {
        "id":  "outlet-30",
        "name":  "PURWOSARI",
    },
    {
        "id":  "outlet-31",
        "name":  "TEMAYANG 2",
    },
    {
        "id":  "outlet-32",
        "name":  "KAPAS 2 PLESUNGAN",
    },
    {
        "id":  "outlet-33",
        "name":  "TAMBAKREJO 3 TAJI",
    },
    {
        "id":  "outlet-34",
        "name":  "KANOR 2",
    },
    {
        "id":  "outlet-35",
        "name":  "NGAMBON",
    },
    {
        "id":  "outlet-36",
        "name":  "KALITIDU 3 PUMPUNGAN",
    },
    {
        "id":  "outlet-37",
        "name":  "KEPOHBARU",
    },
    {
        "id":  "outlet-38",
        "name":  "MARGOMULYO",
    }
];

export const PRODUCTS: Product[] = [
    {
        "id":  "product-001",
        "name":  "Bintang Beer (620 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  50000
                      }
                  ]
    },
    {
        "id":  "product-002",
        "name":  "Bintang Redler Lemon (330 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  30000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  320000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  600000
                      }
                  ]
    },
    {
        "id":  "product-003",
        "name":  "Singaraja Beer (330 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  40000
                      }
                  ]
    },
    {
        "id":  "product-004",
        "name":  "Singaraja Jeruk Madu (330 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  25000
                      }
                  ]
    },
    {
        "id":  "product-005",
        "name":  "Draft Beer (620 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  45000
                      }
                  ]
    },
    {
        "id":  "product-006",
        "name":  "Black Panther (330 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  35000
                      }
                  ]
    },
    {
        "id":  "product-007",
        "name":  "Guinness Beer (325 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  40000
                      }
                  ]
    },
    {
        "id":  "product-008",
        "name":  "Konig Ludwig Dunkle (330 ml)",
        "category":  "BEER",
        "unit":  "BTL",
        "emoji":  "🍺",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  30000
                      }
                  ]
    },
    {
        "id":  "product-009",
        "name":  "Anggur Merah (AK) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  70000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  820000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  780000
                      }
                  ]
    },
    {
        "id":  "product-010",
        "name":  "Anggur Hijau (AK) (650 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  75000
                      }
                  ]
    },
    {
        "id":  "product-011",
        "name":  "Anggur Hijau (API) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  88000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  510000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  990000
                      }
                  ]
    },
    {
        "id":  "product-012",
        "name":  "Anggur Kolesom (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  78000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  410000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  780000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  735000
                      }
                  ]
    },
    {
        "id":  "product-013",
        "name":  "Anggur Putih (OT) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  73000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  420000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  790000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  740000
                      }
                  ]
    },
    {
        "id":  "product-014",
        "name":  "Anggur Merah (OT) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  77000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  820000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  780000
                      }
                  ]
    },
    {
        "id":  "product-015",
        "name":  "Anggur Merah Gold (OT) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  87000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  820000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  780000
                      }
                  ]
    },
    {
        "id":  "product-016",
        "name":  "Kawa Kawa Hijau (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  90000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  540000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  1025000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  920000
                      }
                  ]
    },
    {
        "id":  "product-017",
        "name":  "Kawa Kawa Merah (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  460000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  860000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  800000
                      }
                  ]
    },
    {
        "id":  "product-018",
        "name":  "Kawa Kawa Blackcurrant (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  480000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  920000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  840000
                      }
                  ]
    },
    {
        "id":  "product-019",
        "name":  "Arcadia Black Pink (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      }
                  ]
    },
    {
        "id":  "product-020",
        "name":  "Balega Black Tea (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  78000
                      }
                  ]
    },
    {
        "id":  "product-021",
        "name":  "Alexis Blackcurrant (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  78000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  450000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  850000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  810000
                      }
                  ]
    },
    {
        "id":  "product-022",
        "name":  "Alexis Hijau (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  500000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  960000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  875000
                      }
                  ]
    },
    {
        "id":  "product-023",
        "name":  "Alexis Merah (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  77000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  830000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  790000
                      }
                  ]
    },
    {
        "id":  "product-024",
        "name":  "Alexis Anggur Leci (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  82000
                      }
                  ]
    },
    {
        "id":  "product-025",
        "name":  "Atlas (All Varian) (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  860000
                      }
                  ]
    },
    {
        "id":  "product-026",
        "name":  "Anggur Q\u0027ro Hijau (650 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      }
                  ]
    },
    {
        "id":  "product-027",
        "name":  "Anggur Q\u0027ro Avici (650 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      }
                  ]
    },
    {
        "id":  "product-028",
        "name":  "New Port Blue / Yellow (620 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  77000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  840000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  780000
                      }
                  ]
    },
    {
        "id":  "product-029",
        "name":  "Menjangan Anggur Hijau (600 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  75000
                      }
                  ]
    },
    {
        "id":  "product-030",
        "name":  "Joker Blackcurrant (600 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  75000
                      }
                  ]
    },
    {
        "id":  "product-031",
        "name":  "Joker Fruit Punch (600 ml)",
        "category":  "ANGGUR",
        "unit":  "BTL",
        "emoji":  "🍷",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      }
                  ]
    },
    {
        "id":  "product-032",
        "name":  "Iceland Original Kecil (500 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  150000
                      }
                  ]
    },
    {
        "id":  "product-033",
        "name":  "Iceland Original Besar (700 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  200000
                      }
                  ]
    },
    {
        "id":  "product-034",
        "name":  "Iceland Orange Kecil (500 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  160000
                      }
                  ]
    },
    {
        "id":  "product-035",
        "name":  "Iceland Orange Besar (700 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  217000
                      }
                  ]
    },
    {
        "id":  "product-036",
        "name":  "Iceland Mix All Varian (275 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  30000
                      }
                  ]
    },
    {
        "id":  "product-037",
        "name":  "Alpin Swift (700 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  295000
                      }
                  ]
    },
    {
        "id":  "product-038",
        "name":  "Topi Miring Jnever Besar (1 L)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  130000
                      }
                  ]
    },
    {
        "id":  "product-039",
        "name":  "Black White Vodka (500 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  148000
                      }
                  ]
    },
    {
        "id":  "product-040",
        "name":  "Topi Miring Vodka Besar (1 L)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  130000
                      }
                  ]
    },
    {
        "id":  "product-041",
        "name":  "Sicario Blackcurrant (750 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  335000
                      }
                  ]
    },
    {
        "id":  "product-042",
        "name":  "Mansion House (350 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  115000
                      }
                  ]
    },
    {
        "id":  "product-043",
        "name":  "Paloma (1 L)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  115000
                      }
                  ]
    },
    {
        "id":  "product-044",
        "name":  "All Varian Magnus (600 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  95000
                      }
                  ]
    },
    {
        "id":  "product-045",
        "name":  "Friendship B. Tea Vodka (650 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  85000
                      }
                  ]
    },
    {
        "id":  "product-046",
        "name":  "Mc Donald Vodka Mix (1 L)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  120000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  700000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  1370000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  1250000
                      }
                  ]
    },
    {
        "id":  "product-047",
        "name":  "Newport Golden (1 L)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  120000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  650000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  1300000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  1150000
                      }
                  ]
    },
    {
        "id":  "product-048",
        "name":  "Smirnoff Green Apple (700 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  310000
                      }
                  ]
    },
    {
        "id":  "product-049",
        "name":  "Smirnoff Pink (700 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  310000
                      }
                  ]
    },
    {
        "id":  "product-050",
        "name":  "Bronson Vodka (650 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  180000
                      }
                  ]
    },
    {
        "id":  "product-051",
        "name":  "Paloma Mix Fruit (1000 ml)",
        "category":  "VODKA",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  120000
                      }
                  ]
    },
    {
        "id":  "product-052",
        "name":  "Glenkenny (700 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  350000
                      }
                  ]
    },
    {
        "id":  "product-053",
        "name":  "Manta Gold (700 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  330000
                      }
                  ]
    },
    {
        "id":  "product-054",
        "name":  "Manta Dark (700 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  330000
                      }
                  ]
    },
    {
        "id":  "product-055",
        "name":  "Drum Whisky (350 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  115000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  325000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  1100000
                      }
                  ]
    },
    {
        "id":  "product-056",
        "name":  "Drum Whisky (700 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  220000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  325000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  1100000
                      }
                  ]
    },
    {
        "id":  "product-057",
        "name":  "Dome Whisky (700 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  220000
                      }
                  ]
    },
    {
        "id":  "product-058",
        "name":  "Red Royal Brewhouse (350 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  145000
                      }
                  ]
    },
    {
        "id":  "product-059",
        "name":  "Green Royal Brewhouse (350 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  145000
                      }
                  ]
    },
    {
        "id":  "product-060",
        "name":  "Mansion House Whisky (350 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  120000
                      }
                  ]
    },
    {
        "id":  "product-061",
        "name":  "Bronson Whisky (650 ml)",
        "category":  "WHISKY",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  180000
                      }
                  ]
    },
    {
        "id":  "product-062",
        "name":  "Bae Soju Original (360 ml)",
        "category":  "SOJU",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  75000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  360000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  670000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  630000
                      }
                  ]
    },
    {
        "id":  "product-063",
        "name":  "Bae Soju Lychee (360 ml)",
        "category":  "SOJU",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      }
                  ]
    },
    {
        "id":  "product-064",
        "name":  "Bae Soju Yuzu (360 ml)",
        "category":  "SOJU",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      }
                  ]
    },
    {
        "id":  "product-065",
        "name":  "Bae Soju Muscat (360 ml)",
        "category":  "SOJU",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  80000
                      }
                  ]
    },
    {
        "id":  "product-066",
        "name":  "Cheosnun All Varian (360 ml)",
        "category":  "SOJU",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  70000
                      }
                  ]
    },
    {
        "id":  "product-067",
        "name":  "Captain Morgan Rum (750 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  335000
                      }
                  ]
    },
    {
        "id":  "product-068",
        "name":  "Captain Morgan Black (700 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  410000
                      }
                  ]
    },
    {
        "id":  "product-069",
        "name":  "Captain Sliced Apple (700 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  165000
                      }
                  ]
    },
    {
        "id":  "product-070",
        "name":  "Captain Sliced Apple (200 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  55000
                      }
                  ]
    },
    {
        "id":  "product-071",
        "name":  "Black \u0026 White Rum (700 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  350000
                      }
                  ]
    },
    {
        "id":  "product-072",
        "name":  "Red Horse Rum (500 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  200000
                      }
                  ]
    },
    {
        "id":  "product-073",
        "name":  "Uncle Hook (700 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  300000
                      }
                  ]
    },
    {
        "id":  "product-074",
        "name":  "Saccharum (700 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  325000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  900000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  3350000
                      }
                  ]
    },
    {
        "id":  "product-075",
        "name":  "Bacardi Rum Besar (750 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  320000
                      }
                  ]
    },
    {
        "id":  "product-076",
        "name":  "Bacardi Spiced Rum (180 ml)",
        "category":  "RUM",
        "unit":  "BTL",
        "emoji":  "🥃",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  100000
                      }
                  ]
    },
    {
        "id":  "product-077",
        "name":  "Vibe Black Tea (700 ml)",
        "category":  "LIQUOR",
        "unit":  "BTL",
        "emoji":  "🍸",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  345000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  1025000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  3900000
                      }
                  ]
    },
    {
        "id":  "product-078",
        "name":  "Vibe Exoticn Lychee (700 ml)",
        "category":  "LIQUOR",
        "unit":  "BTL",
        "emoji":  "🍸",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  345000
                      }
                  ]
    },
    {
        "id":  "product-079",
        "name":  "Rockstar Lychee (700 ml)",
        "category":  "LIQUOR",
        "unit":  "BTL",
        "emoji":  "🍸",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  295000
                      }
                  ]
    },
    {
        "id":  "product-080",
        "name":  "Congyang Orang Tua (330 ml)",
        "category":  "CONGYANG",
        "unit":  "BTL",
        "emoji":  "🍶",
        "tiers":  [
                      {
                          "id":  "bottle",
                          "label":  "1 BTL",
                          "price":  40000
                      },
                      {
                          "id":  "half-umum",
                          "label":  "1/2 CTN UMUM",
                          "price":  440000
                      },
                      {
                          "id":  "crate-umum",
                          "label":  "1 CTN UMUM",
                          "price":  880000
                      },
                      {
                          "id":  "crate-cafe",
                          "label":  "1 CTN CAFE",
                          "price":  840000
                      }
                  ]
    }
];
