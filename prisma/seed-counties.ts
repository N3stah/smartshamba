import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const counties = [
  { code: '001', name: 'Mombasa' },
  { code: '002', name: 'Kwale' },
  { code: '003', name: 'Kilifi' },
  { code: '004', name: 'Tana River' },
  { code: '005', name: 'Lamu' },
  { code: '006', name: 'Taita-Taveta' },
  { code: '007', name: 'Garissa' },
  { code: '008', name: 'Wajir' },
  { code: '009', name: 'Mandera' },
  { code: '010', name: 'Marsabit' },
  { code: '011', name: 'Isiolo' },
  { code: '012', name: 'Meru' },
  { code: '013', name: 'Tharaka-Nithi' },
  { code: '014', name: 'Embu' },
  { code: '015', name: 'Kitui' },
  { code: '016', name: 'Machakos' },
  { code: '017', name: 'Makueni' },
  { code: '018', name: 'Nyandarua' },
  { code: '019', name: 'Nyeri' },
  { code: '020', name: 'Kirinyaga' },
  { code: '021', name: "Murang'a" },
  { code: '022', name: 'Kiambu' },
  { code: '023', name: 'Turkana' },
  { code: '024', name: 'West Pokot' },
  { code: '025', name: 'Samburu' },
  { code: '026', name: 'Trans Nzoia' },
  { code: '027', name: 'Uasin Gishu' },
  { code: '028', name: 'Elgeyo-Marakwet' },
  { code: '029', name: 'Nandi' },
  { code: '030', name: 'Baringo' },
  { code: '031', name: 'Laikipia' },
  { code: '032', name: 'Nakuru' },
  { code: '033', name: 'Narok' },
  { code: '034', name: 'Kajiado' },
  { code: '035', name: 'Kericho' },
  { code: '036', name: 'Bomet' },
  { code: '037', name: 'Kakamega' },
  { code: '038', name: 'Vihiga' },
  { code: '039', name: 'Bungoma' },
  { code: '040', name: 'Busia' },
  { code: '041', name: 'Siaya' },
  { code: '042', name: 'Kisumu' },
  { code: '043', name: 'Homa Bay' },
  { code: '044', name: 'Migori' },
  { code: '045', name: 'Kisii' },
  { code: '046', name: 'Nyamira' },
  { code: '047', name: 'Nairobi' },
];

// Key wards for pilot counties — Trans Nzoia, Uasin Gishu, Nakuru, Kakamega, Bungoma
const pilotWards: Record<string, string[]> = {
  'Trans Nzoia': [
    'Cherangany', 'Kiminini', 'Waitaluk', 'Sirende', 'Hospital',
    'Kinyoro', 'Matisi', 'Tuwani', 'Saboti', 'Kipsaina',
    'Kwanza', 'Endebess', 'Chepchoina', 'Kaplamai',
  ],
  'Uasin Gishu': [
    'Huruma', 'Langas', 'Racecourse', 'Kapsoya', 'Eldoret East',
    'Kimumu', 'Soy', 'Moi\'s Bridge', 'Ziwa', 'Turbo',
    'Ngenyilel', 'Tapsagoi', 'Kamagut',
  ],
  'Nakuru': [
    'Biashara', 'kivumbini', 'Flamingo', 'Menengai', 'Nakuru East',
    'Njoro', 'Mau Narok', 'Molo', 'Elburgon', 'Turi',
    'Bahati', 'Dundori', 'Kabazi',
  ],
  'Kakamega': [
    'Butere', 'Shinoyi', 'Shitero', 'Lusheya', 'Lureko',
    'Mumias East', 'Mumias West', 'Sabatia', 'Ileho',
    'Khwisero', 'Kisa East', 'Kisa West',
  ],
  'Bungoma': [
    'Musikoma', 'East Sang\'alo', 'Kimilili', 'Kamukuywa',
    'Kibingei', 'Tongaren', 'Naitiri', 'Ndalu',
    'Webuye East', 'Webuye West', 'Mihuu',
  ],
  'Busia': [
    'Bunyala North', 'Bunyala South', 'Bunyala Central',
    'Nambale', 'Butula', 'Elugulu', 'Funyula',
  ],
  'Kericho': [
    'Ainamoi', 'Belgut', 'Sigowet', 'Soin', 'Bureti',
    'Kipkelion East', 'Kipkelion West',
  ],
};

async function main() {
  console.log('🌍 Seeding 47 counties...');

  for (const county of counties) {
    await prisma.county.upsert({
      where: { code: county.code },
      update: { name: county.name },
      create: county,
    });
  }

  console.log('✅ 47 counties seeded.');
  console.log('🏘️  Seeding pilot wards...');

  for (const [countyName, wards] of Object.entries(pilotWards)) {
    const county = await prisma.county.findUnique({ where: { name: countyName } });
    if (!county) { console.warn(`⚠️  County not found: ${countyName}`); continue; }

    for (const wardName of wards) {
      await prisma.ward.upsert({
        where: { countyId_name: { countyId: county.id, name: wardName } },
        update: {},
        create: { name: wardName, countyId: county.id },
      });
    }
    console.log(`✅ Wards seeded for ${countyName}`);
  }

  console.log('🏁 County and ward seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
