import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/lib/auth-middleware.ts';
import {
  bootstrapDatabase,
  getSchoolsList,
  getClassesList,
  getTeachersList,
  getHouseMastersList,
  getStudentsList,
  getAttendanceList,
  saveStudentProfile,
  removeStudentFromDb,
  saveAttendanceRecord,
  getOrCreateUser,
  updateUserRole,
  saveClassSection,
  deleteClassSection,
  saveTeacherProfile,
  deleteTeacherProfile,
  saveHouseMasterProfile,
  deleteHouseMasterProfile
} from './src/db/helpers.ts';
import { House } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware
  app.use(express.json());

  // Bootstrap Database (Seed if empty)
  await bootstrapDatabase();

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  // Auth synchronization (registers user on Google login)
  app.post('/api/auth/sync', async (req, res) => {
    try {
      const { uid, email, name } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing required parameters uid or email' });
      }
      const user = await getOrCreateUser(uid, email, name);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth update profile role
  app.post('/api/auth/role', async (req, res) => {
    try {
      const { uid, role, schoolId, classId } = req.body;
      if (!uid || !role) {
        return res.status(400).json({ error: 'Missing required parameters uid or role' });
      }
      const user = await updateUserRole(uid, role, schoolId, classId);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch directory data
  app.get('/api/schools', async (req, res) => {
    try {
      const list = await getSchoolsList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/classes', async (req, res) => {
    try {
      const list = await getClassesList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/teachers', async (req, res) => {
    try {
      const list = await getTeachersList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/house-masters', async (req, res) => {
    try {
      const list = await getHouseMastersList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/students', async (req, res) => {
    try {
      const list = await getStudentsList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/attendance', async (req, res) => {
    try {
      const list = await getAttendanceList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Student Mutations
  app.post('/api/students', async (req, res) => {
    try {
      const student = req.body;
      if (!student.id || !student.schoolId || !student.name || !student.classId) {
        return res.status(400).json({ error: 'Missing student parameters' });
      }
      const saved = await saveStudentProfile(student);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await removeStudentFromDb(id);
      res.json({ success: true, message: 'Student and attendance records deleted.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Attendance Mutation
  app.post('/api/attendance', async (req, res) => {
    try {
      const record = req.body;
      if (!record.id || !record.schoolId || !record.studentId || !record.date || !record.status) {
        return res.status(400).json({ error: 'Missing attendance record parameters' });
      }
      const saved = await saveAttendanceRecord(record);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Class Section Mutations
  app.post('/api/classes', async (req, res) => {
    try {
      const cls = req.body;
      if (!cls.id || !cls.name) {
        return res.status(400).json({ error: 'Missing class parameters' });
      }
      const saved = await saveClassSection(cls);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/classes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteClassSection(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Teacher Mutations
  app.post('/api/teachers', async (req, res) => {
    try {
      const teacher = req.body;
      if (!teacher.id || !teacher.name || !teacher.schoolId || !teacher.designation) {
        return res.status(400).json({ error: 'Missing teacher parameters' });
      }
      const saved = await saveTeacherProfile(teacher);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteTeacherProfile(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // House Master Mutations
  app.post('/api/house-masters', async (req, res) => {
    try {
      const master = req.body;
      if (!master.house || !master.schoolId || !master.masterName) {
        return res.status(400).json({ error: 'Missing house master parameters' });
      }
      const saved = await saveHouseMasterProfile(master);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/house-masters/:house/:schoolId', async (req, res) => {
    try {
      const { house, schoolId } = req.params;
      await deleteHouseMasterProfile(house as House, schoolId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite & Frontend Serving ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
