const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shop'
});

// Set up multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');
// Enable static files
app.use(express.static('public'));

app.use(express.urlencoded({
    extended: false
}));

// Define routes

// Home route to get all products
app.get('/', (req, res) => {
    const sql = "SELECT * FROM products";
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.render('index', { products: results }); // Render HTML page with data
    });
});

// Retrieve product by ID
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving product by ID');
        }
        if (results.length > 0) {
            res.render('product', { product: results[0] });
        } else {
            res.status(404).send('Product not found');
        }
    });
});

// Render add product page
app.get('/addProduct', (req, res) => {
    res.render("addProduct");
});

// Add a new product
app.post('/addProduct', upload.single('image'), (req, res) => {
    const { name, quantity, price } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }
    const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name, quantity, price, image], (error, results) => {
        if (error) {
            console.error('Error adding product', error);
            res.status(500).send('Error adding product');
        } else {
            res.redirect('/');
        }
    });
});

// Render update product page
app.get('/updateProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    connection.query(sql, [productId], (error, results) => {
        if (error) throw error;
        if (results.length > 0)
            res.render('updateProduct', { product: results[0] });
        else
            res.status(404).send('Product not found');
    });
});

// Update a product
app.post('/updateProduct/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const { name, quantity, price } = req.body;
    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?';
    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) throw error;
        res.redirect('/');
    });
});

// Delete a product
app.get('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM products WHERE productId = ?';
    connection.query(sql, [productId], (error, results) => {
        if (error) throw error;
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));