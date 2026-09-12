import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { cdnImageUrl } from "../../common/observability";

type ChatTurn = { role: "user" | "assistant"; content: string };

type ProductHit = {
  name: string;
  slug: string;
  store: string;
  image: string | null;
  priceFrom: number;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async reply(message: string, history: ChatTurn[] = []) {
    const text = message.trim();
    const lower = text.toLowerCase();
    const budgetRs = this.parseBudgetRs(lower);
    const animal = this.detectAnimal(lower);

    if (process.env.OPENAI_API_KEY) {
      try {
        const ai = await this.openAiReply(text, history, budgetRs, animal);
        if (ai) {
          return {
            reply: ai,
            source: "openai" as const,
            suggestions: this.suggestions(budgetRs, animal),
            budgetRs: budgetRs ?? undefined,
          };
        }
      } catch {
        /* fall through */
      }
    }

    const local = await this.localReply(lower, text, budgetRs, animal);
    return {
      ...local,
      source: "pawmarket" as const,
      suggestions: this.suggestions(budgetRs, animal),
      budgetRs: budgetRs ?? undefined,
    };
  }

  private suggestions(budgetRs?: number | null, animal?: string | null) {
    if (budgetRs) {
      const label = this.formatRs(budgetRs);
      return [
        `Food under ${label}`,
        `Dogs under ${label}`,
        `Pets under ${label}`,
        "Cat rakhne ke liye kya chahiye?",
      ];
    }
    return [
      "Cat rakhne ke liye kya chahiye?",
      "Dog starter kit total?",
      "Hamster ke liye kya kharidna?",
      "Food under 5,000",
    ];
  }

  /** Parse PKR budget from Urdu/English chat text. Returns rupees (not paisas). */
  private parseBudgetRs(lower: string): number | null {
    let m = lower.match(/(\d+(?:\.\d+)?)\s*(lac|lakh|لاکھ)/i);
    if (m) return Math.round(parseFloat(m[1]) * 100_000);

    m = lower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (m) return Math.round(parseFloat(m[1]) * 1000);

    m = lower.match(/(\d+(?:\.\d+)?)\s*(hazar|hazār|thousand|ہزار)/i);
    if (m) return Math.round(parseFloat(m[1]) * 1000);

    m = lower.match(/(?:budget|under|upto|up to|max|maximum|within|se kam|tak|se neeche)\s*:?\s*rs\.?\s*([\d,]+)/i);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);

    m = lower.match(/(?:budget|under|upto|up to|max|within)\s*:?\s*([\d,]+)/i);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (n >= 500) return n;
    }

    m = lower.match(/(?:rs\.?|pkr|rupees?)\s*([\d,]+)/i);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);

    m = lower.match(/\b([\d,]+)\s*(?:rs|pkr|rupees?)\b/i);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);

    return null;
  }

  private detectAnimal(lower: string): string | null {
    const animalMap: [string, string][] = [
      ["gulabi", "Goats"],
      ["bakra", "Goats"],
      ["bakri", "Goats"],
      ["goat", "Goats"],
      ["puppy", "Dogs"],
      ["dog", "Dogs"],
      ["kitten", "Cats"],
      ["cat", "Cats"],
      ["macaw", "Birds"],
      ["parrot", "Birds"],
      ["bird", "Birds"],
      ["turtle", "Fish"],
      ["aquarium", "Fish"],
      ["fish", "Fish"],
      ["rabbit", "Rabbits"],
      ["hamster", "Hamsters"],
      ["chameleon", "Reptiles"],
      ["lizard", "Reptiles"],
      ["girgit", "Reptiles"],
      ["reptile", "Reptiles"],
      ["aseel", "Hens"],
      ["murgi", "Hens"],
      ["chicken", "Hens"],
      ["hen", "Hens"],
      ["calf", "Cows"],
      ["cow", "Cows"],
    ];
    for (const [key, animal] of animalMap) {
      if (lower.includes(key)) return animal;
    }
    return null;
  }

  private formatRs(rs: number) {
    return `Rs ${rs.toLocaleString("en-PK")}`;
  }

  private shopLink(budgetRs?: number | null, animal?: string | null) {
    const qs = new URLSearchParams();
    if (animal) qs.set("animal", animal);
    if (budgetRs) qs.set("maxPrice", String(budgetRs * 100)); // paisas
    const q = qs.toString();
    return q ? `/shop?${q}` : "/shop";
  }

  private async localReply(
    lower: string,
    original: string,
    budgetRs: number | null,
    animal: string | null,
  ) {
    if (/^(hi|hello|salam|assalam|hey|hola)\b/.test(lower)) {
      return {
        reply:
          "Assalam o Alaikum! Budget bataein (e.g. `budget 5000`) — ya poochhein: “cat rakhne ke liye kya chahiye?” / “dog starter kit total?” — main checklist + total cost bataunga.",
      };
    }

    if (/login|password|demo|credential|admin|sign in/.test(lower)) {
      return {
        reply:
          "Demo logins (password sab ke liye `Password123!`):\n• Admin — admin@pawmarket.local\n• Customer — customer@pawmarket.local\n• Vendor — vendor.a@pawmarket.local\n\nSign in: /login",
      };
    }

    if (/vendor|sell|store open|bechn/.test(lower)) {
      return {
        reply:
          "Vendor banne ke liye /sell open karein. Demo vendor: vendor.a@pawmarket.local / Password123!",
      };
    }

    if (/ship|deliver|return|refund|payment|jazzcash|easypaisa|checkout/.test(lower)) {
      return {
        reply:
          "Checkout pe JazzCash / EasyPaisa options (demo). Details: /pages/shipping · /pages/returns",
      };
    }

    // Starter kit / "kya kharidna padega" + total
    const wantsStarter =
      /kya\s*(kharid|chahiye|len|rakhe)|kitna\s*total|starter\s*kit|care\s*kit|essentials|rakhne\s*ke\s*liye|rakhunga|rakhna|adopt|new pet|pehli\s*dafa|beginner|setup|kitne\s*(lagenge|lagen|honge)/.test(
        lower,
      ) ||
      (/total|checklist|shopping\s*list|need\s*to\s*buy|what\s*do\s*i\s*need/.test(lower) && Boolean(animal));

    if (wantsStarter || (animal && /kya|kitna|chahiye|kharid/.test(lower))) {
      const pet = animal ?? this.detectAnimal(lower);
      if (!pet) {
        return {
          reply:
            "Kaunsa pet rakhna hai? Cat, Dog, Hamster, Parrot/Birds, Fish, Rabbit, Hens, Goat, Cow, ya Reptiles — bataein, main checklist + total cost nikaal dunga.",
        };
      }
      return this.buildStarterKit(pet, budgetRs);
    }

    // Budget-first shopping
    const wantsFood = /\b(food|feed|kibble|flake|hay|millet|pellet|mash|seed mix|treats?)\b/.test(lower);

    if (budgetRs || /budget|under|upto|sasta|cheap|affordable|kam price|mere paas/.test(lower)) {
      const cap = budgetRs ?? 10_000;
      const hits = await this.findProducts({
        q: animal || wantsFood ? undefined : this.searchQuery(original, lower),
        animal: animal ?? undefined,
        maxRs: cap,
        foodOnly: wantsFood,
        take: 8,
      });
      const finalHits =
        hits.length > 0
          ? hits
          : await this.findProducts({
              animal: animal ?? undefined,
              maxRs: cap,
              foodOnly: wantsFood,
              take: 8,
            });

      if (!finalHits.length) {
        return {
          reply: `${this.formatRs(cap)} budget${wantsFood ? " (food)" : ""}${animal ? ` (${animal})` : ""} mein koi matching product nahi mila. Budget thora barhaein ya /shop pe filters try karein: ${this.shopLink(cap, animal)}`,
        };
      }

      return {
        reply: `${this.formatRs(cap)} budget${wantsFood ? " · food" : ""}${animal ? ` · ${animal}` : ""} ke mutabiq yeh options hain (saste pehle):\n${finalHits
          .map((p) => `• ${p.name} — ${this.formatRs(p.priceFrom / 100)} → /products/${p.slug}`)
          .join("\n")}\n\nPoori filtered shop: ${this.shopLink(cap, animal)}`,
        products: finalHits,
      };
    }

    if (animal) {
      const hits = await this.findProducts({ q: original, animal, take: 5 });
      if (hits.length) {
        return {
          reply: `${animal} ke popular items — budget bataoge to aur tight shortlist milay gi:\n${hits
            .map((p) => `• ${p.name} — ${this.formatRs(p.priceFrom / 100)}`)
            .join("\n")}\n\n${this.shopLink(null, animal)}`,
          products: hits,
        };
      }
    }

    const products = await this.findProducts({ q: original, take: 5 });
    if (products.length) {
      return {
        reply: `Related products:\n${products
          .map((p) => `• ${p.name} — ${this.formatRs(p.priceFrom / 100)} → /products/${p.slug}`)
          .join("\n")}\n\nBudget ke sath poocho jaise: “dogs under 15000”.`,
        products,
      };
    }

    return {
      reply:
        "Do options:\n1) Budget: `food under 5000`\n2) Starter kit: `cat rakhne ke liye kya chahiye?` — checklist + total cost.\nShop: /shop",
    };
  }

  /** Recommended shopping list slots per animal type */
  private starterSlots(animal: string): { label: string; queries: string[] }[] {
    const map: Record<string, { label: string; queries: string[] }[]> = {
      Dogs: [
        { label: "Food", queries: ["kibble", "dog food", "puppy"] },
        { label: "Treats", queries: ["treat", "training bites"] },
        { label: "Collar / leash", queries: ["collar", "leash", "harness"] },
        { label: "Bed / house", queries: ["bed", "dog house", "kennel"] },
        { label: "Toy", queries: ["toy", "rope tug"] },
        { label: "Grooming", queries: ["brush", "slicker"] },
      ],
      Cats: [
        { label: "Food", queries: ["cat food", "kibble", "mousse"] },
        { label: "Toy", queries: ["catnip", "mouse", "toy"] },
        { label: "Perch / tree", queries: ["perch", "cat tree", "cat house"] },
        { label: "Care pack", queries: ["care essentials", "cat care"] },
      ],
      Birds: [
        { label: "Food", queries: ["bird food", "millet", "seed", "parrot pellet"] },
        { label: "Cage / house", queries: ["cage", "parrot house", "flight"] },
        { label: "Toy", queries: ["foraging", "toy"] },
        { label: "Care pack", queries: ["bird care"] },
      ],
      Fish: [
        { label: "Food", queries: ["flake", "fish food", "tropical"] },
        { label: "Aquarium", queries: ["aquarium kit", "nano cube", "aquarium suite", "aquarium"] },
        { label: "Filter", queries: ["canister filter", "filter mini"] },
        { label: "Care pack", queries: ["fish care"] },
      ],
      Rabbits: [
        { label: "Food / hay", queries: ["hay", "rabbit food", "pellet"] },
        { label: "Hutch", queries: ["hutch", "rabbit"] },
        { label: "Care pack", queries: ["rabbit care"] },
      ],
      Hamsters: [
        { label: "Food", queries: ["hamster food", "mix"] },
        { label: "Habitat", queries: ["hamster habitat", "tunnel", "hide"] },
        { label: "Care pack", queries: ["hamster care"] },
      ],
      Hens: [
        { label: "Feed", queries: ["hen food", "layer", "chick", "mash"] },
        { label: "Cage", queries: ["hen cage", "poultry"] },
      ],
      Goats: [
        { label: "Feed", queries: ["goat feed", "goat food"] },
      ],
      Cows: [
        { label: "Feed", queries: ["cattle feed", "cow food"] },
      ],
      Reptiles: [
        { label: "Terrarium", queries: ["terrarium", "desert"] },
        { label: "Lamp", queries: ["basking", "uvb", "lamp"] },
        { label: "Pet", queries: ["chameleon", "lizard"] },
        { label: "Care pack", queries: ["reptile care"] },
      ],
    };
    return map[animal] ?? [{ label: "Popular", queries: [animal.toLowerCase()] }];
  }

  private async buildStarterKit(animal: string, budgetRs: number | null) {
    const slots = this.starterSlots(animal);
    const picked: ProductHit[] = [];
    const lines: string[] = [];
    let totalPaisas = 0;
    const used = new Set<string>();

    for (const slot of slots) {
      let best: ProductHit | null = null;
      for (const q of slot.queries) {
        const hits = await this.findProducts({
          q,
          animal,
          maxRs: budgetRs ?? undefined,
          take: 3,
        });
        const hit = hits.find((h) => !used.has(h.slug)) ?? null;
        if (hit) {
          best = hit;
          break;
        }
      }
      // Fallback: any product for animal under budget
      if (!best) {
        const fallback = await this.findProducts({
          animal,
          maxRs: budgetRs ?? undefined,
          take: 8,
        });
        best = fallback.find((h) => !used.has(h.slug)) ?? null;
      }
      if (!best) {
        lines.push(`• ${slot.label}: abhi stock shortlist mein nahi mila`);
        continue;
      }
      used.add(best.slug);
      picked.push(best);
      totalPaisas += best.priceFrom;
      lines.push(`• ${slot.label}: ${best.name} — ${this.formatRs(best.priceFrom / 100)}`);
    }

    if (!picked.length) {
      return {
        reply: `${animal} ke liye starter items abhi filter se nahi mile. Shop dekhein: ${this.shopLink(budgetRs, animal)}`,
      };
    }

    const budgetNote = budgetRs
      ? `\nBudget cap: ${this.formatRs(budgetRs)}${totalPaisas / 100 > budgetRs ? " (kuch items budget se upar ho sakte hain — list saste se choose ki)" : " ke andar fit."}`
      : "\nBudget bataoge to isi list ko us limit ke andar tight kar dunga.";

    return {
      reply: `${animal} rakhne ke liye yeh kharidna padega:\n${lines.join("\n")}\n\nEstimated total: ${this.formatRs(totalPaisas / 100)}${budgetNote}\n\nShop: ${this.shopLink(budgetRs, animal)}`,
      products: picked,
      starterTotalRs: Math.round(totalPaisas / 100),
    };
  }

  private searchQuery(original: string, lower: string) {
    const stop = new Set([
      "budget",
      "under",
      "upto",
      "max",
      "rs",
      "pkr",
      "rupees",
      "hazar",
      "lac",
      "lakh",
      "thousand",
      "cheap",
      "sasta",
      "please",
      "show",
      "me",
      "mere",
      "paas",
      "for",
      "the",
      "and",
      "with",
    ]);
    const tokens = original
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stop.has(t) && !/^\d+$/.test(t));
    return tokens[0];
  }

  private async findProducts(opts: {
    q?: string;
    animal?: string;
    maxRs?: number;
    foodOnly?: boolean;
    take?: number;
  }): Promise<ProductHit[]> {
    const take = opts.take ?? 5;
    const maxPaisas = opts.maxRs != null ? opts.maxRs * 100 : undefined;

    const where: Prisma.ProductWhereInput = {
      visibility: "PUBLISHED",
      approvalStatus: "APPROVED",
      deletedAt: null,
      ...(opts.animal ? { animalType: opts.animal } : {}),
      ...(opts.foodOnly
        ? {
            OR: [
              { category: { slug: { endsWith: "-food" } } },
              { category: { slug: "pet-food" } },
              { tags: { contains: "food", mode: "insensitive" } },
              { tags: { contains: "feed", mode: "insensitive" } },
              { name: { contains: "food", mode: "insensitive" } },
              { name: { contains: "feed", mode: "insensitive" } },
              { name: { contains: "kibble", mode: "insensitive" } },
              { name: { contains: "flake", mode: "insensitive" } },
            ],
          }
        : {}),
      ...(opts.q && !opts.foodOnly
        ? {
            OR: [
              { name: { contains: opts.q, mode: "insensitive" } },
              { tags: { contains: opts.q, mode: "insensitive" } },
              { shortDescription: { contains: opts.q, mode: "insensitive" } },
              { brand: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(maxPaisas != null
        ? {
            variants: {
              some: {
                OR: [{ salePrice: { lte: maxPaisas } }, { price: { lte: maxPaisas } }],
              },
            },
          }
        : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      take: Math.max(take * 3, 12),
      orderBy: { soldCount: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        store: true,
        variants: true,
      },
    });

    const mapped = products
      .map((p) => {
        const prices = p.variants
          .map((v) => v.salePrice ?? v.price)
          .filter((price) => (maxPaisas != null ? price <= maxPaisas : true));
        if (!prices.length) return null;
        return {
          name: p.name,
          slug: p.slug,
          store: p.store.name,
          image: cdnImageUrl(p.images[0]?.url ?? null),
          priceFrom: Math.min(...prices),
        };
      })
      .filter((p): p is ProductHit => p != null)
      .sort((a, b) => a.priceFrom - b.priceFrom)
      .slice(0, take);

    return mapped;
  }

  private async openAiReply(
    message: string,
    history: ChatTurn[],
    budgetRs: number | null,
    animal: string | null,
  ) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;

    const system = `You are PawMarket AI for a Pakistan pet marketplace (prices in PKR). Always respect the user's budget when recommending. Prefer cheaper options first. Suggest /shop?animal=Dogs&maxPrice=PAISAS links (maxPrice is paisas = rupees*100). Be concise, Urdu/English mix ok. Detected budgetRs=${budgetRs ?? "none"}, animal=${animal ?? "none"}. Never invent order IDs.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  }
}
