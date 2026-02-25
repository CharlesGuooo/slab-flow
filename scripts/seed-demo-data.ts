/**
 * SlabFlow Demo Data Seeding Script
 * Run with: npx tsx scripts/seed-demo-data.ts
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const db = new Database('slabflow-local.db');

// Stone products data extracted from txt files
const stoneProducts = [
  // CH Brand (ch01-ch06)
  {
    id: 'ch01',
    brand: 'CH Stone',
    series: 'Premium',
    code: 'M5098',
    name: { en: 'Natural Taj Mahal', zh: '自然泰姬陵', fr: 'Taj Mahal Naturel' },
    description: {
      en: 'A stunning tribute to timeless beauty with captivating bookmatch design that blends soft cream, warm beige, and subtle grey veins. Soft matt finish enhances its natural texture.',
      zh: '永恒之美的绝妙致敬，迷人的对纹设计和谐融合了柔和的奶油色、温暖的米色和微妙的灰色纹理。哑光表面增强其自然质感。',
      fr: 'Un hommage époustouflant à la beauté intemporelle avec un design bookmatch captivant qui mélange crème douce, beige chaud et veines grises subtiles.'
    },
    stoneType: 'quartzite',
    face: 'bookmatch',
    finish: 'soft-matt',
    pricePerSlab: '2800.00',
    tags: ['premium', 'bookmatch', 'cream', 'eco-certified']
  },
  {
    id: 'ch02',
    brand: 'CH Stone',
    series: 'Premium',
    code: 'V1040',
    name: { en: 'Kunlun Black', zh: '昆仑黑', fr: 'Noir Kunlun' },
    description: {
      en: 'A striking and bold statement of elegance. Deep, rich black tones with subtle veining patterns create a dramatic yet refined aesthetic. Bookmatch design brings balance and sophistication.',
      zh: '优雅的醒目大胆宣言。深邃浓郁的黑色调配合微妙的纹理图案，营造出戏剧性而精致的视觉效果。对纹设计带来平衡与高贵。',
      fr: 'Une déclaration audacieuse et frappante d\'élégance. Tons noirs profonds et riches avec des motifs de veines subtils.'
    },
    stoneType: 'quartzite',
    face: 'bookmatch',
    finish: 'matt',
    pricePerSlab: '3200.00',
    tags: ['premium', 'bookmatch', 'black', 'dramatic']
  },
  {
    id: 'ch03',
    brand: 'CH Stone',
    series: 'Classic',
    code: 'M5085',
    name: { en: 'Carrara Gold', zh: '卡拉拉金', fr: 'Carrara Or' },
    description: {
      en: 'A refined fusion of elegance and luxury. Soft, creamy white tones complemented by delicate golden veins. Creates a serene yet opulent atmosphere.',
      zh: '优雅与奢华的精致融合。柔和的奶白色调配以精致的金色纹理。营造出宁静而华丽的氛围。',
      fr: 'Une fusion raffinée d\'élégance et de luxe. Tons blancs crémeux doux complétés par des veines dorées délicates.'
    },
    stoneType: 'marble',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '3500.00',
    tags: ['classic', 'gold', 'luxury', 'marble-look']
  },
  {
    id: 'ch04',
    brand: 'CH Stone',
    series: 'Classic',
    code: 'M5047',
    name: { en: 'Bianco Rumeno', zh: '罗马尼亚白', fr: 'Blanc Roumain' },
    description: {
      en: 'The epitome of classic luxury with striking bookmatch pattern combining pure whites and delicate grey veins. Soft matt finish enhances sophisticated texture.',
      zh: '经典奢华的典范，醒目的对纹图案结合纯白与精致的灰色纹理。哑光表面提升优雅质感。',
      fr: 'L\'épité du luxe classique avec un motif bookmatch frappant combinant blancs purs et veines grises délicates.'
    },
    stoneType: 'marble',
    face: 'bookmatch',
    finish: 'soft-matt',
    pricePerSlab: '2600.00',
    tags: ['classic', 'bookmatch', 'white', 'elegant']
  },
  {
    id: 'ch05',
    brand: 'CH Stone',
    series: 'Modern',
    code: 'M3010',
    name: { en: 'Snow X', zh: '雪花白', fr: 'Neige X' },
    description: {
      en: 'A brilliant display of pristine elegance. Striking white surface with delicate veining evokes the beauty of fresh snowflakes. Pure, luminous appearance.',
      zh: '纯净优雅的绝妙展现。醒目的白色表面配以精致的纹理，唤起新鲜雪花的美丽。纯净、明亮的外观。',
      fr: 'Une brillante démonstration d\'élégance pristine. Surface blanche frappante avec veines délicates.'
    },
    stoneType: 'quartz',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '2200.00',
    tags: ['modern', 'white', 'pure', 'luminous']
  },
  {
    id: 'ch06',
    brand: 'CH Stone',
    series: 'Bold',
    code: 'M5049',
    name: { en: 'Calacatta Viola', zh: '卡拉卡塔紫', fr: 'Calacatta Violette' },
    description: {
      en: 'Make a bold visual statement. Dramatic grape-purple veins on a white base create a stunning centerpiece for indoor and outdoor spaces.',
      zh: '大胆的视觉宣言。白色底色上的戏剧性葡萄紫纹理为室内外空间创造惊艳的焦点。',
      fr: 'Faites une déclaration visuelle audacieuse. Veines violet-raisin dramatiques sur base blanche.'
    },
    stoneType: 'marble',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '3800.00',
    tags: ['bold', 'purple', 'dramatic', 'statement']
  },
  // PF Brand (pf01-pf05)
  {
    id: 'pf01',
    brand: 'PF Surface',
    series: 'Pure',
    code: 'M1911',
    name: { en: 'Pure White', zh: '纯白', fr: 'Blanc Pur' },
    description: {
      en: 'Our purest, most pristine white. Ideal for white-on-white spaces and monochromatic designs. Refreshes colourful and textural décor.',
      zh: '我们最纯净、最原始的白色。非常适合全白空间和单色设计。为多彩和质感装饰带来清新感。',
      fr: 'Notre blanc le plus pur et le plus immaculé. Idéal pour les espaces tout blanc.'
    },
    stoneType: 'quartz',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '1800.00',
    tags: ['pure', 'white', 'minimal', 'monochrome']
  },
  {
    id: 'pf02',
    brand: 'PF Surface',
    series: 'Elegant',
    code: 'M4017',
    name: { en: 'Lauren White', zh: '劳伦白', fr: 'Blanc Lauren' },
    description: {
      en: 'A perfect blend of sophistication and simplicity. Soft, luminous white surface with subtle veins creates a gentle, sophisticated texture.',
      zh: '精致与简约的完美融合。柔和、明亮的白色表面配以微妙纹理，营造出温和优雅的质感。',
      fr: 'Un mélange parfait de sophistication et de simplicité. Surface blanche douce et lumineuse.'
    },
    stoneType: 'quartz',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '2000.00',
    tags: ['elegant', 'white', 'sophisticated', 'subtle']
  },
  {
    id: 'pf03',
    brand: 'PF Surface',
    series: 'Natural',
    code: 'V6011',
    name: { en: 'Bursa Grey', zh: '布尔萨灰', fr: 'Gris Bursa' },
    description: {
      en: 'The greys and grains of granite. Charcoal grey surface that resembles granite with volcanic rock effect blended with scattered stone fragments.',
      zh: '花岗岩的灰色与纹理。炭灰色表面酷似花岗岩，火山岩效果与散落的石碎片完美融合。',
      fr: 'Les gris et les grains du granit. Surface gris charbon ressemblant au granit.'
    },
    stoneType: 'granite',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '2400.00',
    tags: ['natural', 'grey', 'granite-look', 'textured']
  },
  {
    id: 'pf04',
    brand: 'PF Surface',
    series: 'Luxury',
    code: 'M5086',
    name: { en: 'Calacatta Royale', zh: '皇家卡拉卡塔', fr: 'Calacatta Royale' },
    description: {
      en: 'A marble style of warmth and sophistication. Remarkable recreation of natural Italian marble with brown-grey veins on creamy white background.',
      zh: '温暖与精致的大理石风格。对意大利天然大理石的卓越再现，奶油白底色配以棕灰色纹理。',
      fr: 'Un style marbre de chaleur et de sophistication. Recréation remarquable du marbre italien naturel.'
    },
    stoneType: 'marble',
    face: 'bookmatch',
    finish: 'matt',
    pricePerSlab: '3600.00',
    tags: ['luxury', 'bookmatch', 'warm', 'italian']
  },
  {
    id: 'pf05',
    brand: 'PF Surface',
    series: 'Artisan',
    code: 'M5081',
    name: { en: 'Fusion White', zh: '融合白', fr: 'Blanc Fusion' },
    description: {
      en: 'Greek marble elegance. Beautifully replicates stunning marble quarried in Greece, distinguished by thick ribbons of silvery veins with gold and amber accents.',
      zh: '希腊大理石的优雅。完美复制希腊开采的绝美大理石，以银色纹理配以金色和琥珀色点缀为特色。',
      fr: 'Élégance du marbre grec. Réplique magnifiquement le superbe marbre extrait en Grèce.'
    },
    stoneType: 'marble',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '3200.00',
    tags: ['artisan', 'greek', 'gold-accents', 'elegant']
  },
  // TY Brand (ty01-ty05)
  {
    id: 'ty01',
    brand: 'TY Marble',
    series: 'Luxury',
    code: 'M1050',
    name: { en: 'Luxury White', zh: '奢华白', fr: 'Blanc Luxe' },
    description: {
      en: 'An opulent Italian marble style. Stunning combination of gold, amber and grey veins sweeping across a grey-white background for visual impact.',
      zh: '奢华的意大利大理石风格。金色、琥珀色和灰色纹理在灰白底色上流淌，带来视觉冲击。',
      fr: 'Un style marbre italien opulent. Combinaison époustouflante de veines dorées, ambre et grises.'
    },
    stoneType: 'marble',
    face: 'bookmatch',
    finish: 'matt',
    pricePerSlab: '4200.00',
    tags: ['luxury', 'bookmatch', 'gold', 'italian']
  },
  {
    id: 'ty02',
    brand: 'TY Marble',
    series: 'Natural',
    code: 'M5080',
    name: { en: 'Super White', zh: '超级白', fr: 'Super Blanc' },
    description: {
      en: 'Brazilian grey marble beauty. Recreates the harmonious grey tones, from light to dark, distinguished by this superb Brazilian stone.',
      zh: '巴西灰色大理石之美。再现这种绝佳巴西石材独特的从浅到深的和谐灰色调。',
      fr: 'Beauté du marbre gris brésilien. Recrée les tons gris harmonieux, du clair au foncé.'
    },
    stoneType: 'quartzite',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '2600.00',
    tags: ['natural', 'grey', 'brazilian', 'harmonious']
  },
  {
    id: 'ty03',
    brand: 'TY Marble',
    series: 'Classic',
    code: 'M5079',
    name: { en: 'Big White', zh: '大花白', fr: 'Grand Blanc' },
    description: {
      en: 'A superb recreation of Italian marble. Precisely recreates the beauty of Arabescato marble from Tuscany with intricate web of grey veins on luminous white.',
      zh: '对意大利大理石的卓越再现。精确重现托斯卡纳阿拉贝斯卡托大理石之美，明亮白色上的灰色纹理网。',
      fr: 'Une superbe recréation du marbre italien. Recrée précisément la beauté du marbre Arabescato.'
    },
    stoneType: 'marble',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '3000.00',
    tags: ['classic', 'white', 'italian', 'tuscany']
  },
  {
    id: 'ty04',
    brand: 'TY Marble',
    series: 'Unique',
    code: 'M5082',
    name: { en: 'Calacatta Verde', zh: '绿纹卡拉卡塔', fr: 'Calacatta Vert' },
    description: {
      en: 'The beauty of prized green marble. Stunning interplay of green veins, from moss to emerald to sage, blended with greys on grey-white background.',
      zh: '珍贵绿色大理石之美。绿色纹理的惊艳交织，从苔藓绿到翡翠绿再到鼠尾草绿，与灰色在灰白底色上融合。',
      fr: 'La beauté du précieux marbre vert. Jeu époustouflant de veines vertes.'
    },
    stoneType: 'marble',
    face: 'single',
    finish: 'matt',
    pricePerSlab: '4000.00',
    tags: ['unique', 'green', 'emerald', 'sage']
  },
  {
    id: 'ty05',
    brand: 'TY Marble',
    series: 'Premium',
    code: 'M5083',
    name: { en: 'Calacatta Oro', zh: '金纹卡拉卡塔', fr: 'Calacatta Oro' },
    description: {
      en: 'Luxe marble veins with a hint of gold. Reinterprets rich beauty of Italian Calacatta with strong grey veins edged with subtle gold highlights.',
      zh: '带金色暗示的奢华大理石纹理。重新诠释意大利卡拉卡塔的丰富之美，强灰色纹理边缘配以微妙的金色亮点。',
      fr: 'Veines de marbre luxueuses avec une touche d\'or. Réinterprète la riche beauté du Calacatta italien.'
    },
    stoneType: 'marble',
    face: 'bookmatch',
    finish: 'matt',
    pricePerSlab: '4500.00',
    tags: ['premium', 'bookmatch', 'gold', 'calacatta']
  }
];

// Demo users data
const demoUsers = [
  { username: 'John Smith', email: 'john.smith@email.com', phone: '555-0101' },
  { username: 'Emily Chen', email: 'emily.chen@email.com', phone: '555-0102' },
  { username: 'Michael Johnson', email: 'michael.j@email.com', phone: '555-0103' },
  { username: 'Sarah Williams', email: 'sarah.w@email.com', phone: '555-0104' },
  { username: 'David Lee', email: 'david.lee@email.com', phone: '555-0105' },
  { username: '王明', email: 'wangming@email.com', phone: '555-0106' },
  { username: '李华', email: 'lihua@email.com', phone: '555-0107' },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Get the test tenant ID
    const tenant = db.prepare('SELECT id FROM tenants WHERE domain = ?').get('test-company.localhost') as { id: number } | undefined;

    if (!tenant) {
      console.error('❌ Test tenant not found. Please run the app first to initialize the database.');
      process.exit(1);
    }

    const tenantId = tenant.id;
    console.log(`✅ Found tenant ID: ${tenantId}\n`);

    // Update tenant with 3D feature enabled and better settings
    db.prepare(`
      UPDATE tenants SET
        feature_3d_reconstruction = 1,
        feature_chatbot = 1,
        feature_calculator = 1,
        ai_monthly_budget = '100.00',
        contact_phone = '(555) 123-4567',
        contact_email = 'info@test-company.com',
        address = '123 Stone Avenue, Granite City, GC 12345',
        theme_primary_color = '#2563eb'
      WHERE id = ?
    `).run(tenantId);
    console.log('✅ Updated tenant settings\n');

    // Clear existing inventory
    db.prepare('DELETE FROM inventory_stones WHERE tenant_id = ?').run(tenantId);
    console.log('🗑️  Cleared existing inventory\n');

    // Insert stone products
    console.log('📦 Inserting stone products...');
    const insertStone = db.prepare(`
      INSERT INTO inventory_stones (
        tenant_id, brand, series, stone_type, price_per_slab,
        image_url, name, description, tags, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const stone of stoneProducts) {
      const imageUrl = `/images/stones/${stone.id}.avif`;
      const nameJson = JSON.stringify(stone.name);
      const descJson = JSON.stringify(stone.description);
      const tagsJson = JSON.stringify(stone.tags);

      insertStone.run(
        tenantId,
        stone.brand,
        stone.series,
        stone.stoneType,
        stone.pricePerSlab,
        imageUrl,
        nameJson,
        descJson,
        tagsJson
      );
      console.log(`   ✓ ${stone.name.en} (${stone.brand}) - $${stone.pricePerSlab}`);
    }
    console.log(`\n✅ Inserted ${stoneProducts.length} stone products\n`);

    // Clear existing users
    db.prepare('DELETE FROM users WHERE tenant_id = ?').run(tenantId);
    console.log('🗑️  Cleared existing users\n');

    // Insert demo users
    console.log('👥 Inserting demo users...');
    const insertUser = db.prepare(`
      INSERT INTO users (tenant_id, username, email, phone, pin, ai_credits)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const hashedPin = await bcrypt.hash('123456', 10);
    const userIds: number[] = [];

    for (const user of demoUsers) {
      const result = insertUser.run(
        tenantId,
        user.username,
        user.email,
        user.phone,
        hashedPin,
        '15.00'
      );
      userIds.push(result.lastInsertRowid as number);
      console.log(`   ✓ ${user.username} (${user.email})`);
    }
    console.log(`\n✅ Inserted ${demoUsers.length} demo users\n`);

    // Clear existing orders
    db.prepare('DELETE FROM client_orders WHERE tenant_id = ?').run(tenantId);
    console.log('🗑️  Cleared existing orders\n');

    // Insert demo orders with different statuses
    console.log('📋 Inserting demo orders...');
    const orderStatuses = ['pending_quote', 'quoted', 'in_progress', 'completed'];
    const stoneIds = db.prepare('SELECT id FROM inventory_stones WHERE tenant_id = ?').all(tenantId) as { id: number }[];

    const insertOrder = db.prepare(`
      INSERT INTO client_orders (
        tenant_id, user_id, stone_id, stone_selection_text, desired_date,
        is_contractor, total_budget, notes, status, final_quote_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orders: { id: number; userId: number; status: string }[] = [];

    // Create orders for each user
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const numOrders = Math.floor(Math.random() * 3) + 1; // 1-3 orders per user

      for (let j = 0; j < numOrders; j++) {
        const stoneId = stoneIds[Math.floor(Math.random() * stoneIds.length)].id;
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const isContractor = Math.random() > 0.7 ? 1 : 0;
        const budget = (Math.floor(Math.random() * 5) + 3) * 1000; // $3000-$7000
        const quotePrice = status !== 'pending_quote' ? (budget * 0.8).toFixed(2) : null;

        const result = insertOrder.run(
          tenantId,
          userId,
          stoneId,
          null,
          ['ASAP', 'within_2_weeks', 'within_a_month', 'not_in_a_hurry'][Math.floor(Math.random() * 4)],
          isContractor,
          budget.toString(),
          `Demo order #${orders.length + 1} - ${status.replace('_', ' ')}`,
          status,
          quotePrice
        );

        orders.push({
          id: result.lastInsertRowid as number,
          userId,
          status
        });
      }
    }
    console.log(`\n✅ Inserted ${orders.length} demo orders\n`);

    // Insert some order photos
    console.log('📷 Inserting order photos...');
    db.prepare('DELETE FROM order_photos WHERE tenant_id = ?').run(tenantId);

    const insertPhoto = db.prepare(`
      INSERT INTO order_photos (tenant_id, order_id, image_url, photo_type)
      VALUES (?, ?, ?, ?)
    `);

    // Add photos to some orders
    const photoCount = Math.min(5, orders.length);
    for (let i = 0; i < photoCount; i++) {
      const order = orders[i];
      insertPhoto.run(
        tenantId,
        order.id,
        `/images/stones/ch0${i + 1}.avif`,
        'user_upload'
      );
    }
    console.log(`\n✅ Inserted ${photoCount} order photos\n`);

    // Clear and re-insert calculation items
    db.prepare('DELETE FROM calculation_items WHERE tenant_id = ?').run(tenantId);
    console.log('🗑️  Cleared existing calculation items\n');

    console.log('🧮 Inserting calculation items...');
    const calcItems = [
      { name: 'Straight Cut', unit: 'per_unit', price: '50.00', order: 1 },
      { name: 'Mitered Edge (45°)', unit: 'per_sqft', price: '35.00', order: 2 },
      { name: 'Waterfall Edge', unit: 'per_sqft', price: '45.00', order: 3 },
      { name: 'Full Height Backsplash', unit: 'per_sqft', price: '55.00', order: 4 },
      { name: 'Undermount Sink Cutout', unit: 'per_unit', price: '150.00', order: 5 },
      { name: 'Faucet Hole', unit: 'per_unit', price: '25.00', order: 6 },
      { name: 'Cooktop Cutout', unit: 'per_unit', price: '100.00', order: 7 },
      { name: 'Installation', unit: 'per_sqft', price: '25.00', order: 8 },
      { name: 'Template & Measure', unit: 'per_unit', price: '150.00', order: 9 },
      { name: 'Delivery (within 50km)', unit: 'per_unit', price: '0.00', order: 10 },
      { name: 'Sealing', unit: 'per_sqft', price: '5.00', order: 11 },
      { name: 'Demo & Removal', unit: 'per_sqft', price: '15.00', order: 12 },
    ];

    const insertCalcItem = db.prepare(`
      INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of calcItems) {
      insertCalcItem.run(tenantId, item.name, item.unit, item.price, item.order);
      console.log(`   ✓ ${item.name} - $${item.price}/${item.unit.replace('per_', '')}`);
    }
    console.log(`\n✅ Inserted ${calcItems.length} calculation items\n`);

    // Summary
    console.log('=' .repeat(50));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('=' .repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   • Stone Products: ${stoneProducts.length}`);
    console.log(`   • Demo Users: ${demoUsers.length}`);
    console.log(`   • Demo Orders: ${orders.length}`);
    console.log(`   • Order Photos: ${photoCount}`);
    console.log(`   • Calculation Items: ${calcItems.length}`);
    console.log('\n🔐 Test Credentials:');
    console.log('   • Tenant Admin: admin@test-company.localhost / tenant123');
    console.log('   • Client PIN: 123456 (for all demo users)');
    console.log('\n📁 Images Location:');
    console.log('   • /public/images/stones/ (15 stone images)');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
