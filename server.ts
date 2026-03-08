import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("school.db");
db.pragma('foreign_keys = ON');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS teachers (
    teacher_id TEXT PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    monday TEXT,
    tuesday TEXT,
    wednesday TEXT,
    thursday TEXT,
    friday TEXT
  );

  CREATE TABLE IF NOT EXISTS leaves (
    leave_id TEXT PRIMARY KEY,
    teacher_id TEXT,
    teacher_name TEXT,
    leave_date TEXT,
    day_of_week TEXT,
    reason TEXT,
    FOREIGN KEY(teacher_id) REFERENCES teachers(teacher_id)
  );

  CREATE TABLE IF NOT EXISTS duties (
    duty_id TEXT PRIMARY KEY,
    leave_id TEXT,
    substitute_name TEXT,
    absent_name TEXT,
    date TEXT,
    period INTEGER,
    FOREIGN KEY(leave_id) REFERENCES leaves(leave_id)
  );
`);

// Seed initial subjects if empty
const subjectCount = db.prepare("SELECT count(*) as count FROM subjects").get() as { count: number };
if (subjectCount.count === 0) {
  const initialSubjects = ["คณิตศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "วิทยาศาสตร์", "สังคมศึกษา", "ศิลปะ", "พละศึกษา", "กิจกรรมพัฒนาผู้เรียน"];
  const insert = db.prepare("INSERT INTO subjects (name) VALUES (?)");
  initialSubjects.forEach(s => insert.run(s));
}

// Seed initial teachers if empty
const teacherCount = db.prepare("SELECT count(*) as count FROM teachers").get() as { count: number };
if (teacherCount.count === 0) {
  const initialTeachers = [
    {
      teacher_id: "T001",
      teacher_name: "คุณครูสมชาย",
      monday: '[{"p":1,"s":"คณิตศาสตร์","g":"ป.1"},{"p":2,"s":"ภาษาไทย","g":"ป.2"}]',
      tuesday: '[{"p":1,"s":"วิทยาศาสตร์","g":"ป.1"},{"p":2,"s":"สังคมศึกษา","g":"ป.2"}]',
      wednesday: '[{"p":1,"s":"ภาษาอังกฤษ","g":"ป.1"}]',
      thursday: '[{"p":1,"s":"ศิลปะ","g":"ป.1"},{"p":2,"s":"พละศึกษา","g":"ป.2"}]',
      friday: '[{"p":1,"s":"กิจกรรมพัฒนาผู้เรียน","g":"ป.1"}]'
    },
    {
      teacher_id: "T002", 
      teacher_name: "คุณครูสมหญิง",
      monday: '[{"p":3,"s":"ภาษาไทย","g":"ป.3"},{"p":4,"s":"คณิตศาสตร์","g":"ป.4"}]',
      tuesday: '[{"p":3,"s":"ภาษาอังกฤษ","g":"ป.3"},{"p":4,"s":"วิทยาศาสตร์","g":"ป.4"}]',
      wednesday: '[{"p":3,"s":"สังคมศึกษา","g":"ป.3"}]',
      thursday: '[{"p":3,"s":"ศิลปะ","g":"ป.3"},{"p":4,"s":"พละศึกษา","g":"ป.4"}]',
      friday: '[{"p":3,"s":"กิจกรรมพัฒนาผู้เรียน","g":"ป.3"}]'
    },
    {
      teacher_id: "T003",
      teacher_name: "คุณครูวิชัย",
      monday: '[{"p":5,"s":"คณิตศาสตร์","g":"ป.5"},{"p":6,"s":"ภาษาไทย","g":"ป.6"}]',
      tuesday: '[{"p":5,"s":"วิทยาศาสตร์","g":"ป.5"},{"p":6,"s":"สังคมศึกษา","g":"ป.6"}]',
      wednesday: '[{"p":5,"s":"ภาษาอังกฤษ","g":"ป.5"}]',
      thursday: '[{"p":5,"s":"ศิลปะ","g":"ป.5"},{"p":6,"s":"พละศึกษา","g":"ป.6"}]',
      friday: '[{"p":5,"s":"กิจกรรมพัฒนาผู้เรียน","g":"ป.5"}]'
    }
  ];
  const insert = db.prepare("INSERT INTO teachers (teacher_id, teacher_name, monday, tuesday, wednesday, thursday, friday) VALUES (?, ?, ?, ?, ?, ?, ?)");
  initialTeachers.forEach(t => insert.run(t.teacher_id, t.teacher_name, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/subjects", (req, res) => {
    const data = db.prepare("SELECT name FROM subjects").all();
    res.json(data.map((s: any) => s.name));
  });

  app.get("/api/teachers", (req, res) => {
    const data = db.prepare("SELECT * FROM teachers").all();
    res.json(data);
  });

  app.post("/api/teachers", (req, res) => {
    const { teacher_id, teacher_name, monday, tuesday, wednesday, thursday, friday } = req.body;
    const insert = db.prepare(`
      INSERT INTO teachers (teacher_id, teacher_name, monday, tuesday, wednesday, thursday, friday)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(teacher_id, teacher_name, monday, tuesday, wednesday, thursday, friday);
    res.json({ success: true });
  });

  app.delete("/api/teachers/:id", (req, res) => {
    const deleteDuties = db.prepare("DELETE FROM duties WHERE leave_id IN (SELECT leave_id FROM leaves WHERE teacher_id = ?)");
    const deleteLeaves = db.prepare("DELETE FROM leaves WHERE teacher_id = ?");
    const deleteTeacher = db.prepare("DELETE FROM teachers WHERE teacher_id = ?");
    
    const transaction = db.transaction((id) => {
      deleteDuties.run(id);
      deleteLeaves.run(id);
      deleteTeacher.run(id);
    });
    
    transaction(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/teachers/:id", (req, res) => {
    const { teacher_name, monday, tuesday, wednesday, thursday, friday } = req.body;
    const update = db.prepare(`
      UPDATE teachers 
      SET teacher_name = ?, monday = ?, tuesday = ?, wednesday = ?, thursday = ?, friday = ?
      WHERE teacher_id = ?
    `);
    update.run(teacher_name, monday, tuesday, wednesday, thursday, friday, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/leaves", (req, res) => {
    const data = db.prepare("SELECT * FROM leaves").all();
    res.json(data);
  });

  app.post("/api/leaves", (req, res) => {
    const { leave_id, teacher_id, teacher_name, leave_date, day_of_week, reason } = req.body;
    const insert = db.prepare(`
      INSERT INTO leaves (leave_id, teacher_id, teacher_name, leave_date, day_of_week, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(leave_id, teacher_id, teacher_name, leave_date, day_of_week, reason);
    res.json({ success: true });
  });

  app.delete("/api/leaves/:id", (req, res) => {
    const deleteDuties = db.prepare("DELETE FROM duties WHERE leave_id = ?");
    const deleteLeave = db.prepare("DELETE FROM leaves WHERE leave_id = ?");
    
    const transaction = db.transaction((id) => {
      deleteDuties.run(id);
      deleteLeave.run(id);
    });
    
    transaction(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/leaves/:id", (req, res) => {
    const { teacher_id, teacher_name, leave_date, day_of_week, reason } = req.body;
    const update = db.prepare(`
      UPDATE leaves 
      SET teacher_id = ?, teacher_name = ?, leave_date = ?, day_of_week = ?, reason = ?
      WHERE leave_id = ?
    `);
    update.run(teacher_id, teacher_name, leave_date, day_of_week, reason, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/duties", (req, res) => {
    const data = db.prepare("SELECT * FROM duties").all();
    res.json(data);
  });

  app.post("/api/duties", (req, res) => {
    const { duty_id, leave_id, substitute_name, absent_name, date, period } = req.body;
    
    const transaction = db.transaction(() => {
      // Delete existing duty for this period if it exists
      db.prepare("DELETE FROM duties WHERE leave_id = ? AND period = ?").run(leave_id, period);
      
      // If substitute_name is provided, insert new duty
      if (substitute_name) {
        const insert = db.prepare(`
          INSERT INTO duties (duty_id, leave_id, substitute_name, absent_name, date, period)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        insert.run(duty_id, leave_id, substitute_name, absent_name, date, period);
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.post("/api/verify-admin", (req, res) => {
    const { password } = req.body;
    if (password === "admin1234") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // Fallback to index.html for SPA routing
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "index.html"));
    });
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
