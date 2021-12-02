const e = require("express");
const express = require("express");
const issuesRouter = express.Router({ mergeParams: true });

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

issuesRouter.param('issueId', (req, res, next, issueId) => {
  const sql = "SELECT * FROM Issue WHERE id = $id";
  const values = { $id: issueId };
  db.get(sql, values, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      req.issue = issue;
      next();
    } else {
      res.sendStatus(404);
    }
  });
})

issuesRouter.get("/", (req, res, next) => {
  const sql = "SELECT * FROM Issue WHERE Issue.series_id = $id";
  const values = { $id: req.params.seriesId };
  db.all(sql, values, (err, issues) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ issues: issues });
    }
  });
});

issuesRouter.post("/", (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  const seriesId = req.params.seriesId;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    res.sendStatus(400);
  } else {
    const sql =
      "INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)";
    const values = {
      $name: name,
      $publicationDate: publicationDate,
      $artistId: artistId,
      $seriesId: seriesId,
      $issueNumber: issueNumber,
    };
    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        const sql = "SELECT * FROM Issue WHERE Issue.id = $id";
        const values = { $id: this.lastID };
        db.get(sql, values, (err, issue) => {
          if (err) {
            next(err);
          } else {
            res.status(201).json({ issue: issue });
          }
        });
      }
    });
  }
});

issuesRouter.put("/:issueId", (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  const seriesId = req.params.seriesId;
  const issueId = req.params.issueId;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    res.sendStatus(400);
  } else {
    const sql =
      "UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId, series_id = $seriesId WHERE Issue.id = $issueId";
    const update = {
      $name: name,
      $issueNumber: issueNumber,
      $publicationDate: publicationDate,
      $artistId: artistId,
      $seriesId: seriesId,
      $issueId: issueId,
    };
    db.run(sql, update, function (error) {
      if (error) {
        next(error);
      } else {
        const sql =
          "SELECT * FROM Issue WHERE Issue.id = $id";
        const values = { $id: issueId };
        db.get(sql, values, (err, issue) => {
          if (err) {
            next(err);
          } else {
            res.status(200).json({ issue: issue });
          }
        });
      }
    });
  }
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  const sql = 'DELETE FROM Issue WHERE id = $id';
  const values = { $id: req.params.issueId };
  db.run(sql, values, function(error) {
    if(error) {
      next(error)
    } else {
      res.status(204).send(req.issue)
    }
  }) 
})

module.exports = issuesRouter;
