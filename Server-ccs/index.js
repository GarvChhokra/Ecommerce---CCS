const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors());
const fs = require("fs");
const request = require("request");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require("mysql2");

var db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Garv@123",
  database: "trial",
});

const port = 3200;

const url = "https://ccsdata.onrender.com/ccsData";

app.get("/products", (req, res) => {
  request.get(url, (error, response, body) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error loading data");
    } else {
      const data = JSON.parse(body);

      const lastItem = data[data.length - 1];
      console.log("Last item in the JSON data:", lastItem);

      const checkSql = `SELECT * FROM products ORDER BY id DESC LIMIT 1;`;
      db.query(checkSql, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error inserting data");
        } else {
          console.log("Result of the last data of the table", result);
          console.log(lastItem.name, " ------ ", result[0]?.brand);
          if (result.length === 0 || result[0].name == undefined) {
            console.log("Null");
            data.forEach((item) => {
              const sql = `
                          INSERT INTO products
                          (name, brand, description, category, sub_category, price, image)
                          VALUES (?, ?, ?, ?, ?, ?, ?)
                      `;
              const values = [
                item.name,
                item.brand,
                item.description,
                item.category,
                item["sub-category"],
                Number(item.price.replace(/[^0-9.-]+/g, "")),
                item.image,
              ];
              db.query(sql, values, (err, result) => {
                if (err) {
                  console.error(err);
                  res.status(500).send("Error inserting data");
                } else {
                  console.log(result);
                }
              });
            });
          } else if (
            lastItem.name == result.name &&
            lastItem.price == result.price &&
            lastItem.description == result.description
          ) {
            console.log("Item already there");
          } else {
            console.log("It is already entered");
          }
        }
      });
      res.send("Data inserted successfully");
    }
  });
});

app.post("/fetchProducts", (req, res) => {
  const query = `SELECT * FROM products`;
  db.query(query, (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error getting data");
    } else {
      console.log(result);
      res.json(result);
      //   res.send("Data fetched");
    }
  });
});

app.post("/addProductsCart", (req, res) => {
  const { email, productId, quantity } = req.body;
  const query = `INSERT INTO shopping_cart (user_email, product_id, quantity) VALUES (?,?,?)`;
  console.log(productId);
  db.query(query, [email, productId, quantity || 1], (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error entering data");
    } else {
      console.log(result);
      if (result.affectedRows > 0) {
        res.status(200).send("Product data entered on the cart");
      } else {
        res.status(500).send("Error entering data");
      }
    }
  });
});

// Fetch the shopping cart data and pass to the frontend
app.post("/shoppingcartItems", (req, res) => {
  const { emailData } = req.body;
  console.log("Email Cookie in backend", emailData);
  const query = `SELECT * FROM shopping_cart INNER JOIN products ON shopping_cart.product_id = products.id where shopping_cart.user_email = ?`;
  db.query(query, [emailData], (error, result) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error getting data");
    } else {
      // res.send("Shopping Cart Data fetched successfully")
      console.log("Shopping Cart data", result);
      res.json(result);
    }
  });
});

// Remove Button in shopping Cart
app.post("/removeItems_cart", (req, res) => {
  const { id } = req.body;
  console.log(id);
  const query = `DELETE from shopping_cart where product_id = ?`;
  db.query(query, [id], (error, result) => {
    if (error) {
      console.log(error);
      res.send("Cannot delete product from shopping cart");
    } else {
      console.log("Item removed:", result);
      res.send("Product removed from the cart");
    }
  });
});

app.get("/", (req, res) => res.send("Hello World!"));

//
//
//

app.post("/userLogin", (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM user where email = ? and password = ?`;
  db.query(query, [email, password], (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error getting data");
    } else {
      console.log(result);
      console.log();
      console.log(password);
      // console.log(user.password);
      //   res.send("User Logged in Successfully!");
      if (result.length > 0) {
        const user = result[0];
        // const hashedPassword = md5(password);
        if (user.password === password) {
          console.log("User.password:", user.password);
          console.log("User authenticated:", user);
          res.send("User Logged in Successfully!");
        } else {
          console.log("Invalid password for user:", user);
          res.status(401).send("Invalid email or password");
        }
      } else {
        console.log("User not found with email:", email);
        res.status(401).send("Invalid email or password");
      }
    }
  });
});

//
//

app.post("/userRegistration", (req, res) => {
  const { name, email, password, address, city, province, postalcode } =
    req.body;
  const query = `
      INSERT INTO user (name, email, password, address, city, province, postalcode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  db.query(
    query,
    [name, email, password, address, city, province, postalcode],
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error inserting data");
      } else {
        console.log(results);
        res.send("Data inserted successfully");
      }
    }
  );
});

//
//
//
//
//

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
