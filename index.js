const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Session management
app.use(
  session({
    secret: "Iamsaved.", // Change to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL Database.");
  }
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Serve the registration page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

// User Registration Route
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err.message);
      return res.status(500).send("Error registering user");
    }

    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(query, [name, email, hashedPassword], (err, results) => {
      if (err) {
        console.error("Error registering user:", err.message);
        return res.status(500).send("Error registering user");
      }
      // Redirect to login page after successful registration
      res.redirect("/login");
    });
  });
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// User Login Route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      console.error(
        "User not found or error:",
        err ? err.message : "User not found"
      );
      return res.status(401).send("Invalid email or password");
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        console.error("Password mismatch:", err);
        return res.status(401).send("Invalid email or password");
      }

      // Store user information in session
      req.session.userId = user.id;
      req.session.userName = user.name;

      // Log user ID for debugging
      console.log("User ID stored in session:", req.session.userId);

      // Redirect to the view expense page
      res.redirect("/view_expense.html");
    });
  });
});

// Expense Routes
app.get("/add_expense.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "add_expense.html"));
});

app.get("/edit_expense.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "edit_expense.html"));
});

app.get("/view_expense.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "view_expense.html"));
});

// Add Expense Route
app.post("/add-expense", (req, res) => {
  const { date, amount, description, category, paymentMethod } = req.body;

  // Log expense details
  console.log("Adding expense:", {
    date,
    amount,
    description,
    category,
    paymentMethod,
    userId: req.session.userId,
  });

  const query =
    "INSERT INTO expenses (date, amount, description, category, paymentMethod, user_id) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [date, amount, description, category, paymentMethod, req.session.userId],
    (err, results) => {
      if (err) {
        console.error("Error adding expense:", err.message);
        return res.status(500).send("Error adding expense");
      }
      // Redirect to the view expenses page after successfully adding the expense
      res.redirect("/view_expense.html");
    }
  );
});

// Get Expenses Route
app.get("/expenses", (req, res) => {
  // Ensure user is logged in
  if (!req.session.userId) {
    return res.status(401).send("Unauthorized");
  }

  const query = "SELECT * FROM expenses WHERE user_id = ?";
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      console.error("Error retrieving expenses:", err.message);
      return res.status(500).send("Error retrieving expenses");
    }
    res.status(200).json(results);
  });
});
// API route to fetch an entire expense row for editing
app.get("/api/edit_expense/:id", (req, res) => {
  try {
    const expenseId = req.params.id;

    // SQL query to fetch the entire row where id and user_id match
    const query = "SELECT * FROM expenses WHERE id = ? AND user_id = ?";
    db.query(query, [expenseId, req.session.userId], (err, results) => {
      if (err) {
        console.error("Error getting expense:", err.message);
        return res.status(500).send("Error getting expense");
      }

      // Check if the expense was found
      if (results.length === 0) {
        // If no expense is found, return a 404 error with JSON
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });
      }

      // Send the entire row (first result) in the response
      res.status(200).json({ message: "success", expense: results[0] });
      console.log(results); 
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Unexpected error occurred");
  }
});

// Update Expense Route
app.put("/edit-expense/:id", (req, res) => {
  const expenseId = req.params.id;
  const { date, amount, description } = req.body;

  const query =
    "UPDATE expenses SET date = ?, amount = ?, description = ? WHERE id = ? AND user_id = ?";
  db.query(
    query,
    [date, amount, description, expenseId, req.session.userId],
    (err, results) => {
      if (err) {
        console.error("Error updating expense:", err.message);
        return res.status(500).send("Error updating expense");
      }
      res.status(200).json({ message: "Expense updated successfully" });
    }
  );
});

// Delete Expense Route
app.delete("/delete-expense/:id", (req, res) => {
  const expenseId = req.params.id;

  const query = "DELETE FROM expenses WHERE id = ? AND user_id = ?";
  db.query(query, [expenseId, req.session.userId], (err, results) => {
    if (err) {
      console.error("Error deleting expense:", err.message);
      return res.status(500).send("Error deleting expense");
    }
    res.status(200).json({ message: "Expense deleted successfully" });
  });
});
app.get("/api/expense", (req, res) => {
  const query = "SELECT SUM(amount) AS total FROM expenses WHERE user_id = ?";
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      console.error("Error calculating total expenses:", err.message);
      return res.status(500).send("Error calculating total expenses");
    }
    res.status(200).json({ total: results[0].total || 0 });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
