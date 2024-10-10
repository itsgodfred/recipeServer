const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./database");
const PORT = 4000;
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(express.json());
app.use(cors(corsOptions));

app.get("/", async (req, res) => {
  res.send("DFGHJ");
});

app.get("/getRate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM actualrate WHERE recipe_id = $1",
      [id]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res
        .status(404)
        .json({ error: "Rating not found for the provided recipe_id" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/addUtente", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.json({
        error: "username is required",
      });
    }
    if (!password) {
      return res.json({
        error: "password is required",
      });
    }

    const utente = await pool.query("SELECT * FROM utente where username=$1", [
      username,
    ]);

    if (utente.rows.length > 0) {
      return res.json({
        error: "user is already exists",
      });
    } else {
      const newUser = await pool.query(
        `
            INSERT INTO utente (username, password) VALUES ($1, $2) RETURNING *
          `,
        [username, password]
      );
      return res.json(newUser.rows[0]);
    }

    //res.json(newUser.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.json({
        error: "username is required",
      });
    }
    if (!password) {
      return res.json({
        error: "password is required",
      });
    }

    const utente = await pool.query(
      "SELECT * FROM utente where username=$1 and password=$2",
      [username, password]
    );

    if (utente.rows.length > 0) {
      return res.json(utente.rows[0]);
    } else {
      return res.json({ error: "User doesn't exist" });
    }

    //res.json(newUser.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/updateRate/:id/:rate", async (req, res) => {
  try {
    const { id, rate } = req.params; // Expecting JSON input with tableName and columnName

    if (!id || !rate) {
      return res
        .status(400)
        .json({ error: "Table name and column name are required." });
    }
    const update = await pool.query(
      "INSERT INTO rating (recipe_id, rate) VALUES ($1, $2)",
      [id, rate]
    );

    const utente = await pool.query(
      "SELECT AVG(rate) AS average_rating FROM rating WHERE recipe_id = $1",
      [id]
    );
    const averageRating = Math.round(utente.rows[0].average_rating);
    const utente1 = await pool.query(
      "UPDATE actualrate SET rate = $1 WHERE recipe_id = $2",
      [averageRating, id]
    );
    return res.json(utente.rows[0]);
  } catch (err) {
    console.error("Error executing query", err.stack);
    res
      .status(500)
      .json({ error: "An error occurred while updating the table." });
  }
});

app.post("/addFavourite", async (req, res) => {
  try {
    const { utenteid, favourite } = req.body;
    if (!utenteid) {
      return res.json({
        error: "utenteid is required",
      });
    }
    if (!favourite) {
      return res.json({
        error: "favourite is required",
      });
    }

    const newUser = await pool.query(
      `
            INSERT INTO favourites (utente_id, recipe_id) VALUES ($1, $2) RETURNING *
          `,
      [utenteid, favourite]
    );
    return res.json({
      message: "favourite added",
    });

    //res.json(newUser.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/getAllfavourites/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM favourites WHERE utente_id=$1 ",
      [id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getFavourite/:utenteid/:recipe", async (req, res) => {
  try {
    const { utenteid, recipe } = req.params;

    const result = await pool.query(
      "SELECT * FROM favourites WHERE recipe_id = $1 and utente_id=$2",
      [recipe, utenteid]
    );

    if (result.rows.length === 0) {
      return res.json([]); // Return empty array
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/deleteFavourite/:favourite/:utenteid", async (req, res) => {
  try {
    const { favourite, utenteid } = req.params;
    if (!utenteid) {
      return res.json({
        error: "utenteid is required",
      });
    }
    if (!favourite) {
      return res.json({
        error: "favourite is required",
      });
    }

    const newUser = await pool.query(
      `
            DELETE FROM favourites WHERE recipe_id = $1 and utente_id=$2
          `,
      [favourite, utenteid]
    );
    const newUser2 = await pool.query(
      `
            SELECT COUNT(*) FROM favourites WHERE utente_id=$1
          `,
      [utenteid]
    );

    res.json(newUser.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
