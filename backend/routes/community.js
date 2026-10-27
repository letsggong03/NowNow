const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 게시글 목록 조회
router.get("/posts", async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT 
        P.POST_ID,
        P.CONTENT,
        P.MOOD,
        P.CREATED_AT,
        P.UPDATED_AT,
        P.USER_ID,
        U.USER_NAME,
        COUNT(DISTINCT PL.POST_LIKE_ID) AS LIKE_COUNT,
        COUNT(DISTINCT PC.POST_COMMENT_ID) AS COMMENT_COUNT
      FROM POSTS P
      JOIN USERS U ON P.USER_ID = U.USER_ID
      LEFT JOIN POST_LIKES PL ON P.POST_ID = PL.POST_ID
      LEFT JOIN POST_COMMENTS PC ON P.POST_ID = PC.POST_ID
      GROUP BY P.POST_ID, U.USER_NAME
      ORDER BY P.CREATED_AT DESC
    `);

    res.json(posts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 조회 실패" });
  }
});

// 게시글 작성
router.post("/posts", authMiddleware, async (req, res) => {
  try {
    const { CONTENT, MOOD } = req.body;
    const USER_ID = req.user.USER_ID;

    const result = await pool.query(
      `INSERT INTO POSTS (CONTENT, MOOD, USER_ID)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [CONTENT, MOOD, USER_ID]
    );

    res.status(201).json({
      message: "게시글 작성 성공",
      post: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 작성 실패" });
  }
});

// 게시글 삭제
router.delete("/posts/:POST_ID", authMiddleware, async (req, res) => {
  try {
    const { POST_ID } = req.params;
    const USER_ID = req.user.USER_ID;

    const post = await pool.query("SELECT * FROM POSTS WHERE POST_ID = $1", [
      POST_ID
    ]);

    if (post.rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    if (post.rows[0].user_id !== USER_ID) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await pool.query("DELETE FROM POSTS WHERE POST_ID = $1", [POST_ID]);

    res.json({ message: "게시글 삭제 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 삭제 실패" });
  }
});

// 좋아요 추가 / 취소
router.post("/posts/:POST_ID/like", authMiddleware, async (req, res) => {
  try {
    const { POST_ID } = req.params;
    const USER_ID = req.user.USER_ID;

    const existingLike = await pool.query(
      `SELECT * FROM POST_LIKES 
       WHERE USER_ID = $1 AND POST_ID = $2`,
      [USER_ID, POST_ID]
    );

    if (existingLike.rows.length > 0) {
      await pool.query(
        `DELETE FROM POST_LIKES 
         WHERE USER_ID = $1 AND POST_ID = $2`,
        [USER_ID, POST_ID]
      );

      return res.json({ message: "좋아요 취소 성공" });
    }

    await pool.query(
      `INSERT INTO POST_LIKES (USER_ID, POST_ID)
       VALUES ($1, $2)`,
      [USER_ID, POST_ID]
    );

    res.json({ message: "좋아요 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "좋아요 실패" });
  }
});

// 댓글 목록 조회
router.get("/posts/:POST_ID/comments", async (req, res) => {
  try {
    const { POST_ID } = req.params;

    const comments = await pool.query(
      `
      SELECT 
        PC.POST_COMMENT_ID,
        PC.CONTENT,
        PC.CREATED_AT,
        PC.POST_ID,
        PC.USER_ID,
        U.USER_NAME
      FROM POST_COMMENTS PC
      JOIN USERS U ON PC.USER_ID = U.USER_ID
      WHERE PC.POST_ID = $1
      ORDER BY PC.CREATED_AT ASC
      `,
      [POST_ID]
    );

    res.json(comments.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 조회 실패" });
  }
});

// 댓글 작성
router.post("/posts/:POST_ID/comments", authMiddleware, async (req, res) => {
  try {
    const { POST_ID } = req.params;
    const { CONTENT } = req.body;
    const USER_ID = req.user.USER_ID;

    const result = await pool.query(
      `INSERT INTO POST_COMMENTS (USER_ID, CONTENT, POST_ID)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [USER_ID, CONTENT, POST_ID]
    );

    res.status(201).json({
      message: "댓글 작성 성공",
      comment: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 작성 실패" });
  }
});

// 댓글 삭제
router.delete("/comments/:POST_COMMENT_ID", authMiddleware, async (req, res) => {
  try {
    const { POST_COMMENT_ID } = req.params;
    const USER_ID = req.user.USER_ID;

    const comment = await pool.query(
      "SELECT * FROM POST_COMMENTS WHERE POST_COMMENT_ID = $1",
      [POST_COMMENT_ID]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comment.rows[0].user_id !== USER_ID) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await pool.query("DELETE FROM POST_COMMENTS WHERE POST_COMMENT_ID = $1", [
      POST_COMMENT_ID
    ]);

    res.json({ message: "댓글 삭제 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 삭제 실패" });
  }
});

module.exports = router;