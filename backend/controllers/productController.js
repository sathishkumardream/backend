const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODUCT_INCLUDE = { category: true, variants: { orderBy: { id: "asc" } } };


// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, stock, image, sizes, colors, subcategory, categoryId } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock,
        image,
        sizes: sizes || null,
        colors: colors || null,
        subcategory: subcategory || null,
        category: {
          connect: { id: categoryId }
        }
      },
      include: PRODUCT_INCLUDE
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error creating product" });
  }
};


// Get All Products
exports.getProducts = async (req, res) => {
  try {

    const products = await prisma.product.findMany({
      include: PRODUCT_INCLUDE
    });

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching products" });
  }
};


// Get Single Product
exports.getProduct = async (req, res) => {

  try {

    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: PRODUCT_INCLUDE
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching product" });
  }

};


// Update Product
exports.updateProduct = async (req, res) => {

  try {

    const { name, description, price, originalPrice, stock, image, sizes, colors, subcategory, categoryId } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        price,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock,
        image,
        sizes: sizes || null,
        colors: colors || null,
        subcategory: subcategory || null,
        categoryId
      },
      include: PRODUCT_INCLUDE
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error updating product" });
  }

};


// Delete Product
exports.deleteProduct = async (req, res) => {

  try {

    await prisma.product.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Product deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message || "Error deleting product" });
  }

};


// ─────────────────────────────────────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

// Create a variant for a product
exports.createVariant = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { size, color, price, stock, sku } = req.body;

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size: size || null,
        color: color || null,
        price: price !== undefined && price !== "" ? Number(price) : null,
        stock: Number(stock) || 0,
        sku: sku || null,
      }
    });

    res.json(variant);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A variant with this size/color (or SKU) already exists for this product" });
    }
    res.status(500).json({ error: error.message || "Error creating variant" });
  }
};

// Update a variant
exports.updateVariant = async (req, res) => {
  try {
    const { size, color, price, stock, sku } = req.body;

    const data = {};
    if (size !== undefined) data.size = size || null;
    if (color !== undefined) data.color = color || null;
    if (price !== undefined) data.price = price !== "" ? Number(price) : null;
    if (stock !== undefined) data.stock = Number(stock);
    if (sku !== undefined) data.sku = sku || null;

    const variant = await prisma.productVariant.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(variant);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A variant with this size/color (or SKU) already exists for this product" });
    }
    res.status(500).json({ error: error.message || "Error updating variant" });
  }
};

// Delete a variant
exports.deleteVariant = async (req, res) => {
  try {
    await prisma.productVariant.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Variant deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error deleting variant" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// BULK CSV UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = ["product_name", "price", "stock", "category"];
const ALL_COLUMNS = [
  "product_name", "description", "price", "original_price", "stock", "image_url",
  "category", "subcategory", "variant_size", "variant_color", "variant_price", "variant_stock", "variant_sku"
];

// Minimal RFC4180-style CSV line parser — handles quoted fields containing commas.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  // Normalize line endings, then walk character by character.
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

// Downloadable CSV template — admin fills this in and re-uploads it.
exports.getBulkUploadTemplate = async (req, res) => {
  const header = ALL_COLUMNS.join(",");
  const example1 = [
    "Classic Cotton Tee", "A soft, breathable everyday t-shirt.", "599", "799", "0",
    "https://example.com/images/tee.jpg", "Men", "T-Shirts", "S", "#2c3e50", "", "20", "TEE-BLK-S"
  ].map(v => `"${v}"`).join(",");
  const example2 = [
    "Classic Cotton Tee", "", "", "", "0",
    "", "", "", "M", "#2c3e50", "", "15", "TEE-BLK-M"
  ].map(v => `"${v}"`).join(",");
  const example3 = [
    "Simple Tote Bag", "A no-fuss canvas tote.", "349", "", "40",
    "https://example.com/images/tote.jpg", "Accessories", "Bags", "", "", "", "", ""
  ].map(v => `"${v}"`).join(",");

  const csv = [header, example1, example2, example3].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=product-upload-template.csv");
  res.send(csv);
};

// Bulk create/update products (with optional variants) from CSV text.
// Rows sharing the same product_name are grouped into one product with multiple variants.
// A row with both variant_size and variant_color blank means "this product has no variants" —
// its own stock/price columns are used directly on the product.
exports.bulkUploadProducts = async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== "string") {
      return res.status(400).json({ error: "csvText is required" });
    }

    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      return res.status(400).json({ error: "CSV must have a header row and at least one data row" });
    }

    const header = rows[0].map(h => h.trim().toLowerCase());
    const missing = REQUIRED_COLUMNS.filter(c => !header.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `CSV is missing required column(s): ${missing.join(", ")}` });
    }

    const colIndex = {};
    header.forEach((h, i) => { colIndex[h] = i; });
    const get = (row, col) => (colIndex[col] !== undefined ? (row[colIndex[col]] || "").trim() : "");

    // Group data rows by product_name (case-insensitive)
    const groups = new Map(); // key: lowercased name -> { rows: [...], rowNumbers: [...] }
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = get(row, "product_name");
      if (!name) continue; // skip blank rows
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, { name, rows: [], rowNumbers: [] });
      groups.get(key).rows.push(row);
      groups.get(key).rowNumbers.push(i + 1); // 1-based, +1 for header
    }

    const results = { productsCreated: 0, productsUpdated: 0, variantsCreated: 0, errors: [] };
    const categoryCache = new Map();

    const getOrCreateCategory = async (categoryName) => {
      const key = categoryName.trim().toLowerCase();
      if (categoryCache.has(key)) return categoryCache.get(key);
      let category = await prisma.category.findFirst({ where: { name: { equals: categoryName.trim(), mode: "insensitive" } } });
      if (!category) category = await prisma.category.create({ data: { name: categoryName.trim() } });
      categoryCache.set(key, category);
      return category;
    };

    for (const [, group] of groups) {
      try {
        const firstRow = group.rows.find(r => get(r, "price") && get(r, "category")) || group.rows[0];

        const price = Number(get(firstRow, "price"));
        const categoryName = get(firstRow, "category");
        const stock = Number(get(firstRow, "stock")) || 0;

        if (!price || !categoryName) {
          results.errors.push({ product: group.name, rows: group.rowNumbers, error: "Missing price or category on the first row for this product" });
          continue;
        }

        const category = await getOrCreateCategory(categoryName);

        // Does this product already exist? Match by exact name (case-insensitive).
        let product = await prisma.product.findFirst({ where: { name: { equals: group.name, mode: "insensitive" } } });

        const productData = {
          name: group.name,
          description: get(firstRow, "description") || (product?.description ?? ""),
          price,
          originalPrice: get(firstRow, "original_price") ? Number(get(firstRow, "original_price")) : null,
          stock,
          image: get(firstRow, "image_url") || (product?.image ?? ""),
          subcategory: get(firstRow, "subcategory") || null,
          categoryId: category.id,
        };

        if (product) {
          product = await prisma.product.update({ where: { id: product.id }, data: productData });
          results.productsUpdated++;
        } else {
          product = await prisma.product.create({ data: productData });
          results.productsCreated++;
        }

        // Create/update variant rows (any row with a size or color specified)
        for (const row of group.rows) {
          const size = get(row, "variant_size");
          const color = get(row, "variant_color");
          if (!size && !color) continue; // this row was just the base product definition

          const variantData = {
            size: size || null,
            color: color || null,
            price: get(row, "variant_price") ? Number(get(row, "variant_price")) : null,
            stock: Number(get(row, "variant_stock")) || 0,
            sku: get(row, "variant_sku") || null,
          };

          const existingVariant = await prisma.productVariant.findFirst({
            where: { productId: product.id, size: variantData.size, color: variantData.color }
          });

          if (existingVariant) {
            await prisma.productVariant.update({ where: { id: existingVariant.id }, data: variantData });
          } else {
            await prisma.productVariant.create({ data: { ...variantData, productId: product.id } });
            results.variantsCreated++;
          }
        }
      } catch (rowError) {
        results.errors.push({ product: group.name, rows: group.rowNumbers, error: rowError.message });
      }
    }

    res.json(results);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error processing bulk upload" });
  }
};
