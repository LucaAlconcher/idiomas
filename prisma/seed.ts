import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

const languages = [
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
];

async function main() {
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: { name: language.name },
      create: language,
    });
  }
  console.log(`Seeded ${languages.length} languages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
