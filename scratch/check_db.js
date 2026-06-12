const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const folders = await prisma.folder.findMany();
  const nullFolderProducts = await prisma.product.findMany({
    where: { folderId: null }
  });
  console.log('--- DATABASE STATUS ---');
  console.log('Folders count:', folders.length);
  console.log('Folders list:', folders.map(f => ({ id: f.id, name: f.name })));
  console.log('Products without folder count:', nullFolderProducts.length);
  console.log('Products without folder names:', nullFolderProducts.map(p => p.name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
