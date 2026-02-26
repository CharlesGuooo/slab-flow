/**
 * SlabFlow Demo Data Seeding Script
 * Run with: npx tsx scripts/seed-demo-data.ts
 */

import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:slabflow-local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

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
    id: 'ch02', brand: 'CH Stone', series: 'Premium', code: 'V1040',
    name: { en: 'Kunlun Black', zh: '昆仑黑', fr: 'Noir Kunlun' },
    description: { en: 'A striking and bold statement of elegance. Deep, rich black tones with subtle veining patterns create a dramatic yet refined aesthetic.', zh: '优雅的醒目大胆宣言。深邃浓郁的黑色调配合微妙的纹理图案。', fr: 'Une déclaration audacieuse et frappante d\'élégance.' },
    stoneType: 'quartzite', face: 'bookmatch', finish: 'matt', pricePerSlab: '3200.00',
    tags: ['premium', 'bookmatch', 'black', 'dramatic']
  },
  {
    id: 'ch03', brand: 'CH Stone', series: 'Classic', code: 'M5085',
    name: { en: 'Carrara Gold', zh: '卡拉拉金', fr: 'Carrara Or' },
    description: { en: 'A refined fusion of elegance and luxury. Soft, creamy white tones complemented by delicate golden veins.', zh: '优雅与奢华的精致融合。柔和的奶白色调配以精致的金色纹理。', fr: 'Une fusion raffinée d\'élégance et de luxe.' },
    stoneType: 'marble', face: 'single', finish: 'matt', pricePerSlab: '3500.00',
    tags: ['classic', 'gold', 'luxury', 'marble-look']
  },
  {
    id: 'ch04', brand: 'CH Stone', series: 'Classic', code: 'M5047',
    name: { en: 'Bianco Rumeno', zh: '罗马尼亚白', fr: 'Blanc Roumain' },
    description: { en: 'The epitome of classic luxury with striking bookmatch pattern combining pure whites and delicate grey veins.', zh: '经典奢华的典范，醒目的对纹图案结合纯白与精致的灰色纹理。', fr: 'L\'épité du luxe classique avec un motif bookmatch frappant.' },
    stoneType: 'marble', face: 'bookmatch', finish: 'soft-matt', pricePerSlab: '2600.00',
    tags: ['classic', 'bookmatch', 'white', 'elegant']
  },
  {
    id: 'ch05', brand: 'CH Stone', series: 'Modern', code: 'M3010',
    name: { en: 'Snow X', zh: '雪花白', fr: 'Neige X' },
    description: { en: 'A brilliant display of pristine elegance. Striking white surface with delicate veining evokes the beauty of fresh snowflakes.', zh: '纯净优雅的绝妙展现。醒目的白色表面配以精致的纹理。', fr: 'Une brillante démonstration d\'élégance pristine.' },
    stoneType: 'quartz', face: 'single', finish: 'matt', pricePerSlab: '2200.00',
    tags: ['modern', 'white', 'pure', 'luminous']
  },
  {
    id: 'ch06', brand: 'CH Stone', series: 'Bold', code: 'M5049',
    name: { en: 'Calacatta Viola', zh: '卡拉卡塔紫', fr: 'Calacatta Violette' },
    description: { en: 'Make a bold visual statement. Dramatic grape-purple veins on a white base create a stunning centerpiece.', zh: '大胆的视觉宣言。白色底色上的戏剧性葡萄紫纹理。', fr: 'Faites une déclaration visuelle audacieuse.' },
    stoneType: 'marble', face: 'single', finish: 'matt', pricePerSlab: '3800.00',
    tags: ['bold', 'purple', 'dramatic', 'statement']
  },
  // PF Brand (pf01-pf05)
  {
    id: 'pf01', brand: 'PF Surface', series: 'Pure', code: 'M1911',
    name: { en: 'Pure White', zh: '纯白', fr: 'Blanc Pur' },
    description: { en: 'Our purest, most pristine white. Ideal for white-on-white spaces and monochromatic designs.', zh: '我们最纯净、最原始的白色。非常适合全白空间和单色设计。', fr: 'Notre blanc le plus pur et le plus immaculé.' },
    stoneType: 'quartz', face: 'single', finish: 'matt', pricePerSlab: '1800.00',
    tags: ['pure', 'white', 'minimal', 'monochrome']
  },
  {
    id: 'pf02', brand: 'PF Surface', series: 'Elegant', code: 'M4017',
    name: { en: 'Lauren White', zh: '劳伦白', fr: 'Blanc Lauren' },
    description: { en: 'A perfect blend of sophistication and simplicity.', zh: '精致与简约的完美融合。', fr: 'Un mélange parfait de sophistication et de simplicité.' },
    stoneType: 'quartz', face: 'single', finish: 'matt', pricePerSlab: '2000.00',
    tags: ['elegant', 'white', 'sophisticated', 'subtle']
  },
  {
    id: 'pf03', brand: 'PF Surface', series: 'Natural', code: 'V6011',
    name: { en: 'Bursa Grey', zh: '布尔萨灰', fr: 'Gris Bursa' },
    description: { en: 'The greys and grains of granite. Charcoal grey surface that resembles granite.', zh: '花岗岩的灰色与纹理。炭灰色表面酷似花岗岩。', fr: 'Les gris et les grains du granit.' },
    stoneType: 'granite', face: 'single', finish: 'matt', pricePerSlab: '2400.00',
    tags: ['natural', 'grey', 'granite-look', 'textured']
  },
  {
    id: 'pf04', brand: 'PF Surface', series: 'Luxury', code: 'M5086',
    name: { en: 'Calacatta Royale', zh: '皇家卡拉卡塔', fr: 'Calacatta Royale' },
    description: { en: 'A marble style of warmth and sophistication.', zh: '温暖与精致的大理石风格。', fr: 'Un style marbre de chaleur et de sophistication.' },
    stoneType: 'marble', face: 'bookmatch', finish: 'matt', pricePerSlab: '3600.00',
    tags: ['luxury', 'bookmatch', 'warm', 'italian']
  },
  {
    id: 'pf05', brand: 'PF Surface', series: 'Artisan', code: 'M5081',
    name: { en: 'Fusion White', zh: '融合白', fr: 'Blanc Fusion' },
    description: { en: 'Greek marble elegance. Beautifully replicates stunning marble quarried in Greece.', zh: '希腊大理石的优雅。完美复制希腊开采的绝美大理石。', fr: 'Élégance du marbre grec.' },
    stoneType: 'marble', face: 'single', finish: 'matt', pricePerSlab: '3200.00',
    tags: ['artisan', 'greek', 'gold-accents', 'elegant']
  },
  // TY Brand (ty01-ty05)
  {
    id: 'ty01', brand: 'TY Marble', series: 'Luxury', code: 'M1050',
    name: { en: 'Luxury White', zh: '奢华白', fr: 'Blanc Luxe' },
    description: { en: 'An opulent Italian marble style.', zh: '奢华的意大利大理石风格。', fr: 'Un style marbre italien opulent.' },
    stoneType: 'marble', face: 'bookmatch', finish: 'matt', pricePerSlab: '4200.00',
    tags: ['luxury', 'bookmatch', 'gold', 'italian']
  },
  {
    id: 'ty02', brand: 'TY Marble', series: 'Natural', code: 'M5080',
    name: { en: 'Super White', zh: '超级白', fr: 'Super Blanc' },
    description: { en: 'Brazilian grey marble beauty.', zh: '巴西灰色大理石之美。', fr: 'Beauté du marbre gris brésilien.' },
    stoneType: 'quartzite', face: 'single', finish: 'matt', pricePerSlab: '2600.00',
    tags: ['natural', 'grey', 'brazilian', 'harmonious']
  },
  {
    id: 'ty03', brand: 'TY Marble', series: 'Classic', code: 'M5079',
    name: { en: 'Big White', zh: '大花白', fr: 'Grand Blanc' },
    description: { en: 'A superb recreation of Italian marble.', zh: '对意大利大理石的卓越再现。', fr: 'Une superbe recréation du marbre italien.' },
    stoneType: 'marble', face: 'single', finish: 'matt', pricePerSlab: '3000.00',
    tags: ['classic', 'white', 'italian', 'tuscany']
  },
  {
    id: 'ty04', brand: 'TY Marble', series: 'Unique', code: 'M5082',
    name: { en: 'Calacatta Verde', zh: '绿纹卡拉卡塔', fr: 'Calacatta Vert' },
    description: { en: 'The beauty of prized green marble.', zh: '珍贵绿色大理石之美。', fr: 'La beauté du précieux marbre vert.' },
    stoneType: 'marble', face: 'single', finish: 'matt', pricePerSlab: '4000.00',
    tags: ['unique', 'green', 'emerald', 'sage']
  },
  {
    id: 'ty05', brand: 'TY Marble', series: 'Premium', code: 'M5083',
    name: { en: 'Calacatta Oro', zh: '金纹卡拉卡塔', fr: 'Calacatta Oro' },
    description: { en: 'Luxe marble veins with a hint of gold.', zh: '带金色暗示的奢华大理石纹理。', fr: 'Veines de marbre luxueuses avec une touche d\'or.' },
    stoneType: 'marble', face: 'bookmatch', finish: 'matt', pricePerSlab: '4500.00',
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
    const tenantResult = await db.execute({
      sql: 'SELECT id FROM tenants WHERE domain = ?',
      args: ['test-company.localhost'],
    });

    if (tenantResult.rows.length === 0) {
      console.error('❌ Test tenant not found. Please run the app first to initialize the database.');
      process.exit(1);
    }

    const tenantId = tenantResult.rows[0].id as number;
    console.log(`✅ Found tenant ID: ${tenantId}\n`);

    // Update tenant with 3D feature enabled and better settings
    await db.execute({
      sql: `UPDATE tenants SET
        feature_3d_reconstruction = 1, feature_chatbot = 1, feature_calculator = 1,
        ai_monthly_budget = '100.00', contact_phone = '(555) 123-4567',
        contact_email = 'info@test-company.com',
        address = '123 Stone Avenue, Granite City, GC 12345',
        theme_primary_color = '#2563eb'
      WHERE id = ?`,
      args: [tenantId],
    });
    console.log('✅ Updated tenant settings\n');

    // Clear existing inventory
    await db.execute({ sql: 'DELETE FROM inventory_stones WHERE tenant_id = ?', args: [tenantId] });
    console.log('🗑️  Cleared existing inventory\n');

    // Insert stone products
    console.log('📦 Inserting stone products...');
    for (const stone of stoneProducts) {
      const imageUrl = `/images/stones/${stone.id}.avif`;
      const nameJson = JSON.stringify(stone.name);
      const descJson = JSON.stringify(stone.description);
      const tagsJson = JSON.stringify(stone.tags);

      await db.execute({
        sql: `INSERT INTO inventory_stones (tenant_id, brand, series, stone_type, price_per_slab, image_url, name, description, tags, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [tenantId, stone.brand, stone.series, stone.stoneType, stone.pricePerSlab, imageUrl, nameJson, descJson, tagsJson],
      });
      console.log(`   ✓ ${stone.name.en} (${stone.brand}) - $${stone.pricePerSlab}`);
    }
    console.log(`\n✅ Inserted ${stoneProducts.length} stone products\n`);

    // Clear existing users
    await db.execute({ sql: 'DELETE FROM users WHERE tenant_id = ?', args: [tenantId] });
    console.log('🗑️  Cleared existing users\n');

    // Insert demo users
    console.log('👥 Inserting demo users...');
    const hashedPin = await bcrypt.hash('123456', 10);
    const userIds: number[] = [];

    for (const user of demoUsers) {
      const result = await db.execute({
        sql: `INSERT INTO users (tenant_id, username, email, phone, pin, ai_credits) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [tenantId, user.username, user.email, user.phone, hashedPin, '15.00'],
      });
      userIds.push(Number(result.lastInsertRowid));
      console.log(`   ✓ ${user.username} (${user.email})`);
    }
    console.log(`\n✅ Inserted ${demoUsers.length} demo users\n`);

    // Clear existing orders
    await db.execute({ sql: 'DELETE FROM client_orders WHERE tenant_id = ?', args: [tenantId] });
    console.log('🗑️  Cleared existing orders\n');

    // Insert demo orders with different statuses
    console.log('📋 Inserting demo orders...');
    const orderStatuses = ['pending_quote', 'quoted', 'in_progress', 'completed'];
    const stoneIdsResult = await db.execute({ sql: 'SELECT id FROM inventory_stones WHERE tenant_id = ?', args: [tenantId] });
    const stoneIds = stoneIdsResult.rows.map(r => r.id as number);

    const orders: { id: number; userId: number; status: string }[] = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const numOrders = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < numOrders; j++) {
        const stoneId = stoneIds[Math.floor(Math.random() * stoneIds.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const isContractor = Math.random() > 0.7 ? 1 : 0;
        const budget = (Math.floor(Math.random() * 5) + 3) * 1000;
        const quotePrice = status !== 'pending_quote' ? (budget * 0.8).toFixed(2) : null;

        const result = await db.execute({
          sql: `INSERT INTO client_orders (tenant_id, user_id, stone_id, stone_selection_text, desired_date, is_contractor, total_budget, notes, status, final_quote_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            tenantId, userId, stoneId, null,
            ['ASAP', 'within_2_weeks', 'within_a_month', 'not_in_a_hurry'][Math.floor(Math.random() * 4)],
            isContractor, budget.toString(),
            `Demo order #${orders.length + 1} - ${status.replace('_', ' ')}`,
            status, quotePrice
          ],
        });

        orders.push({ id: Number(result.lastInsertRowid), userId, status });
      }
    }
    console.log(`\n✅ Inserted ${orders.length} demo orders\n`);

    // Insert some order photos
    console.log('📷 Inserting order photos...');
    await db.execute({ sql: 'DELETE FROM order_photos WHERE tenant_id = ?', args: [tenantId] });

    const photoCount = Math.min(5, orders.length);
    for (let i = 0; i < photoCount; i++) {
      const order = orders[i];
      await db.execute({
        sql: `INSERT INTO order_photos (tenant_id, order_id, image_url, photo_type) VALUES (?, ?, ?, ?)`,
        args: [tenantId, order.id, `/images/stones/ch0${i + 1}.avif`, 'user_upload'],
      });
    }
    console.log(`\n✅ Inserted ${photoCount} order photos\n`);

    // Clear and re-insert calculation items
    await db.execute({ sql: 'DELETE FROM calculation_items WHERE tenant_id = ?', args: [tenantId] });
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

    for (const item of calcItems) {
      await db.execute({
        sql: `INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
        args: [tenantId, item.name, item.unit, item.price, item.order],
      });
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
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
