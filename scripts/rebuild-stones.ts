import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const CDN_BASE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663282608193';

// Stone data from slab.zip - 3 suppliers: CH Stone, PF Stone, TY Stone
const stones = [
  // CH Stone (6 stones)
  {
    brand: 'CH Stone', series: 'ch01', stone_type: 'sintered',
    price_per_slab: '2800.00',
    image_url: `${CDN_BASE}/qXtXraSkAyMfcwgv.avif`,
    name: JSON.stringify({ en: 'Calacatta Gold', zh: '卡拉卡塔金', fr: 'Calacatta Or' }),
    description: JSON.stringify({
      en: 'Luxe marble veins with a hint of gold. Calacatta Gold reinterprets the rich beauty of Italian Calacatta marble with strong grey veins edged with distinctive yet subtle gold highlights on a lustrous white background. Bookmatch face. Code: M5083. Slab: 3200x1600mm, 20mm thick.',
      zh: '奢华大理石纹理带有金色光泽。卡拉卡塔金重新诠释了意大利卡拉卡塔大理石的丰富美感，在光亮的白色背景上呈现出强烈的灰色纹理，边缘带有独特而微妙的金色亮点。对开面。编号：M5083。板材：3200x1600mm，厚20mm。',
      fr: 'Veines de marbre luxueuses avec une touche dorée. Calacatta Gold réinterprète la riche beauté du marbre italien Calacatta. Face bookmatch. Code: M5083. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['bookmatch', 'gold-veins', 'white-background', 'kitchen', 'bathroom', 'indoor-outdoor'])
  },
  {
    brand: 'CH Stone', series: 'ch02', stone_type: 'sintered',
    price_per_slab: '2200.00',
    image_url: `${CDN_BASE}/mgByrikcSCYtOfjs.avif`,
    name: JSON.stringify({ en: 'Arabescato Corchia', zh: '阿拉贝斯卡托', fr: 'Arabescato Corchia' }),
    description: JSON.stringify({
      en: 'A superb recreation of Italian marble. Arabescato Corchia precisely recreates the beauty of Arabescato marble from Italy\'s Tuscany region. Its intricate web of grey veins across a luminous white background. Single face. Code: M5079. Slab: 3200x1600mm, 20mm thick.',
      zh: '意大利大理石的精湛再现。阿拉贝斯卡托精确再现了意大利托斯卡纳地区阿拉贝斯卡托大理石的美感，在明亮的白色背景上呈现出复杂的灰色纹理网。单面。编号：M5079。板材：3200x1600mm，厚20mm。',
      fr: 'Une superbe recréation du marbre italien. Arabescato Corchia recrée avec précision la beauté du marbre Arabescato de la région toscane. Face simple. Code: M5079. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'grey-veins', 'white-background', 'kitchen', 'indoor-outdoor'])
  },
  {
    brand: 'CH Stone', series: 'ch03', stone_type: 'sintered',
    price_per_slab: '2500.00',
    image_url: `${CDN_BASE}/UEIiXVaxCCcPLneS.avif`,
    name: JSON.stringify({ en: 'Statuario Classico', zh: '经典雕塑白', fr: 'Statuario Classico' }),
    description: JSON.stringify({
      en: 'Timeless Italian elegance. Statuario Classico captures the essence of the finest Italian Statuario marble with bold, dramatic grey veining on a pristine white canvas. Single face. Code: M5081. Slab: 3200x1600mm, 20mm thick.',
      zh: '永恒的意大利优雅。经典雕塑白捕捉了最优质意大利雕塑大理石的精髓，在纯净的白色画布上呈现出大胆、戏剧性的灰色纹理。单面。编号：M5081。板材：3200x1600mm，厚20mm。',
      fr: 'Élégance italienne intemporelle. Statuario Classico capture l\'essence du plus beau marbre Statuario italien. Face simple. Code: M5081. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'bold-veining', 'white', 'classic', 'kitchen', 'bathroom', 'indoor-outdoor'])
  },
  {
    brand: 'CH Stone', series: 'ch04', stone_type: 'sintered',
    price_per_slab: '2600.00',
    image_url: `${CDN_BASE}/LnyEGrvJNxliYUDJ.avif`,
    name: JSON.stringify({ en: 'Noir Elegance', zh: '黑色优雅', fr: 'Noir Élégance' }),
    description: JSON.stringify({
      en: 'Sophisticated dark beauty. Noir Elegance features a deep black base with subtle white veining, creating a dramatic and luxurious surface perfect for modern interiors. Single face. Code: M5090. Slab: 3200x1600mm, 20mm thick.',
      zh: '精致的深色之美。黑色优雅以深黑色为底，配以微妙的白色纹理，打造出戏剧性和奢华的表面，完美适合现代室内装饰。单面。编号：M5090。板材：3200x1600mm，厚20mm。',
      fr: 'Beauté sombre sophistiquée. Noir Élégance présente une base noire profonde avec des veines blanches subtiles. Face simple. Code: M5090. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'black', 'white-veins', 'modern', 'dramatic', 'indoor-outdoor'])
  },
  {
    brand: 'CH Stone', series: 'ch05', stone_type: 'sintered',
    price_per_slab: '2400.00',
    image_url: `${CDN_BASE}/QCLkiyOcsaPQJJhh.avif`,
    name: JSON.stringify({ en: 'Bianco Lasa', zh: '拉萨白', fr: 'Bianco Lasa' }),
    description: JSON.stringify({
      en: 'Pure alpine elegance. Bianco Lasa recreates the pristine beauty of marble from the Italian Alps, featuring soft grey veining on a warm white background. Single face. Code: M5085. Slab: 3200x1600mm, 20mm thick.',
      zh: '纯净的阿尔卑斯优雅。拉萨白再现了意大利阿尔卑斯山大理石的纯净之美，在温暖的白色背景上呈现出柔和的灰色纹理。单面。编号：M5085。板材：3200x1600mm，厚20mm。',
      fr: 'Élégance alpine pure. Bianco Lasa recrée la beauté pristine du marbre des Alpes italiennes. Face simple. Code: M5085. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'soft-veining', 'warm-white', 'alpine', 'kitchen', 'indoor-outdoor'])
  },
  {
    brand: 'CH Stone', series: 'ch06', stone_type: 'sintered',
    price_per_slab: '2300.00',
    image_url: `${CDN_BASE}/wlfCTwePtvRfspId.avif`,
    name: JSON.stringify({ en: 'Emperador Dark', zh: '深啡网', fr: 'Emperador Foncé' }),
    description: JSON.stringify({
      en: 'Rich and warm dark tones. Emperador Dark captures the warmth of Spanish Emperador marble with deep brown tones and lighter veining. Single face. Code: M5092. Slab: 3200x1600mm, 20mm thick.',
      zh: '丰富而温暖的深色调。深啡网捕捉了西班牙深啡网大理石的温暖，以深棕色调和较浅的纹理呈现。单面。编号：M5092。板材：3200x1600mm，厚20mm。',
      fr: 'Tons sombres riches et chaleureux. Emperador Foncé capture la chaleur du marbre espagnol Emperador. Face simple. Code: M5092. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'brown', 'warm', 'spanish', 'traditional', 'indoor-outdoor'])
  },
  // PF Stone (5 stones)
  {
    brand: 'PF Stone', series: 'pf01', stone_type: 'sintered',
    price_per_slab: '3200.00',
    image_url: `${CDN_BASE}/MlxdUwSGHpnATyrT.avif`,
    name: JSON.stringify({ en: 'Calacatta Viola', zh: '卡拉卡塔紫罗兰', fr: 'Calacatta Viola' }),
    description: JSON.stringify({
      en: 'Dramatic purple-toned veining. Calacatta Viola features striking violet and grey veins flowing across a luminous white surface, creating an unforgettable visual statement. Bookmatch face. Code: M5088. Slab: 3200x1600mm, 20mm thick.',
      zh: '戏剧性的紫色调纹理。卡拉卡塔紫罗兰以引人注目的紫色和灰色纹理流淌在明亮的白色表面上，创造出令人难忘的视觉效果。对开面。编号：M5088。板材：3200x1600mm，厚20mm。',
      fr: 'Veines dramatiques aux tons violets. Calacatta Viola présente des veines violettes et grises frappantes. Face bookmatch. Code: M5088. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['bookmatch', 'violet', 'dramatic', 'white-background', 'luxury', 'indoor-outdoor'])
  },
  {
    brand: 'PF Stone', series: 'pf02', stone_type: 'sintered',
    price_per_slab: '2100.00',
    image_url: `${CDN_BASE}/tPrkiDGHAJQbBQig.avif`,
    name: JSON.stringify({ en: 'Travertino Classico', zh: '经典洞石', fr: 'Travertino Classico' }),
    description: JSON.stringify({
      en: 'Warm Mediterranean charm. Travertino Classico recreates the timeless appeal of natural travertine with warm beige tones and characteristic pitting patterns. Single face. Code: M5095. Slab: 3200x1600mm, 20mm thick.',
      zh: '温暖的地中海魅力。经典洞石再现了天然洞石的永恒魅力，以温暖的米色调和特征性的坑洞图案呈现。单面。编号：M5095。板材：3200x1600mm，厚20mm。',
      fr: 'Charme méditerranéen chaleureux. Travertino Classico recrée l\'attrait intemporel du travertin naturel. Face simple. Code: M5095. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'beige', 'warm', 'mediterranean', 'travertine', 'indoor-outdoor'])
  },
  {
    brand: 'PF Stone', series: 'pf03', stone_type: 'sintered',
    price_per_slab: '2400.00',
    image_url: `${CDN_BASE}/PNkyjMKDrKUhxpNQ.avif`,
    name: JSON.stringify({ en: 'Grigio Carnico', zh: '卡尼科灰', fr: 'Grigio Carnico' }),
    description: JSON.stringify({
      en: 'Cool grey sophistication. Grigio Carnico features elegant grey tones with flowing white veins, inspired by the prized marble from Italy\'s Carnic Alps. Single face. Code: M5087. Slab: 3200x1600mm, 20mm thick.',
      zh: '冷灰色的精致。卡尼科灰以优雅的灰色调和流动的白色纹理为特色，灵感来自意大利卡尼克阿尔卑斯山的珍贵大理石。单面。编号：M5087。板材：3200x1600mm，厚20mm。',
      fr: 'Sophistication grise et fraîche. Grigio Carnico présente des tons gris élégants avec des veines blanches fluides. Face simple. Code: M5087. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'grey', 'white-veins', 'cool', 'alpine', 'indoor-outdoor'])
  },
  {
    brand: 'PF Stone', series: 'pf04', stone_type: 'sintered',
    price_per_slab: '3500.00',
    image_url: `${CDN_BASE}/jHkdOgUPGaNJeuTh.avif`,
    name: JSON.stringify({ en: 'Onyx Jade', zh: '玉石翡翠', fr: 'Onyx Jade' }),
    description: JSON.stringify({
      en: 'Exotic translucent beauty. Onyx Jade captures the mesmerizing translucency of natural onyx with rich green and jade tones. Polished finish. Indoor use only. Single face. Code: M5099. Slab: 3200x1600mm, 20mm thick.',
      zh: '异域半透明之美。玉石翡翠捕捉了天然玛瑙的迷人半透明感，以丰富的绿色和翡翠色调呈现。抛光面。仅限室内使用。单面。编号：M5099。板材：3200x1600mm，厚20mm。',
      fr: 'Beauté translucide exotique. Onyx Jade capture la translucidité fascinante de l\'onyx naturel. Finition polie. Usage intérieur uniquement. Code: M5099. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'polished', 'green', 'jade', 'translucent', 'luxury', 'indoor-only'])
  },
  {
    brand: 'PF Stone', series: 'pf05', stone_type: 'sintered',
    price_per_slab: '2700.00',
    image_url: `${CDN_BASE}/uocyhyYLmEVliXST.avif`,
    name: JSON.stringify({ en: 'Sahara Noir', zh: '撒哈拉黑', fr: 'Sahara Noir' }),
    description: JSON.stringify({
      en: 'Desert night elegance. Sahara Noir features a deep black surface with golden-brown veining reminiscent of desert sands under moonlight. Single face. Code: M5091. Slab: 3200x1600mm, 20mm thick.',
      zh: '沙漠之夜的优雅。撒哈拉黑以深黑色表面配以金棕色纹理，让人联想到月光下的沙漠。单面。编号：M5091。板材：3200x1600mm，厚20mm。',
      fr: 'Élégance de nuit désertique. Sahara Noir présente une surface noire profonde avec des veines brun doré. Face simple. Code: M5091. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'black', 'gold-veins', 'dramatic', 'desert', 'indoor-outdoor'])
  },
  // TY Stone (5 stones)
  {
    brand: 'TY Stone', series: 'ty01', stone_type: 'sintered',
    price_per_slab: '2000.00',
    image_url: `${CDN_BASE}/SPMGpCgpxXEPBnnv.avif`,
    name: JSON.stringify({ en: 'Invisible Grey', zh: '隐形灰', fr: 'Gris Invisible' }),
    description: JSON.stringify({
      en: 'Subtle and refined. Invisible Grey features an ultra-clean grey surface with barely perceptible veining, perfect for minimalist contemporary designs. Single face. Code: M5086. Slab: 3200x1600mm, 20mm thick.',
      zh: '微妙而精致。隐形灰以超干净的灰色表面和几乎不可察觉的纹理为特色，完美适合极简当代设计。单面。编号：M5086。板材：3200x1600mm，厚20mm。',
      fr: 'Subtil et raffiné. Gris Invisible présente une surface grise ultra-propre avec des veines à peine perceptibles. Face simple. Code: M5086. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'grey', 'minimalist', 'contemporary', 'clean', 'indoor-outdoor'])
  },
  {
    brand: 'TY Stone', series: 'ty02', stone_type: 'sintered',
    price_per_slab: '2600.00',
    image_url: `${CDN_BASE}/yVUDXsKrVavHvlVj.avif`,
    name: JSON.stringify({ en: 'Pietra Grey', zh: '灰石', fr: 'Pietra Gris' }),
    description: JSON.stringify({
      en: 'Deep grey with character. Pietra Grey recreates the beauty of Iranian Pietra Grey marble with rich dark grey tones and striking white veining. Single face. Code: M5084. Slab: 3200x1600mm, 20mm thick.',
      zh: '有个性的深灰色。灰石再现了伊朗灰石大理石的美感，以丰富的深灰色调和引人注目的白色纹理呈现。单面。编号：M5084。板材：3200x1600mm，厚20mm。',
      fr: 'Gris profond avec caractère. Pietra Gris recrée la beauté du marbre Pietra Grey iranien. Face simple. Code: M5084. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'dark-grey', 'white-veins', 'iranian', 'dramatic', 'indoor-outdoor'])
  },
  {
    brand: 'TY Stone', series: 'ty03', stone_type: 'sintered',
    price_per_slab: '3000.00',
    image_url: `${CDN_BASE}/zYWXUHRIDgXrVvsh.avif`,
    name: JSON.stringify({ en: 'Arabescato Orobico', zh: '奥罗比科', fr: 'Arabescato Orobico' }),
    description: JSON.stringify({
      en: 'Bold artistic veining. Arabescato Orobico features dramatic, sweeping grey and brown veins creating an almost painterly effect on a warm white base. Bookmatch face. Code: M5080. Slab: 3200x1600mm, 20mm thick.',
      zh: '大胆的艺术纹理。奥罗比科以戏剧性的、流畅的灰色和棕色纹理在温暖的白色底色上创造出几乎如画般的效果。对开面。编号：M5080。板材：3200x1600mm，厚20mm。',
      fr: 'Veines artistiques audacieuses. Arabescato Orobico présente des veines grises et brunes dramatiques. Face bookmatch. Code: M5080. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['bookmatch', 'artistic', 'grey-brown', 'dramatic', 'warm-white', 'indoor-outdoor'])
  },
  {
    brand: 'TY Stone', series: 'ty04', stone_type: 'sintered',
    price_per_slab: '1900.00',
    image_url: `${CDN_BASE}/kARdBBDsFLmiqSjq.avif`,
    name: JSON.stringify({ en: 'Big White', zh: '大白', fr: 'Grand Blanc' }),
    description: JSON.stringify({
      en: 'A superb recreation of Italian marble. Big White precisely recreates the beauty of Arabescato marble from Italy\'s Tuscany region with grey veins across a luminous white background. Single face. Code: M5079. Slab: 3200x1600mm, 20mm thick.',
      zh: '意大利大理石的精湛再现。大白精确再现了意大利托斯卡纳地区阿拉贝斯卡托大理石的美感，在明亮的白色背景上呈现灰色纹理。单面。编号：M5079。板材：3200x1600mm，厚20mm。',
      fr: 'Une superbe recréation du marbre italien. Grand Blanc recrée avec précision la beauté du marbre Arabescato. Face simple. Code: M5079. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['single-face', 'white', 'grey-veins', 'classic', 'versatile', 'indoor-outdoor'])
  },
  {
    brand: 'TY Stone', series: 'ty05', stone_type: 'sintered',
    price_per_slab: '2900.00',
    image_url: `${CDN_BASE}/uhqaRtltjfvzMEhF.avif`,
    name: JSON.stringify({ en: 'Calacatta Oro', zh: '卡拉卡塔奥罗', fr: 'Calacatta Oro' }),
    description: JSON.stringify({
      en: 'Luxe marble veins with a hint of gold. Calacatta Oro reinterprets the rich beauty of Italian Calacatta marble with strong grey veins edged with distinctive yet subtle gold highlights on a lustrous white background. Bookmatch face. Code: M5083. Slab: 3200x1600mm, 20mm thick.',
      zh: '奢华大理石纹理带有金色光泽。卡拉卡塔奥罗重新诠释了意大利卡拉卡塔大理石的丰富美感，在光亮的白色背景上呈现出强烈的灰色纹理，边缘带有独特而微妙的金色亮点。对开面。编号：M5083。板材：3200x1600mm，厚20mm。',
      fr: 'Veines de marbre luxueuses avec une touche dorée. Calacatta Oro réinterprète la riche beauté du marbre Calacatta italien. Face bookmatch. Code: M5083. Dalle: 3200x1600mm, épaisseur 20mm.'
    }),
    tags: JSON.stringify(['bookmatch', 'gold', 'luxury', 'white-background', 'italian', 'indoor-outdoor'])
  },
];

async function main() {
  console.log('Getting tenant ID for CH Stone...');
  const tenantResult = await client.execute("SELECT id FROM tenants WHERE name LIKE '%CH%' OR name LIKE '%Stone%' OR id = 1 LIMIT 1");
  
  if (tenantResult.rows.length === 0) {
    console.error('No tenant found!');
    process.exit(1);
  }
  
  const tenantId = tenantResult.rows[0].id;
  console.log(`Using tenant ID: ${tenantId}`);
  
  // Clear dependent records first (foreign key constraints)
  console.log('Clearing dependent records...');
  await client.execute({ sql: 'DELETE FROM order_photos WHERE tenant_id = ?', args: [tenantId as number] });
  await client.execute({ sql: 'DELETE FROM client_orders WHERE tenant_id = ?', args: [tenantId as number] });
  
  // Clear existing stones for this tenant
  console.log('Clearing existing stones...');
  await client.execute({ sql: 'DELETE FROM inventory_stones WHERE tenant_id = ?', args: [tenantId as number] });
  
  // Clear existing calculation items
  console.log('Clearing existing calculation items...');
  await client.execute({ sql: 'DELETE FROM calculation_items WHERE tenant_id = ?', args: [tenantId as number] });
  
  // Insert new stones
  console.log('Inserting new stones...');
  for (const stone of stones) {
    await client.execute({
      sql: `INSERT INTO inventory_stones (tenant_id, brand, series, stone_type, price_per_slab, image_url, name, description, tags, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [tenantId as number, stone.brand, stone.series, stone.stone_type, stone.price_per_slab, stone.image_url, stone.name, stone.description, stone.tags],
    });
    console.log(`  Inserted: ${stone.brand} ${stone.series} - ${JSON.parse(stone.name).en}`);
  }
  
  // Insert fabrication calculation items per original idea.txt
  console.log('Inserting fabrication calculation items...');
  const calcItems = [
    { name: 'Straight Cut', unit: 'per_sqft', price: '30.00', order: 1 },
    { name: '45-Degree Cut', unit: 'per_sqft', price: '45.00', order: 2 },
    { name: 'Waterfall', unit: 'per_sqft', price: '60.00', order: 3 },
    { name: 'Double Edge', unit: 'per_sqft', price: '50.00', order: 4 },
    { name: 'Single Edge', unit: 'per_sqft', price: '35.00', order: 5 },
    { name: 'Labour Cost', unit: 'per_hour', price: '40.00', order: 6 },
    { name: 'Fabrication Material Cost', unit: 'per_sqft', price: '3.00', order: 7 },
  ];
  
  for (const item of calcItems) {
    await client.execute({
      sql: `INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
      args: [tenantId as number, item.name, item.unit, item.price, item.order],
    });
    console.log(`  Inserted calc item: ${item.name} - $${item.price}/${item.unit}`);
  }
  
  // Update tenant info with logo URLs
  const logoUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663282608193/cfmBISoPXaAKaPsw.png';
  await client.execute({
    sql: `UPDATE tenants SET theme_logo_url = ?, name = 'CH Stone' WHERE id = ?`,
    args: [logoUrl, tenantId as number],
  });
  console.log('Updated tenant logo and name.');
  
  console.log('\nDone! Inserted ' + stones.length + ' stones and ' + calcItems.length + ' calculation items.');
}

main().catch(console.error);
