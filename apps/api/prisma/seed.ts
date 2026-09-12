import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Local breed photos — host-relative so LAN/IP access works */
const breed = (file: string) => `/breeds/${file}`;
/** Local habitat / housing product photos — host-relative so LAN/IP access works */
const habitatImg = (file: string) => `/habitat/${file}`;

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Only verified Unsplash IDs (HEAD 200) — unique per animal so cats ≠ dogs ≠ fish
const img = {
  dogToy: u("photo-1601758228041-f3b2795255f1"),
  dogCollar: habitatImg("trail-lock-dog-collar.jpg"),
  dogBed: u("photo-1548199973-03cce0bbc87b"),
  dogHouse: habitatImg("cedar-den-dog-house.jpg"),
  dogKennel: habitatImg("insulated-kennel-lodge.jpg"),
  parrotHouse: habitatImg("macaw-manor-parrot-house.jpg"),
  parrotNest: habitatImg("ringneck-nest-house.jpg"),
  aquariumKit: habitatImg("reef-60-aquarium-kit.jpg"),
  aquariumLarge: habitatImg("coastal-120-aquarium-suite.jpg"),
  nanoAquarium: habitatImg("nano-cube-shrimp-house.jpg"),
  flightCage: habitatImg("flight-cage-compact.jpg"),
  rabbitHutch: habitatImg("garden-rabbit-hutch-house.jpg"),
  catTree: habitatImg("skyline-cat-tree-house.jpg"),
  catHouse: habitatImg("whisker-cat-house.jpg"),
  terrarium: u("photo-1504450874802-0ba2bcd9b5ae"),
  hamsterHabitat: habitatImg("tunnel-town-hamster-habitat.jpg"),
  hamsterHide: habitatImg("hamster-hideout.jpg"),
  dogCollarProduct: habitatImg("trail-lock-dog-collar.jpg"),
  dogHarness: habitatImg("y-harness-dog.jpg"),
  slickerBrush: habitatImg("slicker-brush.jpg"),
  foragingToy: habitatImg("foraging-toy.jpg"),
  handsFreeLeash: habitatImg("hands-free-leash.jpg"),
  canisterFilter: habitatImg("canister-filter-mini.jpg"),
  ropeTug: habitatImg("rope-tug.jpg"),
  catnipMouse: habitatImg("catnip-mouse-duo.jpg"),
  windowPerch: habitatImg("window-perch.jpg"),
  cloudNestBed: habitatImg("cloudnest-bed.jpg"),
  desertTerrarium: habitatImg("desert-glass-terrarium.jpg"),
  tropicalFlake: habitatImg("tropical-flake.jpg"),
  canaryMillet: habitatImg("canary-millet-mix.jpg"),
  indoorCatKibble: habitatImg("indoor-adult-cat-kibble.jpg"),
  kittenMousse: habitatImg("kitten-mousse.jpg"),
  puppyKibble: habitatImg("river-grain-puppy-kibble.jpg"),
  adultFarmBowl: habitatImg("adult-farm-bowl.jpg"),
  seniorStew: habitatImg("senior-slow-cook-stew.jpg"),
  trainingBites: habitatImg("training-bites.jpg"),
  baskingLamp: habitatImg("reptile-basking-lamp.jpg"),
  liveSyrianHamster: habitatImg("syrian-hamster.jpg"),
  liveDwarfHamsterPair: habitatImg("dwarf-hamster-pair.jpg"),
  liveHamsterBaby: habitatImg("hamster-baby.jpg"),
  liveAdultRabbit: habitatImg("adult-pet-rabbit.jpg"),
  liveAngoraRabbit: habitatImg("angora-rabbit.jpg"),
  careDog: habitatImg("dog-care-essentials-pack.jpg"),
  careCat: habitatImg("cat-care-essentials-pack.jpg"),
  careBird: habitatImg("bird-care-essentials-pack.jpg"),
  careFish: habitatImg("fish-care-essentials-pack.jpg"),
  careRabbit: habitatImg("rabbit-care-essentials-pack.jpg"),
  careHamster: habitatImg("hamster-care-essentials-pack.jpg"),
  careReptile: habitatImg("reptile-care-essentials-pack.jpg"),
  persianPunch: habitatImg("persian-punch-face-cat.jpg"),
  persianKittenPunch: habitatImg("persian-kitten-punch-face.jpg"),
  exoticPunch: habitatImg("exotic-shorthair-punch-face.jpg"),
  himalayanPunch: habitatImg("himalayan-punch-face-cat.jpg"),
  maineCoon: habitatImg("maine-coon-kitten.jpg"),
  siameseCat: habitatImg("siamese-cat.jpg"),
  ragdollCat: habitatImg("ragdoll-cat.jpg"),
  scottishFold: habitatImg("scottish-fold-kitten.jpg"),
  turtlePair: habitatImg("turtle-pair.jpg"),
  turtleBaby: habitatImg("turtle-baby.jpg"),
  turtleFood: habitatImg("turtle-food.jpg"),
  turtleAquarium: habitatImg("turtle-aquarium-kit.jpg"),
  desiHenPair: habitatImg("desi-hen-pair.jpg"),
  desiChicks: habitatImg("desi-chicks.jpg"),
  aseelHenPair: habitatImg("aseel-hen-pair.jpg"),
  aseelChicks: habitatImg("aseel-chicks.jpg"),
  goatPair: habitatImg("goat-pair.jpg"),
  goatBaby: habitatImg("goat-baby.jpg"),
  gulabiGoatPair: habitatImg("gulabi-goat-pair.jpg"),
  gulabiGoatBaby: habitatImg("gulabi-goat-baby.jpg"),
  dairyCowPair: habitatImg("dairy-cow-pair.jpg"),
  dairyCowBaby: habitatImg("dairy-cow-baby.jpg"),
  goatFeed: habitatImg("goat-feed.jpg"),
  cowFeed: habitatImg("cow-cattle-feed.jpg"),
  veiledChameleon: habitatImg("veiled-chameleon.jpg"),
  henCage: habitatImg("hen-poultry-cage.jpg"),
  henFeed: habitatImg("hen-poultry-feed.jpg"),
  travelBottle: habitatImg("travel-water-bottle.jpg"),
  hamsterFood: habitatImg("hamster-food-mix.jpg"),
  rabbitPelletFood: habitatImg("rabbit-pellet-food.jpg"),
  dogWetFood: habitatImg("dog-wet-food-cans.jpg"),
  parrotPelletFood: habitatImg("parrot-pellet-food.jpg"),
  dogWalk: u("photo-1558788353-f76d92427f16"),
  dogPup: u("photo-1543466835-00a7907e9de1"),
  dogRun: u("photo-1530281700549-e82e7bf110d6"),
  dogSmile: u("photo-1477884213360-7e9d7dcc1e48"),
  dogFace: u("photo-1518717758536-85ae29035b6d"),
  dogSit: u("photo-1583511655857-d19b40a7a54e"),
  dogPlay: u("photo-1534361960057-19889db9621e"),
  dogCute: u("photo-1583511655826-05700d52f4d9"),
  // Breed-accurate local photos (apps/web/public/breeds)
  dogShepherd: breed("german-shepherd.jpg"),
  dogPitbull: breed("pitbull.jpg"),
  dogLab: breed("labrador.jpg"),
  dogPug: breed("pug.jpg"),
  dogHusky: breed("husky.jpg"),
  dogRott: breed("rottweiler.jpg"),
  dogBeagle: breed("beagle.jpg"),
  dogBulldog: breed("bulldog.jpg"),
  dogFood: breed("food-dog-kibble.jpg"),
  dogFoodWet: breed("food-dog-wet.jpg"),
  dogTreats: breed("food-dog-treats.jpg"),
  catFood: breed("food-cat-kibble.jpg"),
  catFoodWet: breed("food-cat-wet.jpg"),
  fishFood: breed("food-fish-flakes.jpg"),
  birdFood: breed("food-bird-seed.jpg"),
  rabbitHayPack: breed("food-rabbit-hay.jpg"),
  catToy: u("photo-1514888286974-6c03e2ca1dba"),
  catBed: u("photo-1573865526739-10659fec78a5"),
  catClose: u("photo-1592194996308-7b43878e84a6"),
  catStretch: u("photo-1526336024174-e58f5cdd8e13"),
  catGrey: breed("british-cat.jpg"),
  catOrange: u("photo-1571566882372-1598d88abd90"),
  catKitten: breed("persian-cat.jpg"),
  catWindow: u("photo-1472491235688-bdc81a63246e"),
  catGlasses: u("photo-1533738363-b7f9aef128ce"),
  fishTank: u("photo-1522069169874-c58ec4b76be5"),
  fishSchool: breed("food-fish-flakes.jpg"),
  fishCoral: u("photo-1524704654690-b56c05c78a00"),
  birdPerch: breed("food-bird-seed.jpg"),
  birdFly: u("photo-1552728089-57bdde30beb3"),
  birdColor: u("photo-1544923408-75c5cef46f14"),
  birdMacaw: breed("macaw.jpg"),
  birdMacawScarlet: breed("macaw.jpg"),
  birdMacawPair: breed("macaw-pair.jpg"),
  birdMacawBaby: breed("macaw-baby.jpg"),
  birdGreen: breed("ringneck.jpg"),
  birdRingneck: breed("ringneck.jpg"),
  birdPahari: breed("pahari-tota.jpg"),
  birdLovebird: breed("lovebird.jpg"),
  birdCockatiel: breed("cockatiel.jpg"),
  birdAfricanGrey: breed("african-grey.jpg"),
  birdAlexandrine: breed("alexandrine.jpg"),
  fishGold: breed("goldfish.jpg"),
  fishBetta: breed("betta.jpg"),
  fishGuppy: breed("guppy.jpg"),
  fishMolly: breed("molly.jpg"),
  fishAngel: breed("angelfish.jpg"),
  fishOscar: breed("oscar.jpg"),
  fishFlowerhorn: breed("flowerhorn.jpg"),
  rabbitAdult: breed("rabbit-adult.jpg"),
  rabbitBabies: breed("rabbit-babies.jpg"),
  rabbitPair: breed("rabbit-pair.jpg"),
  hamsterSolo: breed("hamster.jpg"),
  hamsterPair: breed("hamster-pair.jpg"),
  rabbit: breed("rabbit-adult.jpg"),
  rabbitHay: breed("food-rabbit-hay.jpg"),
  hamster: breed("hamster.jpg"),
  reptile: u("photo-1504450874802-0ba2bcd9b5ae"),
  reptile2: u("photo-1551986782-d0169b3f8fa7"),
  store: u("photo-1601758228041-f3b2795255f1", 1400),
  // aliases for older catalog rows
  toy: u("photo-1601758228041-f3b2795255f1"),
  collar: habitatImg("trail-lock-dog-collar.jpg"),
  bed: u("photo-1548199973-03cce0bbc87b"),
  fish: breed("goldfish.jpg"),
  bird: breed("macaw.jpg"),
};

const animalCatalog: Record<
  string,
  { categorySlug: string; images: string[]; brand: string; storeSlug: string; careImage: string }
> = {
  Dogs: {
    categorySlug: "dog-food",
    images: [img.dogFood, img.dogFoodWet, img.dogTreats],
    brand: "Pawfield",
    storeSlug: "paws-provisions",
    careImage: img.careDog,
  },
  Cats: {
    categorySlug: "cat-food",
    images: [img.catFood, img.catFoodWet],
    brand: "Whiskerly",
    storeSlug: "whisker-co",
    careImage: img.careCat,
  },
  Birds: {
    categorySlug: "bird-food",
    images: [img.birdFood],
    brand: "PerchSong",
    storeSlug: "feathered-friends",
    careImage: img.careBird,
  },
  Fish: {
    categorySlug: "fish-food",
    images: [img.fishFood],
    brand: "AquaNest",
    storeSlug: "aquanest",
    careImage: img.careFish,
  },
  Rabbits: {
    categorySlug: "rabbits",
    images: [img.rabbitAdult, img.rabbitBabies, img.rabbitPair],
    brand: "Burrow Pets PK",
    storeSlug: "whisker-co",
    careImage: img.careRabbit,
  },
  Hamsters: {
    categorySlug: "hamsters",
    images: [img.hamsterSolo, img.hamsterPair],
    brand: "Burrow Pets PK",
    storeSlug: "whisker-co",
    careImage: img.careHamster,
  },
  Reptiles: {
    categorySlug: "habitat",
    images: [img.reptile, img.reptile2],
    brand: "SunRock",
    storeSlug: "aquanest",
    careImage: img.careReptile,
  },
};

type CatalogItem = {
  name: string;
  brand: string;
  animal: string;
  categorySlug: string;
  storeSlug: string;
  short: string;
  description: string;
  tags: string;
  image: string;
  variants: { name: string; price: number; salePrice?: number; sku: string; onHand: number }[];
};

/** Demo USD-cent amounts → PKR paisas (Rs X.XX). $12.99 → Rs 1,299 */
const pkr = (amount: number) => amount * 100;

async function main() {
  await prisma.experimentAssignment.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.vendorSubscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.commissionSetting.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.vendorOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.vendorStaff.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.vendorPayoutMethod.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const roles = await Promise.all(
    [
      ["admin", "Admin"],
      ["vendor_owner", "Vendor owner"],
      ["vendor_staff", "Vendor staff"],
      ["customer", "Customer"],
    ].map(([slug, name]) => prisma.role.create({ data: { slug, name } })),
  );
  const role = (slug: string) => roles.find((r) => r.slug === slug)!;
  const hash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@pawmarket.local",
      passwordHash: hash,
      firstName: "Avery",
      lastName: "Admin",
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: role("admin").id } },
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@pawmarket.local",
      passwordHash: hash,
      firstName: "Jordan",
      lastName: "Lee",
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: role("customer").id } },
      addresses: {
        create: {
          label: "Home",
          line1: "House 12, Street 7, DHA Phase 5",
          city: "Lahore",
          region: "Punjab",
          postalCode: "54000",
          country: "PK",
        },
      },
    },
  });

  const vendorUsers = await Promise.all(
    [
      ["vendor.a@pawmarket.local", "Sam", "Rivera", "Paws & Provisions"],
      ["vendor.b@pawmarket.local", "Mia", "Chen", "Whisker & Co"],
      ["vendor.c@pawmarket.local", "Noah", "Patel", "TrailTail Gear"],
      ["vendor.d@pawmarket.local", "Elena", "Brooks", "AquaNest"],
      ["vendor.e@pawmarket.local", "Chris", "Nguyen", "Feathered Friends"],
    ].map(async ([email, first, last]) =>
      prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          firstName: first,
          lastName: last,
          emailVerifiedAt: new Date(),
          roles: { create: { roleId: role("vendor_owner").id } },
        },
      }),
    ),
  );

  const storeDefs = [
    {
      user: vendorUsers[0],
      legal: "Paws & Provisions LLC",
      name: "Paws & Provisions",
      slug: "paws-provisions",
      tagline: "Honest food for hungry dogs",
      description: "Small-batch kibble, treats, and bowls sourced from trusted farms.",
      logo: img.dogPup,
      banner: img.dogWalk,
    },
    {
      user: vendorUsers[1],
      legal: "Whisker & Co Inc",
      name: "Whisker & Co",
      slug: "whisker-co",
      tagline: "Cats, considered",
      description: "Thoughtful feline nutrition, toys, and climbing furniture.",
      logo: img.catClose,
      banner: img.catToy,
    },
    {
      user: vendorUsers[2],
      legal: "TrailTail Outfitters",
      name: "TrailTail Gear",
      slug: "trailtail-gear",
      tagline: "Walks worth wagging for",
      description: "Collars, harnesses, leashes, and travel gear built to last.",
      logo: img.dogCollar,
      banner: img.dogToy,
    },
    {
      user: vendorUsers[3],
      legal: "AquaNest Studios",
      name: "AquaNest",
      slug: "aquanest",
      tagline: "Calm water, healthy fish",
      description: "Aquariums, filters, and care kits for freshwater keepers.",
      logo: img.fishSchool,
      banner: img.fishCoral,
    },
    {
      user: vendorUsers[4],
      legal: "Perch & Song LLC",
      name: "Feathered Friends",
      slug: "feathered-friends",
      tagline: "For birds who deserve better seed",
      description: "Seed blends, cages, and enrichment for companion birds.",
      logo: img.birdColor,
      banner: img.birdFly,
    },
  ];

  const stores = [];
  for (const def of storeDefs) {
    const vendor = await prisma.vendor.create({
      data: {
        ownerId: def.user.id,
        legalName: def.legal,
        status: "APPROVED",
        phone: "+15555550100",
        country: "US",
        taxId: "TAX-1000",
        reviewedAt: new Date(),
        profile: { create: { displayName: def.name, about: def.description } },
        payoutMethods: {
          create: { method: "bank", holderName: def.legal, accountLast4: "4242" },
        },
      },
    });
    const store = await prisma.store.create({
      data: {
        vendorId: vendor.id,
        name: def.name,
        slug: def.slug,
        tagline: def.tagline,
        description: def.description,
        logoUrl: def.logo,
        bannerUrl: def.banner,
        status: "ACTIVE",
        ratingAvg: 4.8,
        settings: { create: { supportEmail: def.user.email, shipsFromRegion: "TX" } },
      },
    });
    stores.push(store);
  }

  const pendingUser = await prisma.user.create({
    data: {
      email: "vendor.pending@pawmarket.local",
      passwordHash: hash,
      firstName: "Priya",
      lastName: "Shah",
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: role("vendor_owner").id } },
    },
  });
  await prisma.vendor.create({
    data: {
      ownerId: pendingUser.id,
      legalName: "Priya Pet Goods LLC",
      status: "PENDING_REVIEW",
      phone: "+15555550999",
      country: "US",
      taxId: "TAX-PENDING",
      profile: { create: { displayName: "Priya Pet Goods", about: "Awaiting admin approval." } },
      payoutMethods: {
        create: { method: "bank", holderName: "Priya Shah", accountLast4: "1111" },
      },
      documents: {
        create: {
          type: "business_license",
          fileName: "license.pdf",
          mimeType: "application/pdf",
          storageKey: "vendors/pending/license.pdf",
        },
      },
      stores: {
        create: {
          name: "Priya Pet Goods",
          slug: "priya-pet-goods",
          tagline: "Thoughtful small-batch treats",
          description: "New vendor awaiting marketplace approval.",
          status: "DRAFT",
          settings: { create: {} },
        },
      },
    },
  });

  const livePets = await prisma.category.create({
    data: { name: "Live Pets", slug: "live-pets", imageUrl: img.dogShepherd },
  });
  const petFood = await prisma.category.create({
    data: { name: "Pet Food", slug: "pet-food", imageUrl: img.dogFood },
  });
  const accessories = await prisma.category.create({
    data: { name: "Accessories", slug: "accessories", imageUrl: img.collar },
  });
  const habitat = await prisma.category.create({
    data: { name: "Habitat", slug: "habitat", imageUrl: img.fish },
  });

  const cats = await Promise.all(
    [
      {
        parentId: livePets.id,
        name: "Dog Breeds",
        slug: "dog-breeds",
        animalType: "Dogs",
        imageUrl: img.dogShepherd,
      },
      {
        parentId: livePets.id,
        name: "Parrots",
        slug: "parrots",
        animalType: "Birds",
        imageUrl: img.birdMacaw,
      },
      {
        parentId: livePets.id,
        name: "Aquarium Fish",
        slug: "aquarium-fish",
        animalType: "Fish",
        imageUrl: img.fishGold,
      },
      {
        parentId: livePets.id,
        name: "Turtles",
        slug: "turtles",
        animalType: "Fish",
        imageUrl: img.turtlePair,
      },
      {
        parentId: livePets.id,
        name: "Cat Breeds",
        slug: "cat-breeds",
        animalType: "Cats",
        imageUrl: img.persianKittenPunch,
      },
      {
        parentId: livePets.id,
        name: "Rabbits",
        slug: "rabbits",
        animalType: "Rabbits",
        imageUrl: img.rabbitAdult,
      },
      {
        parentId: livePets.id,
        name: "Hamsters",
        slug: "hamsters",
        animalType: "Hamsters",
        imageUrl: img.hamsterSolo,
      },
      {
        parentId: livePets.id,
        name: "Hens",
        slug: "hens",
        animalType: "Hens",
        imageUrl: img.desiHenPair,
      },
      {
        parentId: livePets.id,
        name: "Goats",
        slug: "goats",
        animalType: "Goats",
        imageUrl: img.gulabiGoatPair,
      },
      {
        parentId: livePets.id,
        name: "Cows",
        slug: "cows",
        animalType: "Cows",
        imageUrl: img.dairyCowPair,
      },
      {
        parentId: livePets.id,
        name: "Lizards",
        slug: "lizards",
        animalType: "Reptiles",
        imageUrl: img.veiledChameleon,
      },
      { parentId: petFood.id, name: "Dog Food", slug: "dog-food", animalType: "Dogs", imageUrl: img.dogFood },
      { parentId: petFood.id, name: "Cat Food", slug: "cat-food", animalType: "Cats", imageUrl: img.catFood },
      { parentId: petFood.id, name: "Bird Food", slug: "bird-food", animalType: "Birds", imageUrl: img.birdPerch },
      { parentId: petFood.id, name: "Fish Food", slug: "fish-food", animalType: "Fish", imageUrl: img.fishSchool },
      { parentId: petFood.id, name: "Turtle Food", slug: "turtle-food", animalType: "Fish", imageUrl: img.turtleFood },
      { parentId: petFood.id, name: "Hen Food", slug: "hen-food", animalType: "Hens", imageUrl: img.henFeed },
      { parentId: petFood.id, name: "Goat Food", slug: "goat-food", animalType: "Goats", imageUrl: img.goatFeed },
      { parentId: petFood.id, name: "Cow Food", slug: "cow-food", animalType: "Cows", imageUrl: img.cowFeed },
      { parentId: petFood.id, name: "Rabbit Food", slug: "rabbit-food", animalType: "Rabbits", imageUrl: img.rabbitPelletFood },
      { parentId: petFood.id, name: "Hamster Food", slug: "hamster-food", animalType: "Hamsters", imageUrl: img.hamsterFood },
      { parentId: accessories.id, name: "Collars", slug: "collars", animalType: "Dogs", imageUrl: img.dogCollar },
      { parentId: accessories.id, name: "Leashes", slug: "leashes", animalType: "Dogs", imageUrl: img.dogWalk },
      { parentId: accessories.id, name: "Toys", slug: "toys", animalType: "Dogs", imageUrl: img.dogToy },
      { parentId: accessories.id, name: "Beds", slug: "beds", animalType: "Dogs", imageUrl: img.dogBed },
      { parentId: habitat.id, name: "Aquariums", slug: "aquariums", animalType: "Fish", imageUrl: img.fishTank },
      { parentId: habitat.id, name: "Cages", slug: "cages", animalType: "Birds", imageUrl: img.birdFly },
      {
        parentId: habitat.id,
        name: "Hen Cages",
        slug: "hen-cages",
        animalType: "Hens",
        imageUrl: img.henCage,
      },
      { parentId: habitat.id, name: "Dog Houses", slug: "dog-houses", animalType: "Dogs", imageUrl: img.dogHouse },
      {
        parentId: habitat.id,
        name: "Parrot Houses",
        slug: "parrot-houses",
        animalType: "Birds",
        imageUrl: img.parrotHouse,
      },
      {
        parentId: habitat.id,
        name: "Rabbit Hutches",
        slug: "rabbit-hutches",
        animalType: "Rabbits",
        imageUrl: img.rabbitHutch,
      },
      { parentId: habitat.id, name: "Cat Trees", slug: "cat-trees", animalType: "Cats", imageUrl: img.catTree },
      {
        parentId: habitat.id,
        name: "Terrariums",
        slug: "terrariums",
        animalType: "Reptiles",
        imageUrl: img.terrarium,
      },
      {
        parentId: habitat.id,
        name: "Hamster Habitats",
        slug: "hamster-habitats",
        animalType: "Hamsters",
        imageUrl: img.hamsterHabitat,
      },
      { parentId: accessories.id, name: "Grooming", slug: "grooming", animalType: "Dogs", imageUrl: img.dogPup },
    ].map((c) => prisma.category.create({ data: c })),
  );
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const storeBySlug = Object.fromEntries(stores.map((s) => [s.slug, s]));

  /** Prices are PKR rupees (converted to paisas via pkr()). Based on common Pakistan pet-market ranges. */
  const catalog: CatalogItem[] = [
    // —— Dog breeds (Pakistan market) ——
    {
      name: "German Shepherd Puppy",
      brand: "Lahore Kennels",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "paws-provisions",
      short: "Pure-looking GSD puppy — Pakistan market favourite.",
      description:
        "Healthy German Shepherd puppy, dewormed. Price reflects typical Lahore/Karachi kennel range (pedigree lines cost more).",
      tags: "german-shepherd,gsd,puppy,breed",
      image: img.dogShepherd,
      variants: [
        { name: "Male · 2 months", price: 75000, sku: "PK-GSD-M", onHand: 4 },
        { name: "Female · 2 months", price: 70000, sku: "PK-GSD-F", onHand: 3 },
      ],
    },
    {
      name: "Pitbull Puppy",
      brand: "Lahore Kennels",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "paws-provisions",
      short: "American Pitbull-type puppy, playful and strong.",
      description: "Common Pakistan listing range for Pitbull pups. Ask vendor for vaccination card.",
      tags: "pitbull,puppy,breed",
      image: img.dogPitbull,
      variants: [
        { name: "Male · 2 months", price: 55000, sku: "PK-PIT-M", onHand: 3 },
        { name: "Female · 2 months", price: 50000, sku: "PK-PIT-F", onHand: 2 },
      ],
    },
    {
      name: "Labrador Retriever Puppy",
      brand: "Lahore Kennels",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "trailtail-gear",
      short: "Friendly Labrador puppy — family pet.",
      description: "Chocolate/black/yellow Labs are widely sold across Pakistan pet markets.",
      tags: "labrador,lab,puppy,breed",
      image: img.dogLab,
      variants: [
        { name: "Male · 2 months", price: 45000, sku: "PK-LAB-M", onHand: 5 },
        { name: "Female · 2 months", price: 42000, sku: "PK-LAB-F", onHand: 4 },
      ],
    },
    {
      name: "Pug Puppy",
      brand: "City Pets PK",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "whisker-co",
      short: "Compact Pug puppy — apartment friendly.",
      description: "Popular small breed in Pakistani cities. Price mid-market.",
      tags: "pug,puppy,breed",
      image: img.dogPug,
      variants: [{ name: "Puppy · 2 months", price: 50000, sku: "PK-PUG-1", onHand: 4 }],
    },
    {
      name: "Siberian Husky Puppy",
      brand: "City Pets PK",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "trailtail-gear",
      short: "Husky puppy with striking coat.",
      description: "Higher-demand breed; Pakistan prices often sit near the top of dog listings.",
      tags: "husky,puppy,breed",
      image: img.dogHusky,
      variants: [{ name: "Puppy · 2 months", price: 100000, sku: "PK-HSK-1", onHand: 2 }],
    },
    {
      name: "Rottweiler Puppy",
      brand: "Lahore Kennels",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "paws-provisions",
      short: "Rottweiler puppy — guard & companion.",
      description: "Solid build pups commonly listed in PKR 60k–120k band.",
      tags: "rottweiler,puppy,breed",
      image: img.dogRott,
      variants: [{ name: "Puppy · 2.5 months", price: 80000, sku: "PK-ROT-1", onHand: 2 }],
    },
    {
      name: "Beagle Puppy",
      brand: "City Pets PK",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "whisker-co",
      short: "Curious Beagle puppy.",
      description: "Small-medium hound breed popular with families in Pakistan.",
      tags: "beagle,puppy,breed",
      image: img.dogBeagle,
      variants: [{ name: "Puppy · 2 months", price: 45000, sku: "PK-BGL-1", onHand: 3 }],
    },
    {
      name: "Bulldog Puppy",
      brand: "Lahore Kennels",
      animal: "Dogs",
      categorySlug: "dog-breeds",
      storeSlug: "paws-provisions",
      short: "English-type Bulldog puppy.",
      description: "Premium small breed; Pakistan market often PKR 80k–150k.",
      tags: "bulldog,puppy,breed",
      image: img.dogBulldog,
      variants: [{ name: "Puppy · 2 months", price: 95000, sku: "PK-BLD-1", onHand: 2 }],
    },
    // —— Parrots (Pakistan market) ——
    {
      name: "Macaw Parrot",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Blue & Gold Macaw — single bird.",
      description:
        "Imported/luxury parrot. Pakistan market often PKR 2.5–6 lakh for Blue & Gold; rarer macaws cost more.",
      tags: "macaw,parrot,bird",
      image: img.birdMacaw,
      variants: [
        { name: "Blue & Gold · Juvenile", price: 350000, sku: "PK-MCW-BG", onHand: 2 },
        { name: "Hahn's Macaw · Mini", price: 180000, sku: "PK-MCW-HN", onHand: 1 },
      ],
    },
    {
      name: "Macaw Parrot Pair",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Blue & Gold Macaw pair — male + female.",
      description:
        "Matched breeding/companion pair. Pakistan luxury bird market; pair pricing is higher than singles.",
      tags: "macaw,pair,parrot,breed",
      image: img.birdMacawPair,
      variants: [
        { name: "Blue & Gold · Pair", price: 650000, sku: "PK-MCW-PAIR", onHand: 1 },
        { name: "Hahn's Mini · Pair", price: 320000, sku: "PK-MCW-PAIR-HN", onHand: 1 },
      ],
    },
    {
      name: "Macaw Baby (Chick)",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Hand-fed Macaw baby / chick.",
      description:
        "Young macaw chick, hand-rearing stage. Ask vendor for age, weaning status, and diet notes.",
      tags: "macaw,baby,chick,parrot",
      image: img.birdMacawBaby,
      variants: [
        { name: "Blue & Gold · Baby", price: 280000, sku: "PK-MCW-BBY", onHand: 2 },
        { name: "Hahn's Mini · Baby", price: 150000, sku: "PK-MCW-BBY-HN", onHand: 1 },
      ],
    },
    {
      name: "Pahari Tota",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Pahari tota — local favourite talking bird.",
      description: "Commonly sold in Pakistani bird markets (Islamabad/Murree belt trade). Hand-tame birds cost more.",
      tags: "pahari-tota,parrot,local",
      image: img.birdPahari,
      variants: [
        { name: "Young · Hand-fed", price: 12000, sku: "PK-PHT-1", onHand: 8 },
        { name: "Adult", price: 8000, sku: "PK-PHT-A", onHand: 6 },
      ],
    },
    {
      name: "Green Parrot (Ringneck)",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Indian Ringneck / green parrot.",
      description: "Classic green parrot sold across Pakistan bird shops. Talking birds fetch premium.",
      tags: "green-parrot,ringneck,parrot",
      image: img.birdRingneck,
      variants: [
        { name: "Green · Young", price: 15000, sku: "PK-GRN-Y", onHand: 10 },
        { name: "Talking · Trained", price: 28000, sku: "PK-GRN-T", onHand: 3 },
      ],
    },
    {
      name: "Alexandrine Parrot",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Large Alexandrine (Hiraman-type) parrot.",
      description: "Bigger than ringneck; prized in Pakistan aviaries.",
      tags: "alexandrine,parrot",
      image: img.birdAlexandrine,
      variants: [{ name: "Young", price: 45000, sku: "PK-ALX-1", onHand: 3 }],
    },
    {
      name: "African Grey Parrot",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "African Grey — top talker.",
      description: "Premium imported parrot; Pakistan prices commonly PKR 80k–2 lakh+.",
      tags: "african-grey,parrot",
      image: img.birdAfricanGrey,
      variants: [{ name: "Juvenile", price: 150000, sku: "PK-AGR-1", onHand: 1 }],
    },
    {
      name: "Cockatiel",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Cockatiel pair / single.",
      description: "Popular beginner parrot in Pakistan homes.",
      tags: "cockatiel,parrot",
      image: img.birdCockatiel,
      variants: [
        { name: "Single", price: 12000, sku: "PK-CKT-1", onHand: 12 },
        { name: "Pair", price: 22000, sku: "PK-CKT-P", onHand: 5 },
      ],
    },
    {
      name: "Lovebird Pair",
      brand: "Feathered Friends PK",
      animal: "Birds",
      categorySlug: "parrots",
      storeSlug: "feathered-friends",
      short: "Colourful lovebird pair.",
      description: "Fischer / peach-faced types common in local markets.",
      tags: "lovebird,parrot",
      image: img.birdLovebird,
      variants: [{ name: "Pair", price: 8000, sku: "PK-LVB-P", onHand: 15 }],
    },
    // —— Aquarium fish (Pakistan market) ——
    {
      name: "Molly Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Live-bearing Molly — black / dalmatian / gold.",
      description: "Pakistan aquarium shops typically sell mollies a few hundred rupees each; packs cheaper per fish.",
      tags: "molly,fish,live",
      image: img.fishMolly,
      variants: [
        { name: "1 fish", price: 350, sku: "PK-MLY-1", onHand: 80 },
        { name: "Pack of 5", price: 1500, sku: "PK-MLY-5", onHand: 25 },
      ],
    },
    {
      name: "Guppy Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Fancy guppies — colourful tails.",
      description: "Common community fish; fancy strains cost more than plain.",
      tags: "guppy,fish,live",
      image: img.fishGuppy,
      variants: [
        { name: "1 fish", price: 250, sku: "PK-GUP-1", onHand: 100 },
        { name: "Pack of 10", price: 2000, sku: "PK-GUP-10", onHand: 20 },
      ],
    },
    {
      name: "Goldfish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Common & fancy goldfish.",
      description: "From simple commons to fancy orandas — prices rise with variety.",
      tags: "goldfish,fish,live",
      image: img.fishGold,
      variants: [
        { name: "Common · 1 fish", price: 400, sku: "PK-GLD-C", onHand: 60 },
        { name: "Fancy · 1 fish", price: 1500, sku: "PK-GLD-F", onHand: 20 },
      ],
    },
    {
      name: "Betta (Fighter) Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Siamese fighter — halfmoon / crowntail.",
      description: "Sold singly in cups across Pakistan pet shops.",
      tags: "betta,fighter,fish",
      image: img.fishBetta,
      variants: [
        { name: "Standard", price: 500, sku: "PK-BET-S", onHand: 40 },
        { name: "Premium halfmoon", price: 1500, sku: "PK-BET-P", onHand: 15 },
      ],
    },
    {
      name: "Angel Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Freshwater angelfish.",
      description: "Popular centrepiece fish for community tanks in PK shops.",
      tags: "angel,fish",
      image: img.fishAngel,
      variants: [{ name: "1 fish", price: 800, sku: "PK-ANG-1", onHand: 30 }],
    },
    {
      name: "Oscar Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Juvenile Oscar — needs large tank.",
      description: "Bigger cichlid; price rises with size and colour morph.",
      tags: "oscar,fish",
      image: img.fishOscar,
      variants: [
        { name: "Small juvenile", price: 2000, sku: "PK-OSC-S", onHand: 12 },
        { name: "Medium", price: 4500, sku: "PK-OSC-M", onHand: 6 },
      ],
    },
    {
      name: "Flowerhorn Fish",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "aquarium-fish",
      storeSlug: "aquanest",
      short: "Flowerhorn — kok show fish.",
      description: "Premium Pakistan aquarium listing; quality head/kok drives price.",
      tags: "flowerhorn,fish",
      image: img.fishFlowerhorn,
      variants: [{ name: "Juvenile", price: 15000, sku: "PK-FLW-1", onHand: 3 }],
    },
    // —— Cat breeds ——
    {
      name: "Persian Cat Kitten",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Punch-face Persian kitten — flat face, long coat.",
      description:
        "Classic brachycephalic (punch-face) Persian kitten. Flat short snout, big round eyes, fluffy coat — Pakistan’s most requested look.",
      tags: "persian,kitten,breed,punch-face",
      image: img.persianKittenPunch,
      variants: [{ name: "Kitten · 2 months", price: 35000, sku: "PK-PRS-1", onHand: 4 }],
    },
    {
      name: "Persian Punch-Face Adult",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Adult Persian — ultra flat punch face.",
      description: "Show-type Persian with extreme brachycephalic face. Needs eye care and soft diet awareness.",
      tags: "persian,adult,breed,punch-face",
      image: img.persianPunch,
      variants: [
        { name: "Male", price: 55000, sku: "PK-PRS-AD-M", onHand: 2 },
        { name: "Female", price: 55000, sku: "PK-PRS-AD-F", onHand: 2 },
      ],
    },
    {
      name: "Exotic Shorthair Punch-Face",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Exotic Shorthair — punch face, plush short coat.",
      description: "The “Persian in a teddy-bear coat.” Flat face, dense short fur, calm temperament.",
      tags: "exotic-shorthair,breed,punch-face",
      image: img.exoticPunch,
      variants: [{ name: "Kitten · 3 months", price: 65000, sku: "PK-EXO-1", onHand: 2 }],
    },
    {
      name: "Himalayan Punch-Face",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Colourpoint Himalayan — punch face + blue eyes.",
      description: "Persian-type flat face with Siamese colour points. Premium Pakistan city pricing.",
      tags: "himalayan,persian,breed,punch-face",
      image: img.himalayanPunch,
      variants: [{ name: "Young", price: 70000, sku: "PK-HIM-1", onHand: 2 }],
    },
    {
      name: "British Shorthair Kitten",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "British Shorthair kitten.",
      description: "Dense coat, calm temperament — premium city pricing.",
      tags: "british-shorthair,kitten,breed",
      image: img.catGrey,
      variants: [{ name: "Kitten · 2 months", price: 55000, sku: "PK-BSH-1", onHand: 2 }],
    },
    {
      name: "Maine Coon Kitten",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Large Maine Coon kitten — tufted ears.",
      description: "Gentle giant breed; longer muzzle (not punch-face). Grows into a big fluffy cat.",
      tags: "maine-coon,kitten,breed",
      image: img.maineCoon,
      variants: [{ name: "Kitten · 3 months", price: 90000, sku: "PK-MCO-1", onHand: 2 }],
    },
    {
      name: "Siamese Cat",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Elegant Siamese — blue eyes, pointed coat.",
      description: "Vocal, social breed with classic colour points. Longer elegant face.",
      tags: "siamese,breed",
      image: img.siameseCat,
      variants: [{ name: "Young adult", price: 45000, sku: "PK-SIA-1", onHand: 3 }],
    },
    {
      name: "Ragdoll Cat",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Docile Ragdoll — soft semi-long coat.",
      description: "Relaxed “floppy” temperament; popular family cat in Pakistan cities.",
      tags: "ragdoll,breed",
      image: img.ragdollCat,
      variants: [{ name: "Kitten · 3 months", price: 85000, sku: "PK-RAG-1", onHand: 2 }],
    },
    {
      name: "Scottish Fold Kitten",
      brand: "Whisker Co PK",
      animal: "Cats",
      categorySlug: "cat-breeds",
      storeSlug: "whisker-co",
      short: "Scottish Fold — folded ears, round face.",
      description: "Iconic folded ears. Ask vendor about health screening for folds.",
      tags: "scottish-fold,kitten,breed",
      image: img.scottishFold,
      variants: [{ name: "Kitten · 2 months", price: 75000, sku: "PK-SCF-1", onHand: 2 }],
    },
    // —— Turtles (listed under Fish shop filter) ——
    {
      name: "Aquatic Turtle Pair",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "turtles",
      storeSlug: "aquanest",
      short: "Healthy aquatic turtle pair for home tanks.",
      description:
        "Common pet turtles (slider-type) sold as a pair. Needs basking dock, UVB, and filtered water — tank sold separately.",
      tags: "turtle,pair,aquatic,live",
      image: img.turtlePair,
      variants: [
        { name: "Small pair", price: 4500, sku: "PK-TTL-P-S", onHand: 8 },
        { name: "Medium pair", price: 7500, sku: "PK-TTL-P-M", onHand: 4 },
      ],
    },
    {
      name: "Turtle Baby",
      brand: "AquaNest PK",
      animal: "Fish",
      categorySlug: "turtles",
      storeSlug: "aquanest",
      short: "Tiny turtle hatchling / baby.",
      description: "Juvenile aquatic turtle. Start with shallow water, gentle filter, and turtle pellets.",
      tags: "turtle,baby,hatchling,live",
      image: img.turtleBaby,
      variants: [
        { name: "1 baby", price: 1800, sku: "PK-TTL-B1", onHand: 20 },
        { name: "Pack of 2 babies", price: 3200, sku: "PK-TTL-B2", onHand: 10 },
      ],
    },
    {
      name: "Turtle Pellet Food",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "turtle-food",
      storeSlug: "aquanest",
      short: "Floating pellets & sticks for aquatic turtles.",
      description: "Calcium-fortified daily turtle food for sliders and similar species.",
      tags: "turtle,food,turtle food,pellets",
      image: img.turtleFood,
      variants: [
        { name: "100g", price: 899, sku: "AN-TTL-100", onHand: 40 },
        { name: "250g", price: 1799, sku: "AN-TTL-250", onHand: 25 },
      ],
    },
    {
      name: "Turtle Aquarium Kit",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "aquariums",
      storeSlug: "aquanest",
      short: "Glass turtle tank with basking dock & filter-ready setup.",
      description:
        "Rectangular glass turtle aquarium with raised basking platform, soft LED canopy, and room for a hang-on or sponge filter. Sized for slider-type aquatic turtles kept as pets in Pakistan.",
      tags: "turtle,aquarium,tank,habitat,basking",
      image: img.turtleAquarium,
      variants: [
        { name: "60L", price: 14999, salePrice: 13499, sku: "AN-TTL-AQ-60", onHand: 10 },
        { name: "90L", price: 19999, sku: "AN-TTL-AQ-90", onHand: 6 },
      ],
    },
    // —— Hens / poultry (Pakistan market) ——
    {
      name: "Desi Hen Pair",
      brand: "Desi Farm PK",
      animal: "Hens",
      categorySlug: "hens",
      storeSlug: "feathered-friends",
      short: "Healthy desi murghi pair — rooster + hen.",
      description:
        "Local desi village chicken pair (murga + murgi), hardy birds suited for backyard and desi egg keeping in Pakistan.",
      tags: "hen,desi,pair,poultry,live,murgi",
      image: img.desiHenPair,
      variants: [
        { name: "Adult pair", price: 5500, sku: "PK-DESI-P", onHand: 12 },
        { name: "Young pair", price: 4200, sku: "PK-DESI-PY", onHand: 10 },
      ],
    },
    {
      name: "Desi Chicks",
      brand: "Desi Farm PK",
      animal: "Hens",
      categorySlug: "hens",
      storeSlug: "feathered-friends",
      short: "Fluffy desi murgi chicks / bachay.",
      description: "Day-old to week-old desi chicks. Keep warm, fresh water, and chick starter mash.",
      tags: "hen,desi,chick,baby,poultry,live",
      image: img.desiChicks,
      variants: [
        { name: "Pack of 5", price: 1200, sku: "PK-DESI-C5", onHand: 30 },
        { name: "Pack of 10", price: 2200, sku: "PK-DESI-C10", onHand: 20 },
      ],
    },
    {
      name: "Aseel Hen Pair",
      brand: "Aseel Yard PK",
      animal: "Hens",
      categorySlug: "hens",
      storeSlug: "feathered-friends",
      short: "Strong Aseel pair — rooster + hen.",
      description:
        "Muscular Aseel gamefowl pair with classic upright stance. Popular Pakistani breed for enthusiasts; sold as healthy breeding stock.",
      tags: "hen,aseel,pair,poultry,live,gamefowl",
      image: img.aseelHenPair,
      variants: [
        { name: "Standard pair", price: 22000, sku: "PK-ASEEL-P", onHand: 6 },
        { name: "Show-quality pair", price: 45000, sku: "PK-ASEEL-PQ", onHand: 2 },
      ],
    },
    {
      name: "Aseel Chicks",
      brand: "Aseel Yard PK",
      animal: "Hens",
      categorySlug: "hens",
      storeSlug: "feathered-friends",
      short: "Aseel chicks with breed markings.",
      description: "Young Aseel chicks from gamefowl lines. Feed chick starter and keep dry bedding.",
      tags: "hen,aseel,chick,baby,poultry,live",
      image: img.aseelChicks,
      variants: [
        { name: "Pack of 3", price: 4500, sku: "PK-ASEEL-C3", onHand: 15 },
        { name: "Pack of 5", price: 7000, sku: "PK-ASEEL-C5", onHand: 10 },
      ],
    },
    {
      name: "Hen Poultry Cage",
      brand: "FarmNest",
      animal: "Hens",
      categorySlug: "hen-cages",
      storeSlug: "feathered-friends",
      short: "Wire poultry cage with nesting box for hens.",
      description:
        "Metal mesh hen cage (murgi ka cage) with nesting box, feeder cups, and easy-clean tray — sized for backyard desi or layer hens.",
      tags: "hen,cage,poultry,habitat,coop",
      image: img.henCage,
      variants: [
        { name: "2–3 birds", price: 8999, salePrice: 7999, sku: "FN-HEN-CG-S", onHand: 14 },
        { name: "4–6 birds", price: 12999, sku: "FN-HEN-CG-L", onHand: 8 },
      ],
    },
    {
      name: "Hen Layer Feed",
      brand: "FarmNest",
      animal: "Hens",
      categorySlug: "hen-food",
      storeSlug: "feathered-friends",
      short: "Balanced mash / pellets for laying hens.",
      description: "Calcium-rich layer feed for desi and commercial hens. Keep dry and feed with fresh water.",
      tags: "hen,food,feed,poultry,mash",
      image: img.henFeed,
      variants: [
        { name: "5 kg", price: 1499, sku: "FN-HEN-FD-5", onHand: 40 },
        { name: "10 kg", price: 2799, sku: "FN-HEN-FD-10", onHand: 25 },
      ],
    },
    // —— Goats (Pakistan market) ——
    {
      name: "Desi Goat Pair",
      brand: "Green Pasture PK",
      animal: "Goats",
      categorySlug: "goats",
      storeSlug: "paws-provisions",
      short: "Healthy adult goat pair (male + female).",
      description:
        "Local desi bakri pair for home or small farm. Vaccination history shared on delivery where available.",
      tags: "goat,pair,bakri,live,farm",
      image: img.goatPair,
      variants: [{ name: "Adult pair", price: 87000, sku: "PK-GOAT-P", onHand: 4 }],
    },
    {
      name: "Goat Baby Kid",
      brand: "Green Pasture PK",
      animal: "Goats",
      categorySlug: "goats",
      storeSlug: "paws-provisions",
      short: "Cute baby goat / bakri ka bachha.",
      description: "Weaned goat kid, bottle- or pasture-ready. Ideal starter animal for a small backyard.",
      tags: "goat,baby,kid,bakri,live",
      image: img.goatBaby,
      variants: [{ name: "1 kid", price: 14000, sku: "PK-GOAT-B1", onHand: 8 }],
    },
    {
      name: "Gulabi Bakra Pair",
      brand: "Green Pasture PK",
      animal: "Goats",
      categorySlug: "goats",
      storeSlug: "paws-provisions",
      short: "Premium white Gulabi bakra + bakri pair.",
      description:
        "Famous Pakistani Gulabi goats with clean white coats and long floppy ears. Healthy adult male and female pair for breeding or show.",
      tags: "goat,gulabi,bakra,bakri,pair,live,white",
      image: img.gulabiGoatPair,
      variants: [{ name: "Adult pair", price: 295000, sku: "PK-GULABI-P", onHand: 3 }],
    },
    {
      name: "Gulabi Bakra Baby",
      brand: "Green Pasture PK",
      animal: "Goats",
      categorySlug: "goats",
      storeSlug: "paws-provisions",
      short: "Cute white Gulabi bakre ka bachha / kid.",
      description:
        "Young white Gulabi goat kid with long ears. Bottle-ready; keep warm and on soft bedding.",
      tags: "goat,gulabi,baby,kid,bakra,live,white",
      image: img.gulabiGoatBaby,
      variants: [{ name: "1 kid", price: 32000, sku: "PK-GULABI-B1", onHand: 5 }],
    },
    {
      name: "Goat Feed",
      brand: "Green Pasture PK",
      animal: "Goats",
      categorySlug: "goat-food",
      storeSlug: "paws-provisions",
      short: "Balanced pellets and mash for goats.",
      description: "Daily goat feed blend for desi and gulabi goats. Keep dry and serve with clean water.",
      tags: "goat,food,feed,pellets",
      image: img.goatFeed,
      variants: [
        { name: "10 kg", price: 2499, sku: "PK-GOAT-FD-10", onHand: 35 },
        { name: "25 kg", price: 5499, sku: "PK-GOAT-FD-25", onHand: 20 },
      ],
    },
    // —— Cows (Pakistan market) ——
    {
      name: "Dairy Cow Pair",
      brand: "Green Pasture PK",
      animal: "Cows",
      categorySlug: "cows",
      storeSlug: "paws-provisions",
      short: "Beautiful milking cow pair with full hanging udder.",
      description:
        "Healthy dairy bull and milking cow pair. The cow has a full, naturally hanging milk udder — ideal dairy stock for a small farm or home dairy.",
      tags: "cow,dairy,pair,live,udder,milk",
      image: img.dairyCowPair,
      variants: [{ name: "Adult pair", price: 950000, sku: "PK-COW-P", onHand: 2 }],
    },
    {
      name: "Dairy Calf",
      brand: "Green Pasture PK",
      animal: "Cows",
      categorySlug: "cows",
      storeSlug: "paws-provisions",
      short: "Cute healthy dairy cow baby / calf.",
      description: "Young dairy calf, soft coat and calm temperament. Bottle- or milk-ready with soft bedding and shelter.",
      tags: "cow,calf,baby,live,dairy",
      image: img.dairyCowBaby,
      variants: [{ name: "1 calf", price: 70000, sku: "PK-COW-B1", onHand: 4 }],
    },
    {
      name: "Cattle Feed",
      brand: "Green Pasture PK",
      animal: "Cows",
      categorySlug: "cow-food",
      storeSlug: "paws-provisions",
      short: "Nutritious cattle feed for dairy cows.",
      description: "Balanced dairy cattle mash and pellets to support milk yield and calf growth. Store in a dry place.",
      tags: "cow,food,feed,cattle,dairy",
      image: img.cowFeed,
      variants: [
        { name: "25 kg", price: 4999, sku: "PK-COW-FD-25", onHand: 30 },
        { name: "50 kg", price: 9499, sku: "PK-COW-FD-50", onHand: 18 },
      ],
    },
    // —— Veiled chameleon (exotic) ——
    {
      name: "Veiled Chameleon",
      brand: "SunRock Exotic",
      animal: "Reptiles",
      categorySlug: "lizards",
      storeSlug: "aquanest",
      short: "Bright green veiled chameleon — international exotic pet pricing.",
      description:
        "Captive-style veiled chameleon (Chamaeleo calyptratus) as kept abroad. Priced near typical overseas market rates (~USD 150–200). Needs tall screened terrarium, UVB, misting, and live insects.",
      tags: "chameleon,veiled,girgit,reptile,live,exotic",
      image: img.veiledChameleon,
      variants: [
        { name: "Juvenile", price: 28000, sku: "PK-CHAM-J", onHand: 3 },
        { name: "Adult", price: 55000, sku: "PK-CHAM-A", onHand: 2 },
      ],
    },
    // —— Rabbits (Pakistan market) ——
    {
      name: "Holland Lop Rabbit — Pair",
      brand: "Burrow Pets PK",
      animal: "Rabbits",
      categorySlug: "rabbits",
      storeSlug: "whisker-co",
      short: "Breeding / companion rabbit pair.",
      description: "Healthy adult pair, common in Pakistani pet markets for homes and breeding.",
      tags: "rabbit,pair,holland-lop",
      image: img.rabbitPair,
      variants: [{ name: "Male + Female pair", price: 12000, sku: "PK-RBT-PAIR", onHand: 4 }],
    },
    {
      name: "Baby Rabbits (Kits)",
      brand: "Burrow Pets PK",
      animal: "Rabbits",
      categorySlug: "rabbits",
      storeSlug: "whisker-co",
      short: "Fluffy baby bunnies — weaned kits.",
      description: "Young kits suitable as pets. Ask vendor for age and feeding notes.",
      tags: "rabbit,baby,kits",
      image: img.rabbitBabies,
      variants: [
        { name: "1 baby", price: 3500, sku: "PK-RBT-B1", onHand: 12 },
        { name: "Pair of babies", price: 6500, sku: "PK-RBT-B2", onHand: 6 },
      ],
    },
    {
      name: "Adult Pet Rabbit",
      brand: "Burrow Pets PK",
      animal: "Rabbits",
      categorySlug: "rabbits",
      storeSlug: "paws-provisions",
      short: "Single adult house rabbit.",
      description: "Calm adult rabbit for family pet. Litter-trained options when available.",
      tags: "rabbit,adult",
      image: img.liveAdultRabbit,
      variants: [
        { name: "Male", price: 4500, sku: "PK-RBT-M", onHand: 5 },
        { name: "Female", price: 4500, sku: "PK-RBT-F", onHand: 5 },
      ],
    },
    {
      name: "Angora Rabbit",
      brand: "Burrow Pets PK",
      animal: "Rabbits",
      categorySlug: "rabbits",
      storeSlug: "whisker-co",
      short: "Fluffy Angora — long coat.",
      description: "Premium fluffy breed; needs regular grooming.",
      tags: "rabbit,angora",
      image: img.liveAngoraRabbit,
      variants: [{ name: "Young adult", price: 15000, sku: "PK-RBT-ANG", onHand: 2 }],
    },
    // —— Hamsters ——
    {
      name: "Syrian Hamster",
      brand: "Burrow Pets PK",
      animal: "Hamsters",
      categorySlug: "hamsters",
      storeSlug: "whisker-co",
      short: "Golden Syrian hamster — solo pet.",
      description: "Classic pet hamster. Keep alone (territorial). Cage sold separately.",
      tags: "hamster,syrian",
      image: img.liveSyrianHamster,
      variants: [{ name: "1 hamster", price: 1500, sku: "PK-HAM-SYR", onHand: 20 }],
    },
    {
      name: "Dwarf Hamster Pair",
      brand: "Burrow Pets PK",
      animal: "Hamsters",
      categorySlug: "hamsters",
      storeSlug: "whisker-co",
      short: "Dwarf hamster pair — same litter preferred.",
      description: "Small dwarf hamsters often kept in same-sex pairs if introduced young.",
      tags: "hamster,dwarf,pair",
      image: img.liveDwarfHamsterPair,
      variants: [{ name: "Pair", price: 2500, sku: "PK-HAM-DW", onHand: 10 }],
    },
    {
      name: "Hamster Baby",
      brand: "Burrow Pets PK",
      animal: "Hamsters",
      categorySlug: "hamsters",
      storeSlug: "paws-provisions",
      short: "Weaned hamster baby.",
      description: "Young hamster ready for a starter cage.",
      tags: "hamster,baby",
      image: img.liveHamsterBaby,
      variants: [{ name: "1 baby", price: 1200, sku: "PK-HAM-BBY", onHand: 15 }],
    },
    // —— Supplies (kept) ——
    {
      name: "River Grain Puppy Kibble",
      brand: "Pawfield",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Gentle recipe for growing puppies.",
      description: "Chicken, oats, and DHA for joints and coat. No fillers.",
      tags: "puppy,kibble,chicken,food,dog food",
      image: img.puppyKibble,
      variants: [
        { name: "1kg", price: 1299, sku: "PP-PUP-1", onHand: 80 },
        { name: "3kg", price: 3299, salePrice: 2899, sku: "PP-PUP-3", onHand: 54 },
        { name: "5kg", price: 4999, sku: "PP-PUP-5", onHand: 40 },
        { name: "10kg", price: 8999, sku: "PP-PUP-10", onHand: 22 },
      ],
    },
    {
      name: "Adult Farm Bowl",
      brand: "Pawfield",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Daily adult maintenance formula.",
      description: "Beef and brown rice with glucosamine for active adults.",
      tags: "adult,kibble,beef,food,dog food",
      image: img.adultFarmBowl,
      variants: [
        { name: "3kg", price: 3499, sku: "PP-ADU-3", onHand: 60 },
        { name: "10kg", price: 9499, salePrice: 8499, sku: "PP-ADU-10", onHand: 18 },
      ],
    },
    {
      name: "Senior Slow-Cook Stew",
      brand: "Hearthpaw",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Soft stew for older dogs.",
      description: "Lower calorie wet food with added omega oils.",
      tags: "senior,wet,stew,food,dog food",
      image: img.seniorStew,
      variants: [{ name: "12-pack", price: 4299, sku: "PP-SEN-12", onHand: 35 }],
    },
    {
      name: "Training Bites",
      brand: "Hearthpaw",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Pea-sized treats for reward-based training.",
      description: "Low-calorie liver treats that won't spoil dinner.",
      tags: "treats,training,food,dog food",
      image: img.trainingBites,
      variants: [{ name: "200g", price: 899, sku: "PP-TRN-200", onHand: 120 }],
    },
    {
      name: "Kitten Mousse",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-food",
      storeSlug: "whisker-co",
      short: "Silky mousse for kittens.",
      description: "High protein chicken mousse with taurine.",
      tags: "kitten,wet,food,cat food",
      image: img.kittenMousse,
      variants: [{ name: "24-pack", price: 3899, sku: "WC-KIT-24", onHand: 44 }],
    },
    {
      name: "Indoor Adult Cat Kibble",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-food",
      storeSlug: "whisker-co",
      short: "Hairball care for indoor cats.",
      description: "Fiber blend plus salmon oil for coat shine.",
      tags: "indoor,kibble,food,cat food",
      image: img.indoorCatKibble,
      variants: [
        { name: "2kg", price: 2499, sku: "WC-IN-2", onHand: 70 },
        { name: "5kg", price: 5299, salePrice: 4799, sku: "WC-IN-5", onHand: 28 },
      ],
    },
    {
      name: "Dog Wet Food Cans",
      brand: "Pawfield",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Chunky gravy wet dog food cans.",
      description: "Complete wet meal for adult dogs — chicken & gravy. Convenient single-serve cans.",
      tags: "food,dog food,wet,cans",
      image: img.dogWetFood,
      variants: [
        { name: "6-pack", price: 1599, sku: "PP-WET-6", onHand: 55 },
        { name: "12-pack", price: 2899, salePrice: 2599, sku: "PP-WET-12", onHand: 40 },
      ],
    },
    {
      name: "Classic Dog Kibble Bag",
      brand: "Pawfield",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Everyday dry dog food bag.",
      description: "Balanced adult kibble for medium breeds — wheat-free recipe popular in Pakistan markets.",
      tags: "food,dog food,kibble,dry",
      image: img.dogFood,
      variants: [
        { name: "1kg", price: 999, sku: "PP-KIB-1", onHand: 90 },
        { name: "3kg", price: 2499, sku: "PP-KIB-3", onHand: 60 },
        { name: "5kg", price: 3999, sku: "PP-KIB-5", onHand: 35 },
      ],
    },
    {
      name: "Dog Treat Crunchies",
      brand: "Hearthpaw",
      animal: "Dogs",
      categorySlug: "dog-food",
      storeSlug: "paws-provisions",
      short: "Crunchy biscuit treats for dogs.",
      description: "Oven-baked dog biscuits for daily rewards — under everyday budgets.",
      tags: "food,dog food,treats,biscuits",
      image: img.dogTreats,
      variants: [
        { name: "250g", price: 699, sku: "PP-TRT-250", onHand: 100 },
        { name: "500g", price: 1199, sku: "PP-TRT-500", onHand: 70 },
      ],
    },
    {
      name: "Cat Dry Food Bag",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-food",
      storeSlug: "whisker-co",
      short: "Everyday cat dry food.",
      description: "Chicken-first kibble for adult cats with taurine and hairball care.",
      tags: "food,cat food,kibble,dry",
      image: img.catFood,
      variants: [
        { name: "1kg", price: 1099, sku: "WC-DRY-1", onHand: 85 },
        { name: "3kg", price: 2799, sku: "WC-DRY-3", onHand: 50 },
      ],
    },
    {
      name: "Cat Wet Food Pouches",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-food",
      storeSlug: "whisker-co",
      short: "Gravy pouches for cats.",
      description: "Soft wet cat food pouches — tuna & chicken mix for picky eaters.",
      tags: "food,cat food,wet,pouches",
      image: img.catFoodWet,
      variants: [
        { name: "8-pack", price: 1499, sku: "WC-WET-8", onHand: 65 },
        { name: "16-pack", price: 2699, sku: "WC-WET-16", onHand: 40 },
      ],
    },
    {
      name: "Parrot Pellet Food",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "bird-food",
      storeSlug: "feathered-friends",
      short: "Complete pellet diet for parrots.",
      description: "Fortified parrot pellets with seed accents — better than seed-only diets.",
      tags: "food,bird food,parrot,pellets",
      image: img.parrotPelletFood,
      variants: [
        { name: "500g", price: 1299, sku: "FF-PAR-500", onHand: 45 },
        { name: "1kg", price: 2299, sku: "FF-PAR-1", onHand: 30 },
      ],
    },
    {
      name: "Bird Seed Blend",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "bird-food",
      storeSlug: "feathered-friends",
      short: "Daily seed mix for small birds.",
      description: "Millet, oats, and sunflower mix for budgies, lovebirds, and finches.",
      tags: "food,bird food,seed,millet",
      image: img.birdFood,
      variants: [
        { name: "500g", price: 799, sku: "FF-SEED-500", onHand: 80 },
        { name: "1kg", price: 1399, sku: "FF-SEED-1", onHand: 55 },
      ],
    },
    {
      name: "Premium Fish Flakes",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "fish-food",
      storeSlug: "aquanest",
      short: "Color-boost fish flakes.",
      description: "Daily tropical flakes for community aquariums — floats then softens.",
      tags: "food,fish food,flakes",
      image: img.fishFood,
      variants: [
        { name: "50g", price: 599, sku: "AN-FLK-50", onHand: 100 },
        { name: "100g", price: 999, sku: "AN-FLK-100", onHand: 70 },
      ],
    },
    {
      name: "Rabbit Pellet Food",
      brand: "Burrow",
      animal: "Rabbits",
      categorySlug: "rabbit-food",
      storeSlug: "whisker-co",
      short: "Daily rabbit pellets with fiber.",
      description: "Timothy-based pellets for adult pet rabbits — pair with hay.",
      tags: "food,rabbit food,pellets",
      image: img.rabbitPelletFood,
      variants: [
        { name: "1kg", price: 1199, sku: "WC-RBT-FD-1", onHand: 60 },
        { name: "3kg", price: 2999, sku: "WC-RBT-FD-3", onHand: 35 },
      ],
    },
    {
      name: "Hamster Food Mix",
      brand: "Burrow",
      animal: "Hamsters",
      categorySlug: "hamster-food",
      storeSlug: "whisker-co",
      short: "Seed & pellet mix for hamsters.",
      description: "Varied hamster diet with seeds, pellets, and dried veg — no sticky sugary mixes.",
      tags: "food,hamster food,mix,seed",
      image: img.hamsterFood,
      variants: [
        { name: "400g", price: 699, sku: "WC-HAM-FD-400", onHand: 75 },
        { name: "800g", price: 1199, sku: "WC-HAM-FD-800", onHand: 45 },
      ],
    },
    {
      name: "Chick Starter Mash",
      brand: "FarmNest",
      animal: "Hens",
      categorySlug: "hen-food",
      storeSlug: "feathered-friends",
      short: "Starter mash for chicks / murgi bachay.",
      description: "Fine mash for desi and aseel chicks — easy to digest in first weeks.",
      tags: "food,hen food,chick,starter,mash",
      image: img.henFeed,
      variants: [
        { name: "2kg", price: 899, sku: "FN-CHK-2", onHand: 50 },
        { name: "5kg", price: 1899, sku: "FN-CHK-5", onHand: 30 },
      ],
    },
    {
      name: "Catnip Mouse Duo",
      brand: "Pounce",
      animal: "Cats",
      categorySlug: "toys",
      storeSlug: "whisker-co",
      short: "Two stuffed mice with extra catnip.",
      description: "Recycled felt, reinforced seams, refillable catnip pouch.",
      tags: "toy,catnip",
      image: img.catnipMouse,
      variants: [{ name: "Pair", price: 1299, sku: "WC-MOUSE", onHand: 90 }],
    },
    {
      name: "Window Perch",
      brand: "Pounce",
      animal: "Cats",
      categorySlug: "beds",
      storeSlug: "whisker-co",
      short: "Suction perch for sunbathing.",
      description: "Holds up to 12kg. Machine-washable cover.",
      tags: "bed,perch",
      image: img.windowPerch,
      variants: [{ name: "Standard", price: 4599, sku: "WC-PERCH", onHand: 25 }],
    },
    {
      name: "TrailLock Collar",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "collars",
      storeSlug: "trailtail-gear",
      short: "Waterproof collar with quiet buckle.",
      description: "BioThane-style strap, stamped ID panel, four sizes.",
      tags: "collar,waterproof",
      image: img.dogCollarProduct,
      variants: [
        { name: "S", price: 2199, sku: "TT-COL-S", onHand: 40 },
        { name: "M", price: 2299, sku: "TT-COL-M", onHand: 40 },
        { name: "L", price: 2399, sku: "TT-COL-L", onHand: 30 },
      ],
    },
    {
      name: "Hands-Free Leash",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "leashes",
      storeSlug: "trailtail-gear",
      short: "Waist leash for running.",
      description: "Bungee section and dual-grab handle.",
      tags: "leash,running",
      image: img.handsFreeLeash,
      variants: [{ name: "150cm", price: 3499, salePrice: 2999, sku: "TT-LSH-150", onHand: 48 }],
    },
    {
      name: "Y-Harness",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "collars",
      storeSlug: "trailtail-gear",
      short: "No-pull Y harness.",
      description: "Reflective stitching, four adjustment points.",
      tags: "harness,nopull",
      image: img.dogHarness,
      variants: [
        { name: "M", price: 3899, sku: "TT-HAR-M", onHand: 36 },
        { name: "L", price: 4099, sku: "TT-HAR-L", onHand: 36 },
      ],
    },
    {
      name: "CloudNest Bed",
      brand: "Hearthpaw",
      animal: "Dogs",
      categorySlug: "beds",
      storeSlug: "paws-provisions",
      short: "Orthopedic foam nest.",
      description: "Removable cover, bolsters for chin rest.",
      tags: "bed,orthopedic",
      image: img.cloudNestBed,
      variants: [
        { name: "M", price: 7999, sku: "PP-BED-M", onHand: 16 },
        { name: "L", price: 9999, sku: "PP-BED-L", onHand: 12 },
      ],
    },
    {
      name: "Rope Tug",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "toys",
      storeSlug: "trailtail-gear",
      short: "Cotton rope for tug and fetch.",
      description: "Machine washable, knotted ends.",
      tags: "toy,rope",
      image: img.ropeTug,
      variants: [{ name: "Standard", price: 1099, sku: "TT-ROPE", onHand: 100 }],
    },
    {
      name: "Slicker Brush",
      brand: "Groomwell",
      animal: "Dogs",
      categorySlug: "grooming",
      storeSlug: "trailtail-gear",
      short: "Gentle slicker for double coats.",
      description: "Rounded pins, cushioned paddle.",
      tags: "grooming,brush",
      image: img.slickerBrush,
      variants: [{ name: "One size", price: 1599, sku: "TT-BRUSH", onHand: 55 }],
    },
    {
      name: "Reef 60 Aquarium Kit",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "aquariums",
      storeSlug: "aquanest",
      short: "60L starter kit with LED and filter.",
      description: "Glass tank, quiet filter, clip-on light, thermometer.",
      tags: "aquarium,starter,house,habitat",
      image: img.aquariumKit,
      variants: [{ name: "60L", price: 12999, salePrice: 11499, sku: "AN-60", onHand: 8 }],
    },
    {
      name: "Coastal 120 Aquarium Suite",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "aquariums",
      storeSlug: "aquanest",
      short: "Full 120L aquarium house with cabinet stand.",
      description:
        "Tempered glass display tank, black cabinet base, dual LED canopy, and hang-on filter — a complete fish house for community tanks.",
      tags: "aquarium,house,cabinet,habitat",
      image: img.aquariumLarge,
      variants: [
        { name: "120L Black", price: 45999, salePrice: 41999, sku: "AN-AQ-120", onHand: 4 },
        { name: "120L Oak", price: 48999, sku: "AN-AQ-120O", onHand: 3 },
      ],
    },
    {
      name: "Nano Cube Shrimp House",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "aquariums",
      storeSlug: "aquanest",
      short: "25L cube aquarium for shrimp & nano fish.",
      description: "All-in-one nano house with built-in back filter and soft LED.",
      tags: "aquarium,nano,house",
      image: img.nanoAquarium,
      variants: [{ name: "25L", price: 8999, sku: "AN-NANO-25", onHand: 12 }],
    },
    {
      name: "Canister Filter Mini",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "aquariums",
      storeSlug: "aquanest",
      short: "External filter for 40–80L tanks.",
      description: "Ceramic rings included. 600L/h.",
      tags: "filter,aquarium",
      image: img.canisterFilter,
      variants: [{ name: "Mini", price: 5999, sku: "AN-FIL", onHand: 20 }],
    },
    {
      name: "Cedar Den Dog House",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "dog-houses",
      storeSlug: "trailtail-gear",
      short: "Weatherproof outdoor dog house with raised floor.",
      description:
        "Solid cedar panels, asphalt-style roof, elevated floor for dryness, and a hinged clean-out panel. Sized for medium breeds common in Pakistan.",
      tags: "dog,house,kennel,habitat,outdoor",
      image: img.dogHouse,
      variants: [
        { name: "Medium", price: 18999, salePrice: 16999, sku: "TT-DH-M", onHand: 7 },
        { name: "Large", price: 24999, sku: "TT-DH-L", onHand: 5 },
      ],
    },
    {
      name: "Insulated Kennel Lodge",
      brand: "Pawfield",
      animal: "Dogs",
      categorySlug: "dog-houses",
      storeSlug: "paws-provisions",
      short: "Insulated indoor/outdoor kennel lodge.",
      description: "Double-wall plastic kennel with removable door flap and chew-resistant rim.",
      tags: "dog,house,kennel,insulated",
      image: img.dogKennel,
      variants: [
        { name: "S–M", price: 12999, sku: "PP-KEN-SM", onHand: 10 },
        { name: "L–XL", price: 17999, sku: "PP-KEN-XL", onHand: 6 },
      ],
    },
    {
      name: "Macaw Manor Parrot House",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "parrot-houses",
      storeSlug: "feathered-friends",
      short: "Large powder-coated parrot house with play top.",
      description:
        "Wide horizontal bars, seed guards, dual feed cups, and a rooftop play gym — built for macaws, greys, and large amazons.",
      tags: "parrot,house,cage,habitat,macaw",
      image: img.parrotHouse,
      variants: [
        { name: "Standard", price: 32999, salePrice: 29999, sku: "FF-PH-STD", onHand: 4 },
        { name: "Wide", price: 38999, sku: "FF-PH-WD", onHand: 3 },
      ],
    },
    {
      name: "Ringneck Nest House",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "parrot-houses",
      storeSlug: "feathered-friends",
      short: "Breeding-ready nest house for ringnecks & lovebirds.",
      description: "Wooden nest box with inspection door and perch ledge; mounts inside flight cages.",
      tags: "parrot,nest,house,ringneck",
      image: img.parrotNest,
      variants: [{ name: "Nest box", price: 3499, sku: "FF-NEST", onHand: 22 }],
    },
    {
      name: "Flight Cage Compact",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "cages",
      storeSlug: "feathered-friends",
      short: "Horizontal-bar flight cage.",
      description: "Includes perches, cups, and seed guard.",
      tags: "cage,bird",
      image: img.flightCage,
      variants: [{ name: "Compact", price: 15999, sku: "FF-CAG", onHand: 6 }],
    },
    {
      name: "Garden Rabbit Hutch House",
      brand: "Burrow",
      animal: "Rabbits",
      categorySlug: "rabbit-hutches",
      storeSlug: "whisker-co",
      short: "Two-tier outdoor rabbit hutch house.",
      description: "Waterproof roof, pull-out tray, ramp between loft and run — safe housing for 1–2 rabbits.",
      tags: "rabbit,hutch,house,habitat",
      image: img.rabbitHutch,
      variants: [{ name: "Two-tier", price: 21999, salePrice: 19999, sku: "WC-HUTCH", onHand: 5 }],
    },
    {
      name: "Skyline Cat Tree House",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-trees",
      storeSlug: "whisker-co",
      short: "Multi-level cat tree with condo house.",
      description: "Sisal posts, plush condos, and a top perch — indoor cat house for climbing and napping.",
      tags: "cat,tree,house,condo,habitat",
      image: img.catTree,
      variants: [
        { name: "140cm", price: 14999, sku: "WC-CT-140", onHand: 8 },
        { name: "180cm", price: 18999, sku: "WC-CT-180", onHand: 5 },
      ],
    },
    {
      name: "Whisker Cube Cat House",
      brand: "Whiskerly",
      animal: "Cats",
      categorySlug: "cat-trees",
      storeSlug: "whisker-co",
      short: "Enclosed indoor cat house with plush bed.",
      description:
        "Soft cube cat house with round entrance and washable cushion — a private den for napping cats.",
      tags: "cat,house,condo,bed,habitat",
      image: img.catHouse,
      variants: [
        { name: "Small", price: 5999, sku: "WC-CH-S", onHand: 14 },
        { name: "Large", price: 7499, sku: "WC-CH-L", onHand: 10 },
      ],
    },
    {
      name: "Desert Glass Terrarium",
      brand: "SunRock",
      animal: "Reptiles",
      categorySlug: "terrariums",
      storeSlug: "aquanest",
      short: "Vented glass terrarium house for reptiles.",
      description: "Front-opening doors, top screen vent, and cable ports for heat & UV lamps.",
      tags: "reptile,terrarium,house,habitat",
      image: img.desertTerrarium,
      variants: [
        { name: "60cm", price: 16999, sku: "AN-TER-60", onHand: 6 },
        { name: "90cm", price: 24999, sku: "AN-TER-90", onHand: 4 },
      ],
    },
    {
      name: "Tunnel Town Hamster Habitat",
      brand: "Burrow",
      animal: "Hamsters",
      categorySlug: "hamster-habitats",
      storeSlug: "whisker-co",
      short: "Modular hamster house with deep bedding base.",
      description: "Escape-proof latches, wheel, hide chamber, and tunnel ports for Syrian & dwarf hamsters.",
      tags: "hamster,habitat,house,cage",
      image: img.hamsterHabitat,
      variants: [{ name: "Deluxe", price: 8999, salePrice: 7999, sku: "WC-HH-DX", onHand: 14 }],
    },
    {
      name: "Tropical Flake",
      brand: "AquaNest",
      animal: "Fish",
      categorySlug: "fish-food",
      storeSlug: "aquanest",
      short: "Daily flake for community tanks.",
      description: "Color-enhancing spirulina blend.",
      tags: "fish,food,fish food,flake",
      image: img.tropicalFlake,
      variants: [{ name: "100g", price: 1299, sku: "AN-FLK", onHand: 70 }],
    },
    {
      name: "Canary Millet Mix",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "bird-food",
      storeSlug: "feathered-friends",
      short: "Small-hookbill seed blend.",
      description: "No sunflower filler. Added pellets.",
      tags: "bird,seed,food,bird food",
      image: img.canaryMillet,
      variants: [{ name: "1kg", price: 1899, sku: "FF-MIL-1", onHand: 40 }],
    },
    {
      name: "Foraging Toy",
      brand: "PerchSong",
      animal: "Birds",
      categorySlug: "toys",
      storeSlug: "feathered-friends",
      short: "Shreddable foraging wheel.",
      description: "Untreated wood and paper. Stainless hardware.",
      tags: "toy,bird",
      image: img.foragingToy,
      variants: [{ name: "Wheel", price: 1799, sku: "FF-FOR", onHand: 32 }],
    },
    {
      name: "Rabbit Meadow Hay",
      brand: "Pawfield",
      animal: "Rabbits",
      categorySlug: "rabbit-food",
      storeSlug: "paws-provisions",
      short: "Timothy hay first cut.",
      description: "Dust-extracted bale for daily forage.",
      tags: "rabbit,hay,food,rabbit food",
      image: img.rabbitHay,
      variants: [{ name: "2kg", price: 2199, sku: "PP-HAY-2", onHand: 24 }],
    },
    {
      name: "Hamster Hideout",
      brand: "Burrow",
      animal: "Hamsters",
      categorySlug: "cages",
      storeSlug: "whisker-co",
      short: "Ceramic hide for cooling.",
      description: "Glazed interior, wide entrance.",
      tags: "hamster,hide",
      image: img.hamsterHide,
      variants: [{ name: "Ceramic", price: 2499, sku: "WC-HID", onHand: 18 }],
    },
    {
      name: "Reptile Basking Lamp",
      brand: "SunRock",
      animal: "Reptiles",
      categorySlug: "habitat",
      storeSlug: "aquanest",
      short: "UVA/UVB combo lamp.",
      description: "Fits standard dome fixtures. 10.0 UVB.",
      tags: "reptile,lamp",
      image: img.baskingLamp,
      variants: [{ name: "26W", price: 3299, sku: "AN-UVB", onHand: 15 }],
    },
    {
      name: "Travel Water Bottle",
      brand: "TrailTail",
      animal: "Dogs",
      categorySlug: "accessories",
      storeSlug: "trailtail-gear",
      short: "Leak-proof bottle with bowl lid.",
      description: "750ml, BPA-free, carabiner.",
      tags: "travel,water",
      image: img.travelBottle,
      variants: [{ name: "750ml", price: 1899, sku: "TT-BTL", onHand: 50 }],
    },
  ];

  // Fewer generic kits — breeds are the main catalog now
  const animalCycle = ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Hamsters", "Reptiles"] as const;
  const singular: Record<(typeof animalCycle)[number], string> = {
    Dogs: "Dog",
    Cats: "Cat",
    Birds: "Bird",
    Fish: "Fish",
    Rabbits: "Rabbit",
    Hamsters: "Hamster",
    Reptiles: "Reptile",
  };
  const extras: CatalogItem[] = Array.from({ length: 7 }).map((_, i) => {
    const animal = animalCycle[i % animalCycle.length];
    const meta = animalCatalog[animal];
    return {
      name: `${singular[animal]} Care Essentials Pack`,
      brand: meta.brand,
      animal,
      categorySlug: meta.categorySlug,
      storeSlug: meta.storeSlug,
      short: `Everyday care pack for ${animal.toLowerCase()}.`,
      description: `Starter accessories pack for ${animal.toLowerCase()} owners in Pakistan.`,
      tags: `bundle,care,${animal.toLowerCase()}`,
      image: meta.careImage,
      variants: [{ name: "Pack", price: 2499 + i * 200, sku: `CARE-${singular[animal].slice(0, 3).toUpperCase()}`, onHand: 20 + i }],
    };
  });

  for (const item of [...catalog, ...extras]) {
    const store = storeBySlug[item.storeSlug];
    const category =
      catBySlug[item.categorySlug] ??
      (item.categorySlug === "pet-food" || item.categorySlug === "habitat" || item.categorySlug === "accessories"
        ? await prisma.category.findUnique({ where: { slug: item.categorySlug } })
        : catBySlug["toys"]);
    if (!store || !category) continue;
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + item.variants[0].sku.toLowerCase();
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        vendorId: store.vendorId,
        categoryId: category.id,
        name: item.name,
        slug,
        brand: item.brand,
        shortDescription: item.short,
        description: item.description,
        animalType: item.animal,
        tags: item.tags,
        approvalStatus: "APPROVED",
        visibility: "PUBLISHED",
        soldCount: Math.floor(Math.random() * 400),
        ratingAvg: 4.3 + Math.random() * 0.6,
        variants: {
          create: item.variants.map((v) => ({
            ...v,
            price: pkr(v.price),
            salePrice: v.salePrice != null ? pkr(v.salePrice) : undefined,
          })),
        },
        images: { create: [{ url: item.image, alt: item.name, sortOrder: 0 }] },
      },
    });
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        rating: 5,
        title: "Would buy again",
        comment: "Arrived quickly and our pet loved it.",
        verifiedPurchase: true,
      },
    });
  }

  const pendingStore = stores[0];
  const pendingCategory = cats[0] ?? (await prisma.category.findFirst());
  if (pendingStore && pendingCategory) {
    await prisma.product.create({
      data: {
        storeId: pendingStore.id,
        vendorId: pendingStore.vendorId,
        categoryId: pendingCategory.id,
        name: "New Arrival Treat Sampler",
        slug: "new-arrival-treat-sampler-pending",
        brand: "Pawfield",
        shortDescription: "Awaiting admin product approval.",
        description: "Vendor-submitted treat sampler waiting in the product review queue.",
        animalType: "Dogs",
        tags: "treats,pending",
        approvalStatus: "PENDING",
        visibility: "DRAFT",
        variants: {
          create: [{ name: "Box", sku: "PP-PENDING-1", price: pkr(1599), onHand: 25, lowStockThreshold: 5 }],
        },
        images: {
          create: [{ url: img.toy, alt: "Treat sampler", sortOrder: 0 }],
        },
      },
    });
  }

  const plans = await Promise.all(
    [
      {
        slug: "free",
        name: "Free",
        description: "Try the marketplace with a small catalog.",
        priceMonthly: 0,
        productLimit: 15,
        storeLimit: 1,
        staffLimit: 1,
        analyticsLevel: "BASIC",
        featuredListing: false,
        sortOrder: 0,
      },
      {
        slug: "growth",
        name: "Growth",
        description: "More SKUs and basic storefront boosts.",
        priceMonthly: pkr(4900),
        productLimit: 100,
        storeLimit: 2,
        staffLimit: 5,
        analyticsLevel: "BASIC",
        featuredListing: true,
        sortOrder: 1,
      },
      {
        slug: "pro",
        name: "Pro",
        description: "Advanced analytics and higher caps.",
        priceMonthly: pkr(14900),
        productLimit: 1000,
        storeLimit: 5,
        staffLimit: 20,
        analyticsLevel: "ADVANCED",
        featuredListing: true,
        sortOrder: 2,
      },
    ].map((p) => prisma.plan.create({ data: p })),
  );
  const growth = plans.find((p) => p.slug === "growth")!;
  const free = plans.find((p) => p.slug === "free")!;
  const allVendors = await prisma.vendor.findMany();
  for (const v of allVendors) {
    await prisma.vendorSubscription.create({
      data: {
        vendorId: v.id,
        planId: v.status === "APPROVED" ? growth.id : free.id,
        status: "ACTIVE",
        billingProvider: "stub",
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      },
    });
  }

  await prisma.commissionSetting.create({
    data: { scope: "GLOBAL", scopeId: "", rateBps: 1000 },
  });

  await prisma.cmsPage.create({
    data: {
      slug: "home",
      title: "Homepage",
      published: true,
      content: JSON.stringify({
        hero: {
          title: "Dogs, parrots & fish — Pakistan pet market prices",
          subtitle:
            "German Shepherd, Pitbull, Macaw, Pahari tota, Molly, Guppy, Goldfish aur zyada — live pets plus food & gear.",
          cta: "Shop live pets",
          image: img.store,
        },
        sections: ["animalTypes", "popular", "deals", "newArrivals", "stores"],
      }),
    },
  });

  await prisma.cmsPage.createMany({
    data: [
      {
        slug: "about",
        title: "About PawMarket",
        published: true,
        content: JSON.stringify({
          html: "<p>PawMarket is a multi-vendor marketplace for independent pet shops.</p>",
        }),
      },
      {
        slug: "shipping",
        title: "Shipping policy",
        published: true,
        content: JSON.stringify({
          html: "<p>Each store ships separately. Tracking appears on your order once marked shipped.</p>",
        }),
      },
      {
        slug: "returns",
        title: "Returns",
        published: true,
        content: JSON.stringify({
          html: "<p>Request refunds from your order page. Unshipped items are prioritized.</p>",
        }),
      },
    ],
  });

  await prisma.coupon.create({
    data: {
      code: "PAW10",
      type: "PERCENT",
      value: 10,
      scope: "PLATFORM",
      minSubtotal: pkr(2000),
      maxRedemptions: 1000,
    },
  });

  await prisma.experiment.create({
    data: {
      key: "home_hero",
      name: "Home hero subtitle",
      variants: JSON.stringify(["A", "B"]),
      active: true,
    },
  });

  console.log("Seed complete");
  console.log("Admin     admin@pawmarket.local / Password123!");
  console.log("Customer  customer@pawmarket.local / Password123!");
  console.log("Vendor    vendor.a@pawmarket.local / Password123!");
  console.log("Pending   vendor.pending@pawmarket.local / Password123!");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
