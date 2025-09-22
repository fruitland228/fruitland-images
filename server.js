import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import dotenv from 'dotenv'
import fs from 'fs'
import fetch from 'node-fetch'
import multer from 'multer'
import sharp from 'sharp'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'super_secret_123'
const DB_PATH = path.join(__dirname, 'data.sqlite')

console.log('SERVER: boot', new Date().toISOString())

sqlite3.verbose()
const db = new sqlite3.Database(DB_PATH)

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      priceUAH INTEGER NOT NULL,
      category TEXT NOT NULL,
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      stock INTEGER DEFAULT 0
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      url_base TEXT NOT NULL,
      alt TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `)
})

app.use(express.json())

const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

function requireAdmin(req, res, next) {
  const t = (req.headers['x-admin-token'] || req.query.token || req.body?.token || '').toString()
  if (t !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' })
  next()
}

const GH = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  token: process.env.GITHUB_TOKEN,
  base: (process.env.PAGES_BASE || '').replace(/\/+$/,''),
  branch: process.env.GITHUB_BRANCH || 'main'
}
if (!GH.base || /github\.com/i.test(GH.base)) {
  GH.base = `https://${GH.owner}.github.io/${GH.repo}`
}
function slugify(s) {
  return (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'img'
}
async function ghPut(pathRel, contentBuf, message) {
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${encodeURIComponent(pathRel).replace(/%2F/g,'/')}`
  const body = { message, content: contentBuf.toString('base64'), branch: GH.branch }
  const r = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${GH.token}`, Accept: 'application/vnd.github+json' }, body: JSON.stringify(body) })
  if (!r.ok) {
    const t = await r.text().catch(()=> '')
    throw new Error(`ghPut ${r.status} ${t}`)
  }
  return r.json()
}

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString(), pid: process.pid }))

app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim()
  const category = (req.query.category || '').toString().trim()
  const where = []
  const params = []
  if (q) {
    where.push('(lower(name) LIKE ? OR lower(category) LIKE ? OR lower(description) LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (category && category !== 'all') {
    where.push('category = ?')
    params.push(category)
  }
  const sql = `
    SELECT id,name,priceUAH,category,image,description,stock
    FROM products
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id ASC
  `
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'db' })
    res.json(rows || [])
  })
})

app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (!id) return res.status(400).json({ error: 'bad_id' })
  db.get(`SELECT id,name,priceUAH,category,image,description,stock FROM products WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db' })
    if (!row) return res.status(404).json({ error: 'not_found' })
    res.json(row)
  })
})

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { id, name, priceUAH, category, image, description, stock = 0 } = req.body || {}
  if (!name || priceUAH == null || !category) return res.status(400).json({ error: 'bad_payload' })
  if (id) {
    db.run(
      `INSERT OR REPLACE INTO products (id,name,priceUAH,category,image,description,stock) VALUES (?,?,?,?,?,?,?)`,
      [id, name, parseInt(priceUAH, 10), category, image || '', description || '', parseInt(stock, 10) || 0],
      function (err) {
        if (err) return res.status(500).json({ error: 'db' })
        res.json({ ok: true, id })
      }
    )
  } else {
    db.run(
      `INSERT INTO products (name,priceUAH,category,image,description,stock) VALUES (?,?,?,?,?,?)`,
      [name, parseInt(priceUAH, 10), category, image || '', description || '', parseInt(stock, 10) || 0],
      function (err) {
        if (err) return res.status(500).json({ error: 'db' })
        res.json({ ok: true, id: this.lastID })
      }
    )
  }
})

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { name, priceUAH, category, image, description, stock } = req.body || {}
  if (!id) return res.status(400).json({ error: 'bad_id' })
  db.run(
    `UPDATE products SET
      name = COALESCE(?, name),
      priceUAH = COALESCE(?, priceUAH),
      category = COALESCE(?, category),
      image = COALESCE(?, image),
      description = COALESCE(?, description),
      stock = COALESCE(?, stock)
     WHERE id = ?`,
    [
      name ?? null,
      priceUAH != null ? parseInt(priceUAH, 10) : null,
      category ?? null,
      image ?? null,
      description ?? null,
      stock != null ? parseInt(stock, 10) : null,
      id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'db' })
      res.json({ ok: true, changed: this.changes })
    }
  )
})

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (!id) return res.status(400).json({ error: 'bad_id' })
  db.run(`DELETE FROM product_images WHERE product_id = ?`, [id], function (e1) {
    if (e1) return res.status(500).json({ error: 'db' })
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (e2) {
      if (e2) return res.status(500).json({ error: 'db' })
      res.json({ ok: true, deleted: this.changes })
    })
  })
})

app.get('/api/admin/product-images', requireAdmin, (req, res) => {
  const productId = parseInt(req.query.productId || '0', 10)
  if (!productId) return res.status(400).json({ error: 'bad_productId' })
  db.all(
    `SELECT id, product_id, url_base, alt, sort_order, created_at
     FROM product_images
     WHERE product_id=?
     ORDER BY sort_order ASC, id ASC`,
    [productId],
    (e, rows) => {
      if (e) return res.status(500).json({ error: 'db' })
      const mapped = (rows || []).map(r => ({
        ...r,
        url_400: r.url_base + '_400.webp',
        url_800: r.url_base + '_800.webp',
        url_1200: r.url_base + '_1200.webp'
      }))
      res.json(mapped)
    }
  )
})

app.put('/api/admin/product-images/:id', requireAdmin, express.json(), (req, res) => {
  const id = parseInt(req.params.id || '0', 10)
  const { alt, sort_order, cover } = req.body || {}
  if (!id) return res.status(400).json({ error: 'bad_id' })
  db.get(`SELECT * FROM product_images WHERE id=?`, [id], (e, img) => {
    if (e || !img) return res.status(404).json({ error: 'not_found' })
    db.run(
      `UPDATE product_images SET alt=COALESCE(?,alt), sort_order=COALESCE(?,sort_order) WHERE id=?`,
      [alt ?? null, Number.isFinite(sort_order) ? sort_order : null, id],
      (e2) => {
        if (e2) return res.status(500).json({ error: 'db' })
        if (cover) {
          db.run(`UPDATE products SET image=? WHERE id=?`, [img.url_base + '_400.webp', img.product_id], (e3) => {
            if (e3) return res.status(500).json({ error: 'db' })
            res.json({ ok: true, cover: img.url_base + '_400.webp' })
          })
        } else {
          res.json({ ok: true })
        }
      }
    )
  })
})

app.post('/api/admin/upload-gh', requireAdmin, mem.array('images[]', 20), async (req, res) => {
  try {
    const productId = parseInt(req.query.productId || req.body?.productId || '0', 10)
    if (!productId) return res.status(400).json({ error: 'bad_productId' })
    const files = req.files || []
    if (!files.length) return res.status(400).json({ error: 'no_files' })
    if (!GH.owner || !GH.repo || !GH.token || !GH.base) return res.status(400).json({ error: 'gh_config' })

    const uploaded = []
    for (const f of files) {
      const baseName = slugify(f.originalname?.split('.').slice(0,-1).join('.') || 'image')
      const dir = `images/products/${productId}`
      const key = `${baseName}-${Date.now()}`
      const b400 = await sharp(f.buffer).resize({ width: 400 }).webp({ quality: 82 }).toBuffer()
      const b800 = await sharp(f.buffer).resize({ width: 800 }).webp({ quality: 85 }).toBuffer()
      const b1200 = await sharp(f.buffer).resize({ width: 1200 }).webp({ quality: 86 }).toBuffer()
      await ghPut(`${dir}/${key}_400.webp`, b400, `upload ${productId} 400 ${baseName}`)
      await ghPut(`${dir}/${key}_800.webp`, b800, `upload ${productId} 800 ${baseName}`)
      await ghPut(`${dir}/${key}_1200.webp`, b1200, `upload ${productId} 1200 ${baseName}`)
      const url_base = `${GH.base}/${dir}/${key}`
      await new Promise((ok, bad) => {
        db.run(`INSERT INTO product_images (product_id, url_base, sort_order) VALUES (?,?,?)`, [productId, url_base, 999], function (err) { err ? bad(err) : ok() })
      })
      uploaded.push({ product_id: productId, url_base, url_400: `${url_base}_400.webp`, url_800: `${url_base}_800.webp`, url_1200: `${url_base}_1200.webp` })
    }

    const hasCover = await new Promise((ok) => db.get(`SELECT image FROM products WHERE id=?`, [productId], (e, r) => ok(Boolean(r && r.image))))
    if (!hasCover && uploaded[0]) {
      await new Promise((ok) => db.run(`UPDATE products SET image=? WHERE id=?`, [uploaded[0].url_400, productId], () => ok()))
    }

    res.json({ ok: true, uploaded })
  } catch (e) {
    res.status(500).json({ error: 'upload_failed', detail: String(e.message || e) })
  }
})

app.get('/api/admin/gh-check', requireAdmin, async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${GH.token}`, Accept: 'application/vnd.github+json' } })
    res.json({ ok: r.ok, status: r.status })
  } catch (e) {
    res.status(500).json({ ok: false, detail: String(e.message || e) })
  }
})

app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(PORT, () => {
  console.log(`SERVER: listening http://localhost:${PORT}`)
})
server.on('error', err => {
  console.error('SERVER: listen error', err)
})
