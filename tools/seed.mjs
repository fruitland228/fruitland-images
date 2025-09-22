import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const db = new sqlite3.Database(path.join(__dirname, '../data.sqlite'))

const baseItems = [
  {id:1,name:"Полуниця Альбіон",priceUAH:450,category:"Полуниця",image:"https://via.placeholder.com/400x300/98d98e/ffffff?text=Полуниця+Альбіон",description:"Ремонтантний сорт з великими солодкими ягодами"},
  {id:2,name:"Малина Полка",priceUAH:380,category:"Малина",image:"https://via.placeholder.com/400x300/d98e98/ffffff?text=Малина+Полка",description:"Високоврожайний сорт з ароматними ягодами"},
  {id:3,name:"Ожина Торнфрі",priceUAH:420,category:"Ожина",image:"https://via.placeholder.com/400x300/8e98d9/ffffff?text=Ожина+Торнфрі",description:"Безшипний сорт з великими чорними ягодами"},
  {id:4,name:"Смородина Чорна Перлина",priceUAH:350,category:"Смородина",image:"https://via.placeholder.com/400x300/a8d98e/ffffff?text=Смородина+Чорна",description:"Великоплідний сорт з високим вмістом вітамінів"},
  {id:5,name:"Виноград Аркадія",priceUAH:680,category:"Виноград",image:"https://via.placeholder.com/400x300/d9d98e/ffffff?text=Виноград+Аркадія",description:"Столовий сорт з великими гронами"},
  {id:6,name:"Голубика Дюк",priceUAH:520,category:"Голубика",image:"https://via.placeholder.com/400x300/8e8ed9/ffffff?text=Голубика+Дюк",description:"Ранній морозостійкий сорт"},
  {id:7,name:"Яблуня Гала",priceUAH:1250,category:"Яблуні",image:"https://via.placeholder.com/400x300/d9a88e/ffffff?text=Яблуня+Гала",description:"Солодкі червоні яблука середнього розміру"},
  {id:8,name:"Груша Конференція",priceUAH:1180,category:"Груші",image:"https://via.placeholder.com/400x300/d9d88e/ffffff?text=Груша+Конференція",description:"Класичний європейський сорт"},
  {id:9,name:"Слива Стенлей",priceUAH:980,category:"Сливи",image:"https://via.placeholder.com/400x300/a88ed9/ffffff?text=Слива+Стенлей",description:"Великі темно-сині плоди"},
  {id:10,name:"Алича Кубанська Комета",priceUAH:890,category:"Алича",image:"https://via.placeholder.com/400x300/d9a8d9/ffffff?text=Алича+Кубанська",description:"Ранній врожайний сорт"},
  {id:11,name:"Абрикос Ананасний",priceUAH:1150,category:"Абрикос",image:"https://via.placeholder.com/400x300/f5d98e/ffffff?text=Абрикос+Ананасний",description:"Солодкий ароматний сорт"},
  {id:12,name:"Персик Редхейвен",priceUAH:1080,category:"Персик",image:"https://via.placeholder.com/400x300/ffa88e/ffffff?text=Персик+Редхейвен",description:"Класичний американський сорт"},
  {id:13,name:"Нектарин Старк",priceUAH:1220,category:"Нектарин",image:"https://via.placeholder.com/400x300/ff8e8e/ffffff?text=Нектарин+Старк",description:"Солодкий сорт без опушення"},
  {id:14,name:"Черешня Регіна",priceUAH:1380,category:"Черешня",image:"https://via.placeholder.com/400x300/d98ea8/ffffff?text=Черешня+Регіна",description:"Пізній сорт з великими плодами"},
  {id:15,name:"Вишня Чудо",priceUAH:950,category:"Вишня",image:"https://via.placeholder.com/400x300/c98e8e/ffffff?text=Вишня+Чудо",description:"Гібрид вишні та черешні"},
  {id:16,name:"Мигдаль Нікітський",priceUAH:1450,category:"Мигдаль",image:"https://via.placeholder.com/400x300/d9c88e/ffffff?text=Мигдаль+Нікітський",description:"Морозостійкий сорт"},
  {id:17,name:"Яблуня карликова М9",priceUAH:1580,category:"Карликові",image:"https://via.placeholder.com/400x300/a8c88e/ffffff?text=Яблуня+М9",description:"Компактне дерево для малих садів"},
  {id:18,name:"Груша карликова",priceUAH:1650,category:"Карликові",image:"https://via.placeholder.com/400x300/b8d88e/ffffff?text=Груша+карликова",description:"Низькоросла груша для контейнерів"},
  {id:19,name:"Полуниця Хоней",priceUAH:420,category:"Полуниця",image:"https://via.placeholder.com/400x300/98d98e/ffffff?text=Полуниця+Хоней",description:"Ранній сорт з транспортабельними ягодами"},
  {id:20,name:"Малина Геракл",priceUAH:390,category:"Малина",image:"https://via.placeholder.com/400x300/d98e98/ffffff?text=Малина+Геракл",description:"Ремонтантний сорт з крупними ягодами"},
  {id:21,name:"Виноград Лівія",priceUAH:720,category:"Виноград",image:"https://via.placeholder.com/400x300/d9d98e/ffffff?text=Виноград+Лівія",description:"Рожевий столовий сорт"},
  {id:22,name:"Слива карликова",priceUAH:1480,category:"Карликові",image:"https://via.placeholder.com/400x300/a88ed9/ffffff?text=Слива+карликова",description:"Компактне дерево з повноцінними плодами"},
  {id:23,name:"Персик карликовий",priceUAH:1680,category:"Карликові",image:"https://via.placeholder.com/400x300/ffa88e/ffffff?text=Персик+карликовий",description:"Мініатюрне дерево для тераси"},
  {id:24,name:"Смородина Червона",priceUAH:320,category:"Смородина",image:"https://via.placeholder.com/400x300/ff8e8e/ffffff?text=Смородина+Червона",description:"Кислувато-солодкі ягоди для желе"}
]

const PRICE_TEXT = `
Прайс на касетну розсаду полуниці
Клері – 12 грн
Альба – 11 грн
Румба – 13 грн
Лючія – 13 грн
Алегро – 12 грн
Азія – 12 грн
Брілла – 12 грн
Хоней – 11 грн
Сирія – 12 грн
Полка – 12 грн
Зенга Зенга – 11 грн
Ельсанта – 13 грн
Мальвіна – 13 грн

Свіже копана розсада полуниці
Альба – 6 грн/шт (150 грн/уп)
Клері – 6 грн/шт (150 грн/уп)
Бріла – 7 грн/шт (175 грн/уп)
Румба – 7 грн/шт (175 грн/уп)
Азія – 8 грн/шт (200 грн/уп)
Хоней – 6 грн/шт (150 грн/уп)
Гранд Роза – 7 грн/шт (175 грн/уп)
Амі – 8 грн/шт (200 грн/уп)
Зенга Зенгана – 7 грн/шт (175 грн/уп)
Полка – 6 грн/шт (150 грн/уп)
Ельсанта – 8 грн/шт (200 грн/уп)
Магнус – 8 грн/шт (200 грн/уп)
Мальвіна – 7 грн/шт (175 грн/уп)
Флоренс – 8 грн/шт (200 грн/уп)

Ожина
Натчез – 100 грн (ранній сорт, великі подовжені ягоди)
Лох Тей – 80 грн (середній, солодкий смак, без колючок)
Тріпл Краун – 80 грн (дуже врожайний, солодко-кислий смак)
Небеса – 100 грн (новий сорт, солодка, транспортабельна)
Аушито – 120 грн (великоплідна, ароматна)
Фрідом – 140 грн (ремонтантна, безколюча)
Тревелер – 140 грн (ремонтантна, транспортабельна)
Блек Джем – 140 грн (великі ягоди, десертні)
Блек Меджик – 80 грн (солодка, довгастої форми)
Кіова – 120 грн (великоплідна, ягоди до 20 г)
Рубен – 80 грн (ремонтантна, плодоношення двічі на рік)
Карака Блек – 80 грн (надранній сорт, витягнуті ягоди)

Єжемалина
Тейбері – 100 грн (гібрид ожини та малини, великі ягоди з ароматом)
Букенгем – 100 грн (безколючковий сорт, урожайний)
Логанберрі – 100 грн (потужний кущ, ягоди з кислинкою)

Малина
Пшехіба 40,00
Карамелька 36,00
Маравілла 36,00
Утренняя Роса 30,00
Жовтий Гігант 36,00
Джоанджі 30,00
Хімботоп 24,00
Полонез-50 40,00
Патріція 28,00
Октавія 30,00

Прайс на виноград
Кишмишні сорти
К. Велес – 120 грн
К. Юпітер – 100 грн
К. Гелеодор – 120 грн
К. Володар – 120 грн
К. Столетіє – 140 грн
К. Цимус – 120 грн
К. Банзай – 200 грн
К. Алекс – 400 грн
К. Джавелін – 400 грн
К. Чорнобаївка – 800 грн
К. Удачний – 200 грн
К. Малиновий – 300 грн
К. Рататуй – 160 грн
К. Находка – 140 грн
К. Подяка Полякам – 500 грн

Столові сорти
Алинка – 240 грн
Велюр – 100 грн
Зоренька – 160 грн
Красна Роза – 200 грн
Азія – 200 грн
Азія рожева – 200 грн
Загадка Калугiна – 240 грн
Красная Шапочка – 300 грн
Бассанті – 140 грн
Бананас – 140 грн
Огненный – 140 грн
Ямайка – 300 грн
Чорний Кiготь – 240 грн
Бiла Надiя – 160 грн
Ескалібур – 100 грн
`

function ph(name) {
  const base = '8fb996'
  return `https://via.placeholder.com/400x300/${base}/ffffff?text=${encodeURIComponent(name)}`
}

function insertOne({ name, priceUAH, category, description = '', image = '' }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO products(name,priceUAH,category,image,description,stock) VALUES(?,?,?,?,?,0)`,
      [name, priceUAH, category, image || ph(name), description],
      function (err) { if (err) reject(err); else resolve() }
    )
  })
}

function parsePriceText(txt) {
  const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  let section = ''
  const out = []
  for (const line of lines) {
    if (/^Прайс на касетну/i.test(line)) { section = 'straw_cassette'; continue }
    if (/^Свіже копана/i.test(line)) { section = 'straw_fresh'; continue }
    if (/^Ожина/i.test(line)) { section = 'blackberry'; continue }
    if (/^Єжемалина/i.test(line)) { section = 'tayberry'; continue }
    if (/^Малина/i.test(line)) { section = 'raspberry'; continue }
    if (/^Прайс на виноград/i.test(line)) { section = 'grape_head'; continue }
    if (/^Кишмишні сорти/i.test(line)) { section = 'grape_kishmish'; continue }
    if (/^Столові сорти/i.test(line)) { section = 'grape_table'; continue }

    if (section === 'straw_cassette') {
      const m = line.match(/^(.+?)\s*–\s*(\d+)\s*грн/i)
      if (m) out.push({ name:`Полуниця ${m[1]} (касетна)`, priceUAH:parseInt(m[2],10), category:'Полуниця', description:'Касетна розсада' })
      continue
    }
    if (section === 'straw_fresh') {
      const m = line.match(/^(.+?)\s*–\s*(\d+)\s*грн.*?(?:\((\d+)\s*грн\/уп\))?/i)
      if (m) {
        const pack = m[3] ? `, упак. ${m[3]} грн` : ''
        out.push({ name:`Полуниця ${m[1]} (свіже копана)`, priceUAH:parseInt(m[2],10), category:'Полуниця', description:`Свіже копана${pack}` })
      }
      continue
    }
    if (section === 'blackberry') {
      const m = line.match(/^(.+?)\s*–\s*(\d+)\s*грн(?:\s*\((.+)\))?/i)
      if (m) out.push({ name:`Ожина ${m[1]}`, priceUAH:parseInt(m[2],10), category:'Ожина', description:m[3]||'' })
      continue
    }
    if (section === 'tayberry') {
      const m = line.match(/^(.+?)\s*–\s*(\d+)\s*грн(?:\s*\((.+)\))?/i)
      if (m) out.push({ name:`Єжемалина ${m[1]}`, priceUAH:parseInt(m[2],10), category:'Єжемалина', description:m[3]||'' })
      continue
    }
    if (section === 'raspberry') {
      const m = line.match(/^(.+?)\s+([\d,]+)$/i)
      if (m) {
        const price = Math.round(parseFloat(m[2].replace(',','.')))
        out.push({ name:`Малина ${m[1]}`, priceUAH:price, category:'Малина', description:'' })
      }
      continue
    }
    if (section === 'grape_kishmish') {
      const m = line.match(/^К\.\s*(.+?)\s*–\s*(\d+)\s*грн/i)
      if (m) out.push({ name:`Виноград ${m[1]} (кишмиш)`, priceUAH:parseInt(m[2],10), category:'Виноград', description:'Кишмишний сорт' })
      continue
    }
    if (section === 'grape_table') {
      const m = line.match(/^(.+?)\s*–\s*(\d+)\s*грн/i)
      if (m) out.push({ name:`Виноград ${m[1]}`, priceUAH:parseInt(m[2],10), category:'Виноград', description:'Столовий сорт' })
      continue
    }
  }
  return out
}

async function run() {
  await new Promise((resolve,reject)=>db.run(`CREATE TABLE IF NOT EXISTS products(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priceUAH INTEGER NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    description TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, e=>e?reject(e):resolve()))
  await new Promise((resolve,reject)=>db.run(`CREATE UNIQUE INDEX IF NOT EXISTS ux_products_name_cat ON products(name, category)`,e=>e?reject(e):resolve()))
  for (const it of baseItems) await insertOne(it)
  const parsed = parsePriceText(PRICE_TEXT)
  for (const it of parsed) await insertOne(it)
  db.close()
}
run()
