const express = require("express");
const seriesRouter = express.Router();

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

const issuesRouter = require("./issues.js");

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
  const sql = "SELECT * FROM Series WHERE id = $id";
  const values = { $id: seriesId };
  db.get(sql, values, (err, series) => {
    if (err) {
      next(err);
    } else if (series) {
      req.series = series;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

seriesRouter.use("/:seriesId/issues", issuesRouter);

seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Series", (err, series) => {
    if (err) {
      next(err);
    } else {
      res.json({ series: series });
    }
  });
});

seriesRouter.get("/:seriesId", (req, res, next) => {
  res.json({ series: req.series });
});

seriesRouter.post("/", (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    res.sendStatus(400);
  } else {
    const sql =
      "INSERT INTO Series (name, description) VALUES ($name, $description)";
    const values = {
      $name: name,
      $description: description,
    };
    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        const sql = "SELECT * FROM Series WHERE id = $id";
        const values = { $id: this.lastID };
        db.get(sql, values, (err, series) => {
          if (err) {
            next(err);
          } else {
            res.status(201).json({ series: series });
          }
        });
      }
    });
  }
});

seriesRouter.put("/:seriesId", (req, res, next) => {
  const { name, description } = req.body.series;
  const id = req.params.seriesId;
  if (!name || !description) {
    res.sendStatus(400);
  } else {
    const sql =
      "UPDATE Series SET name = $name, description = $description WHERE id = $id";
    const values = {
      $name: name,
      $description: description,
      $id: id,
    };
    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        const sql = "SELECT * FROM Series WHERE id = $id";
        const values = { $id: id };
        db.get(sql, values, (err, series) => {
          if (err) {
            next(err);
          } else {
            res.json({ series: series });
          }
        });
      }
    });
  }
});

seriesRouter.delete("/:seriesId", (req, res, next) => {
  const seriesId = req.params.seriesId
  const sql = "SELECT * FROM Issue WHERE Issue.series_id = $seriesId";
  const values = { $seriesId: seriesId };
  db.all(sql, values, (err, issues) => {
    console.log(issues)
    if (err) {
      next(err);
    } else if (issues.length > 0) {
      res.sendStatus(400);
    } else {
      const sql = "DELETE FROM Series WHERE Series.id = $seriesId";
      const values = { $seriesId: seriesId };
      db.run(sql, values, function(error) {
        if(error) {
          next(error)
        } else {
          res.status(204).send(req.series);
        }
      })
    }
  });
});

module.exports = seriesRouter;
