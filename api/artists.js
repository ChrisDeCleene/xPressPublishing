const express = require("express");
const artistsRouter = express.Router();

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

artistsRouter.param("artistId", function (req, res, next, artistId) {
  const sql = "SELECT * FROM Artist WHERE Artist.id = $artistId";
  const values = { $artistId: artistId };
  db.get(sql, values, (err, artist) => {
    if (err) {
      next(err);
    } else if (artist) {
      req.artist = artist;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

artistsRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM Artist WHERE is_currently_employed = 1",
    (err, artists) => {
      if (err) {
        next(err);
      } else {
        res.json({ artists: artists });
      }
    }
  );
});

artistsRouter.get("/:artistId", (req, res, next) => {
  res.json({ artist: req.artist });
});

artistsRouter.post("/", (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

  if (!name || !dateOfBirth || !biography) {
    res.sendStatus(400);
  } else {
    const sql =
      "INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)";
    const values = {
      $name: name,
      $dateOfBirth: dateOfBirth,
      $biography: biography,
      $isCurrentlyEmployed: isCurrentlyEmployed,
    };
    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        db.get(
          "SELECT * FROM Artist WHERE id = $id",
          {
            $id: this.lastID,
          },
          (err, artist) => {
            if (err) {
              next(err);
            } else {
              res.status(201).json({ artist: artist });
            }
          }
        );
      }
    });
  }
});

artistsRouter.put("/:artistId", (req, res, next) => {
  const { name, dateOfBirth, biography, isCurrentlyEmployed } = req.body.artist;
  const id = req.params.artistId;
  if (!name || !dateOfBirth || !biography || !isCurrentlyEmployed) {
    res.sendStatus(400);
  } else {
    const sql =
      "UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $id";
    const values = {
      $name: name,
      $dateOfBirth: dateOfBirth,
      $biography: biography,
      $isCurrentlyEmployed: isCurrentlyEmployed,
      $id: id,
    };
    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        db.get(
          "SELECT * FROM Artist WHERE id = $id",
          {
            $id: id,
          },
          (err, artist) => {
            if (err) {
              next(err);
            } else {
              res.json({ artist: artist });
            }
          }
        );
      }
    });
  }
});

artistsRouter.delete("/:artistId", (req, res, next) => {
  const id = req.params.artistId;
  const sql = "UPDATE Artist SET is_currently_employed = 0 WHERE id = $id";
  const values = { $id: id };
  db.run(sql, values, function (error) {
    if (error) {
      next(error);
    } else {
      db.get("SELECT * FROM Artist WHERE id = $id", values, (err, artist) => {
        if (err) {
          next(err);
        } else {
          res.send({ artist: artist });
        }
      });
    }
  });
});

module.exports = artistsRouter;
