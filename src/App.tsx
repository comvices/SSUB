import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  UserPlus, 
  LogOut, 
  School, 
  Plus, 
  Trash2, 
  Edit,
  Printer, 
  CheckCircle2,
  Calendar,
  BookOpen,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
interface Teacher {
  teacher_id: string;
  teacher_name: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
}

interface Leave {
  leave_id: string;
  teacher_id: string;
  teacher_name: string;
  leave_date: string;
  day_of_week: string;
  reason: string;
}

interface Duty {
  duty_id: string;
  leave_id: string;
  substitute_name: string;
  absent_name: string;
  date: string;
  period: number;
  message?: string;
}

interface ScheduleItem {
  p: number;
  s: string;
  g: string;
}

// --- Components ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [printData, setPrintData] = useState<{ leave: Leave, duties: Duty[] } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayLabels = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handlePrint = (l: Leave) => {
    const relevantDuties = duties.filter(d => d.leave_id === l.leave_id);
    setPrintData({ leave: l, duties: relevantDuties });
    setTimeout(() => window.print(), 100);
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, lRes, dRes, sRes] = await Promise.all([
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch('/api/duties').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json())
      ]);
      setTeachers(tRes);
      setLeaves(lRes);
      setDuties(dRes);
      setSubjects(sRes);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#059669'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ผิดพลาด',
          text: 'รหัสผ่านไม่ถูกต้อง',
          confirmButtonColor: '#059669'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#059669'
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-white/20"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              <School className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 text-center leading-tight">ระบบจัดการสอนแทน</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">โรงเรียนอนุบาลหัวหิน(บ้านหนองขอน)</p>
          </div>
          
          <div className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่านผู้ดูแลระบบ"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none text-center text-lg transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button 
              onClick={handleLogin}
              className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-emerald-600 text-white px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none">Smart Sub</h2>
            <p className="text-[10px] text-white/70 font-medium">โรงเรียนอนุบาลหัวหิน(บ้านหนองขอน)</p>
          </div>
        </div>
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-grow">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
          {/* Tabs */}
          <div className="flex bg-slate-50/50 border-b overflow-x-auto scrollbar-hide">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<ClipboardList className="w-4 h-4" />}
              label="กระดานงาน"
            />
            <TabButton 
              active={activeTab === 'stats'} 
              onClick={() => setActiveTab('stats')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="สถิติสอนแทน"
            />
            <TabButton 
              active={activeTab === 'teachers'} 
              onClick={() => setActiveTab('teachers')}
              icon={<Users className="w-4 h-4" />}
              label="ข้อมูลครู"
            />
            <TabButton 
              active={activeTab === 'add'} 
              onClick={() => setActiveTab('add')}
              icon={<UserPlus className="w-4 h-4" />}
              label="เพิ่มครูใหม่"
            />
          </div>

          <div className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  leaves={leaves} 
                  teachers={teachers} 
                  duties={duties}
                  onRefresh={fetchData}
                  setPrintData={setPrintData}
                  onPrint={handlePrint}
                  loading={loading}
                />
              )}
              {activeTab === 'stats' && (
                <Stats duties={duties} />
              )}
              {activeTab === 'teachers' && (
                <TeacherList 
                  teachers={teachers} 
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 'add' && (
                <AddTeacher 
                  subjects={subjects} 
                  onSuccess={() => {
                    setActiveTab('teachers');
                    fetchData();
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {printData && (
        <div className="print-only" ref={printRef}>
          <MemorandumPrint leave={printData.leave} duties={printData.duties} teachers={teachers} />
        </div>
      )}

      <footer className="py-8 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        © 2026 Smart Sub System • Anuban Huahin School
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-5 px-6 flex items-center justify-center gap-2 transition-all relative min-w-[140px] ${
        active ? 'text-emerald-600 font-bold bg-white' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600"
        />
      )}
    </button>
  );
}

// --- Sub Components ---

function Dashboard({ leaves, teachers, duties, onRefresh, setPrintData, onPrint, loading }: { 
  leaves: Leave[], 
  teachers: Teacher[], 
  duties: Duty[], 
  onRefresh: () => void, 
  setPrintData: (data: { leave: Leave, duties: Duty[] } | null) => void,
  onPrint: (l: Leave) => void,
  loading: boolean
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  const handleDeleteLeave = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบรายการลานี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
      onRefresh();
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">รายการจัดสอนแทน</h3>
          <p className="text-sm text-slate-400 font-medium">จัดการและมอบหมายภาระงานสอนแทนรายวัน</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>บันทึกรายการจัดสอนแทน</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">กำลังโหลดข้อมูล...</p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center">
          <p className="text-slate-400 font-bold">ยังไม่มีรายการการลาในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaves.map(lv => (
            <LeaveCard 
              key={lv.leave_id} 
              leave={lv} 
              teachers={teachers} 
              duties={duties}
              onEdit={() => setEditingLeave(lv)}
              onDelete={() => handleDeleteLeave(lv.leave_id)}
              onRefresh={onRefresh}
              onPrint={onPrint}
            />
          ))}
        </div>
      )}

      {showModal && (
        <LeaveModal 
          teachers={teachers} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            onRefresh();
          }}
        />
      )}

      {editingLeave && (
        <EditLeaveModal 
          leave={editingLeave}
          teachers={teachers}
          onClose={() => setEditingLeave(null)}
          onSuccess={() => {
            setEditingLeave(null);
            onRefresh();
          }}
        />
      )}
    </motion.div>
  );
}

function LeaveCard({ leave, teachers, duties, onEdit, onDelete, onRefresh, onPrint }: { 
  key?: string, 
  leave: Leave, 
  teachers: Teacher[], 
  duties: Duty[], 
  onEdit: () => void, 
  onDelete: () => void | Promise<void>, 
  onRefresh: () => void, 
  onPrint: (l: Leave) => void
}) {
  const absentTeacher = teachers.find(t => t.teacher_id === leave.teacher_id);
  let schedule: ScheduleItem[] = [];
  try {
    schedule = JSON.parse(absentTeacher?.[leave.day_of_week as keyof Teacher] || '[]');
  } catch (e) {}

  const handleAssign = async (period: number, subName: string) => {
    const existingDuty = duties.find(d => d.leave_id === leave.leave_id && d.period === period);
    const isCurrentlyAssigned = existingDuty?.substitute_name === subName;

    if (isCurrentlyAssigned) {
      const result = await Swal.fire({
        title: 'ยกเลิกการมอบหมาย',
        text: `คุณต้องการยกเลิกการสอนแทนของคุณครู ${subName} ในคาบที่ ${period} ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'ยืนยันการยกเลิก',
        cancelButtonText: 'ปิด'
      });

      if (result.isConfirmed) {
        await fetch('/api/duties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leave_id: leave.leave_id,
            period,
            substitute_name: null // This will trigger deletion in backend
          })
        });
        onRefresh();
      }
      return;
    }

    const result = await Swal.fire({
      title: 'มอบหมายงาน',
      text: existingDuty 
        ? `เปลี่ยนผู้สอนแทนจากคุณครู ${existingDuty.substitute_name} เป็นคุณครู ${subName} ในคาบที่ ${period} ใช่หรือไม่?`
        : `มอบหมายให้คุณครู ${subName} สอนแทนในคาบที่ ${period} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duty_id: `D-${Date.now()}-${period}`,
          leave_id: leave.leave_id,
          substitute_name: subName,
          absent_name: leave.teacher_name,
          date: leave.leave_date,
          period
        })
      });
      onRefresh();
      Swal.fire({
        icon: 'success',
        title: 'มอบหมายสำเร็จ',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all border-t-4 border-t-emerald-500">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-lg text-slate-800">{leave.teacher_name}</h4>
              <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{leave.reason}</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              {leave.leave_date} | {leave.day_of_week}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onPrint(leave)}
            title="พิมพ์บันทึกข้อความ"
            className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={onEdit} title="แก้ไข" className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"><Edit className="w-5 h-5" /></button>
          <button onClick={onDelete} title="ลบ" className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.map(item => {
          const assigned = duties.find(d => d.leave_id === leave.leave_id && d.period === item.p);
          const available = teachers
            .filter(t => t.teacher_id !== leave.teacher_id)
            .filter(t => {
              try {
                const s = JSON.parse(t[leave.day_of_week as keyof Teacher] || '[]');
                return !s.some((si: any) => si.p === item.p);
              } catch(e) { return true; }
            });

          return (
            <div key={item.p} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-emerald-600 uppercase">คาบที่ {item.p}: {item.s} ({item.g})</span>
                <span className="text-[10px] text-slate-400 font-bold">ว่าง {available.length} ท่าน</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {available.map(t => {
                  const isAssigned = assigned?.substitute_name === t.teacher_name;
                  return (
                    <button 
                      key={t.teacher_id}
                      onClick={() => handleAssign(item.p, t.teacher_name)}
                      className={`text-[10px] px-3 py-1.5 rounded-xl border-2 font-bold transition-all ${
                        isAssigned 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      {t.teacher_name} {isAssigned && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaveModal({ teachers, onClose, onSuccess }: { teachers: Teacher[], onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    teacher_id: teachers[0]?.teacher_id || '',
    leave_date: '',
    reason: 'ไปราชการ'
  });

  const handleSubmit = async () => {
    if (!formData.leave_date) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาเลือกวันที่ลา',
        confirmButtonColor: '#059669'
      });
    }
    
    const selectedDate = new Date(formData.leave_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return Swal.fire({
        icon: 'warning',
        title: 'วันที่ไม่ถูกต้อง',
        text: 'ไม่สามารถเลือกวันที่ผ่านมาแล้ว',
        confirmButtonColor: '#059669'
      });
    }
    
    const date = new Date(formData.leave_date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    
    if (dayName === 'sunday' || dayName === 'saturday') {
      return Swal.fire({
        icon: 'info',
        title: 'เลือกวันไม่ถูกต้อง',
        text: 'กรุณาเลือกวันจันทร์-ศุกร์',
        confirmButtonColor: '#059669'
      });
    }

    const teacher = teachers.find(t => t.teacher_id === formData.teacher_id);
    await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leave_id: `LV-${Date.now()}`,
        teacher_id: formData.teacher_id,
        teacher_name: teacher?.teacher_name,
        leave_date: formData.leave_date,
        day_of_week: dayName,
        reason: formData.reason
      })
    });
    Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ',
      showConfirmButton: false,
      timer: 1500
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-xl font-black text-slate-800 mb-6">บันทึกรายการลา</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ครูที่ลา</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.teacher_id}
              onChange={e => setFormData({...formData, teacher_id: e.target.value})}
            >
              {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่ลา</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.leave_date}
              onChange={e => setFormData({...formData, leave_date: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เหตุผล</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
            >
              <option>ไปราชการ</option>
              <option>ลาป่วย</option>
              <option>ลากิจ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 p-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition">ยกเลิก</button>
            <button onClick={handleSubmit} className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition">บันทึก</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EditLeaveModal({ leave, teachers, onClose, onSuccess }: { leave: Leave, teachers: Teacher[], onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    teacher_id: leave.teacher_id,
    leave_date: leave.leave_date,
    reason: leave.reason
  });

  const handleSubmit = async () => {
    if (!formData.leave_date) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาเลือกวันที่ลา',
        confirmButtonColor: '#059669'
      });
    }
    
    const selectedDate = new Date(formData.leave_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return Swal.fire({
        icon: 'warning',
        title: 'วันที่ไม่ถูกต้อง',
        text: 'ไม่สามารถเลือกวันที่ผ่านมาแล้ว',
        confirmButtonColor: '#059669'
      });
    }
    
    const date = new Date(formData.leave_date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    
    if (dayName === 'sunday' || dayName === 'saturday') {
      return Swal.fire({
        icon: 'info',
        title: 'เลือกวันไม่ถูกต้อง',
        text: 'กรุณาเลือกวันจันทร์-ศุกร์',
        confirmButtonColor: '#059669'
      });
    }

    const teacher = teachers.find(t => t.teacher_id === formData.teacher_id);
    await fetch(`/api/leaves/${leave.leave_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: formData.teacher_id,
        teacher_name: teacher?.teacher_name,
        leave_date: formData.leave_date,
        day_of_week: dayName,
        reason: formData.reason
      })
    });
    Swal.fire({
      icon: 'success',
      title: 'แก้ไขสำเร็จ',
      showConfirmButton: false,
      timer: 1500
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-xl font-black text-slate-800 mb-6">แก้ไขรายการลา</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ครูที่ลา</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.teacher_id}
              onChange={e => setFormData({...formData, teacher_id: e.target.value})}
            >
              {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่ลา</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.leave_date}
              onChange={e => setFormData({...formData, leave_date: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เหตุผล</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
            >
              <option>ไปราชการ</option>
              <option>ลาป่วย</option>
              <option>ลากิจ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 p-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition">ยกเลิก</button>
            <button onClick={handleSubmit} className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition">บันทึกการแก้ไข</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function formatThaiDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function MemorandumPrint({ leave, duties, teachers }: { leave: Leave, duties: Duty[], teachers: Teacher[] }) {
  const sortedDuties = [...duties].sort((a, b) => a.period - b.period);
  const absentTeacher = teachers.find(t => t.teacher_id === leave.teacher_id);
  let teacherSchedule: ScheduleItem[] = [];
  try {
    teacherSchedule = JSON.parse(absentTeacher?.[leave.day_of_week as keyof Teacher] || '[]');
  } catch (e) {}
  
  return (
    <div className="p-12 text-black leading-relaxed bg-white" style={{ fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif", width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Header with Garuda */}
      <div className="relative mb-6">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Phra_Krut_Pha.svg/512px-Phra_Krut_Pha.svg.png" 
          alt="Garuda" 
          className="w-20 h-20 absolute left-0 top-0"
          referrerPolicy="no-referrer"
        />
        <h2 className="text-3xl font-bold text-center pt-10">บันทึกข้อความ</h2>
      </div>
      
      <div className="space-y-2 mb-6 mt-12">
        <div className="flex items-baseline">
          <span className="font-bold text-lg mr-2">ส่วนราชการ</span>
          <span className="border-b border-dotted border-black flex-grow text-lg">โรงเรียนอนุบาลหัวหิน(บ้านหนองขอน) สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาประจวบคีรีขันธ์ เขต 2</span>
        </div>
        <div className="flex justify-between items-baseline">
          <div className="flex flex-grow items-baseline">
            <span className="font-bold text-lg mr-2">ที่</span>
            <span className="border-b border-dotted border-black flex-grow text-lg">อว ๐๐๐๐/................................................</span>
          </div>
          <div className="flex flex-grow ml-12 items-baseline">
            <span className="font-bold text-lg mr-2">วันที่</span>
            <span className="border-b border-dotted border-black flex-grow text-lg text-center">{formatThaiDate(leave.leave_date)}</span>
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="font-bold text-lg mr-2">เรื่อง</span>
          <span className="border-b border-dotted border-black flex-grow text-lg">ขออนุมัติจัดครูสอนแทนกรณีครูลาหยุดราชการ</span>
        </div>
      </div>

      <div className="mb-6 text-lg">
        <span className="font-bold">เรียน</span> ผู้อำนวยการโรงเรียนอนุบาลหัวหิน(บ้านหนองขอน)
      </div>

      <div className="text-justify mb-6 indent-16 text-lg">
        ด้วยข้าพเจ้า <span className="font-bold">{leave.teacher_name}</span> ตำแหน่ง ครู มีความประสงค์ขอลาหยุดราชการเนื่องจาก 
        <span className="font-bold"> {leave.reason} </span> ในวันที่ <span className="font-bold">{formatThaiDate(leave.leave_date)}</span> 
        เพื่อให้การเรียนการสอนดำเนินไปด้วยความเรียบร้อย ข้าพเจ้าจึงขอเสนอรายชื่อผู้ปฏิบัติหน้าที่สอนแทน ดังนี้
      </div>

      <table className="w-full border-collapse border border-black mb-8 text-lg">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-black p-2 text-center w-20">คาบที่</th>
            <th className="border border-black p-2 text-center">วิชา/ชั้น</th>
            <th className="border border-black p-2 text-center">ครูผู้สอนแทน</th>
            <th className="border border-black p-2 text-center w-40">ลงชื่อ</th>
          </tr>
        </thead>
        <tbody>
          {sortedDuties.map((d, idx) => {
            const scheduleItem = teacherSchedule.find(s => s.p === d.period);
            return (
              <tr key={idx}>
                <td className="border border-black p-2 text-center">{d.period}</td>
                <td className="border border-black p-2 text-center">
                  {scheduleItem ? `${scheduleItem.s} (${scheduleItem.g})` : '-'}
                </td>
                <td className="border border-black p-2 text-center">{d.substitute_name}</td>
                <td className="border border-black p-2 text-center"></td>
              </tr>
            );
          })}
          {sortedDuties.length === 0 && (
            <tr>
              <td colSpan={4} className="border border-black p-6 text-center text-slate-400 italic">
                ไม่ได้ระบุรายชื่อผู้สอนแทนในระบบ
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="text-justify mb-12 indent-16 text-lg">
        จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
      </div>

      <div className="flex justify-end mb-16">
        <div className="text-center w-80 text-lg">
          <p className="mb-10">ลงชื่อ...........................................................</p>
          <p>( {leave.teacher_name} )</p>
          <p>ตำแหน่ง ครู</p>
        </div>
      </div>

      <div className="border-t border-black pt-10">
        <div className="grid grid-cols-2 gap-12">
          <div className="text-center text-lg">
            <p className="font-bold mb-6">ความเห็นของหัวหน้ากลุ่มสาระฯ/วิชาการ</p>
            <p className="mb-4 text-slate-300">...........................................................</p>
            <p className="mb-10 text-slate-300">...........................................................</p>
            <p>ลงชื่อ...........................................................</p>
            <p className="mt-2">(...........................................................)</p>
          </div>
          <div className="text-center text-lg">
            <p className="font-bold mb-6">คำสั่ง/ผลการพิจารณา</p>
            <p className="mb-6">( ) อนุมัติ      ( ) ไม่อนุมัติ</p>
            <p className="mb-10 text-slate-300">...........................................................</p>
            <p>ลงชื่อ...........................................................</p>
            <p className="mt-2">(...........................................................)</p>
            <p className="mt-2 text-sm">ผู้อำนวยการโรงเรียนอนุบาลหัวหิน(บ้านหนองขอน)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats({ duties }: { duties: Duty[] }) {
  const counts: Record<string, number> = {};
  duties.forEach(d => {
    counts[d.substitute_name] = (counts[d.substitute_name] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const max = sorted[0]?.count || 1;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center mb-10">
        <h3 className="text-2xl font-black text-slate-800">ลำดับครูช่วยสอนแทน</h3>
        <p className="text-sm text-slate-400 font-medium">สรุปจำนวนคาบที่ได้รับมอบหมายทั้งหมด</p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-slate-400 italic">ยังไม่มีข้อมูลการมอบหมายภาระงาน</div>
      ) : (
        sorted.map((s, i) => (
          <div key={s.name} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-lg ${
              i === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">{s.name}</span>
                <span className="text-emerald-600">{s.count} คาบ</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / max) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}

function TeacherList({ teachers, onRefresh }: { teachers: Teacher[], onRefresh: () => void }) {
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบข้อมูลครูท่านนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      onRefresh();
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {teachers.map(t => (
        <div key={t.teacher_id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingTeacher(t)} className="text-slate-300 hover:text-emerald-600 transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(t.teacher_id)} className="text-slate-300 hover:text-red-600 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <h4 className="font-bold text-slate-800 text-lg mb-4">{t.teacher_name}</h4>
          <div className="space-y-3">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => {
              let s: ScheduleItem[] = [];
              try { s = JSON.parse(t[day as keyof Teacher] || '[]'); } catch(e) {}
              if (s.length === 0) return null;
              return (
                <div key={day} className="flex gap-2 items-start">
                  <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-lg shrink-0 mt-0.5">
                    {['จ', 'อ', 'พ', 'พฤ', 'ศ'][idx]}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {s.map(x => (
                      <span key={x.p} className="bg-slate-50 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-100">
                        คาบ {x.p}: {x.s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {editingTeacher && (
        <EditTeacherModal 
          teacher={editingTeacher} 
          onClose={() => setEditingTeacher(null)} 
          onSuccess={() => {
            setEditingTeacher(null);
            onRefresh();
          }} 
        />
      )}
    </motion.div>
  );
}

function EditTeacherModal({ teacher, onClose, onSuccess }: { teacher: Teacher, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(teacher.teacher_name);
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem[]>>({
    monday: JSON.parse(teacher.monday || '[]'),
    tuesday: JSON.parse(teacher.tuesday || '[]'),
    wednesday: JSON.parse(teacher.wednesday || '[]'),
    thursday: JSON.parse(teacher.thursday || '[]'),
    friday: JSON.parse(teacher.friday || '[]'),
  });
  const [editing, setEditing] = useState<{ day: string, p: number } | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects);
  }, []);

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayLabels = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

  const handleSave = async () => {
    if (!name) return alert('กรุณาระบุชื่อ');
    const payload = {
      teacher_name: name,
      monday: JSON.stringify(schedule.monday || []),
      tuesday: JSON.stringify(schedule.tuesday || []),
      wednesday: JSON.stringify(schedule.wednesday || []),
      thursday: JSON.stringify(schedule.thursday || []),
      friday: JSON.stringify(schedule.friday || [])
    };
    await fetch(`/api/teachers/${teacher.teacher_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    Swal.fire({
      icon: 'success',
      title: 'แก้ไขข้อมูลสำเร็จ',
      showConfirmButton: false,
      timer: 1500
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-black text-slate-800 mb-6">แก้ไขข้อมูลคุณครู</h3>
        <div className="space-y-8">
          <div className="max-w-md mx-auto">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">ข้อมูลบุคลากร</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุลคุณครู"
              className="w-full border-2 border-slate-100 rounded-2xl p-5 focus:border-emerald-500 bg-slate-50 outline-none shadow-inner text-lg text-center"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-emerald-600 pl-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h4 className="font-black text-slate-800 uppercase tracking-tight">ตารางสอน</h4>
            </div>

            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="grid grid-cols-5 min-w-[800px] gap-3">
                {dayLabels.map(d => <div key={d} className="text-center font-black text-emerald-400 text-xs uppercase tracking-widest py-2">{d}</div>)}
                {Array.from({ length: 8 }).map((_, pIdx) => {
                  const p = pIdx + 1;
                  return dayKeys.map(day => {
                    const item = schedule[day]?.find(s => s.p === p);
                    return (
                      <div 
                        key={`${day}-${p}`}
                        onClick={() => setEditing({ day, p })}
                        className={`h-24 border-2 rounded-2xl p-3 flex flex-col justify-center items-center cursor-pointer transition-all ${
                          item ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-[9px] font-black text-slate-300 uppercase mb-1">คาบ {p}</span>
                        {item ? (
                          <>
                            <div className="text-[10px] font-bold text-emerald-600 text-center leading-tight">{item.s}</div>
                            <div className="text-[9px] text-slate-400 font-medium">{item.g}</div>
                          </>
                        ) : (
                          <Plus className="w-4 h-4 text-slate-200" />
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="px-12 py-4 rounded-[2rem] font-bold text-slate-400 hover:bg-slate-50 transition">ยกเลิก</button>
            <button onClick={handleSave} className="bg-emerald-600 text-white px-16 py-4 rounded-[2rem] font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition active:scale-95">บันทึกการแก้ไข</button>
          </div>
        </div>

        {editing && (
          <ScheduleModal 
            day={editing.day} 
            period={editing.p} 
            subjects={subjects}
            onClose={() => setEditing(null)}
            onSave={(data) => {
              const current = schedule[editing.day] || [];
              const filtered = current.filter(s => s.p !== editing.p);
              if (data) {
                setSchedule({ ...schedule, [editing.day]: [...filtered, data] });
              } else {
                setSchedule({ ...schedule, [editing.day]: filtered });
              }
              setEditing(null);
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

function AddTeacher({ subjects, onSuccess }: { subjects: string[], onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem[]>>({});
  const [editing, setEditing] = useState<{ day: string, p: number } | null>(null);

  const [days, setDays] = useState([
    { id: 'monday', label: 'จันทร์' },
    { id: 'tuesday', label: 'อังคาร' },
    { id: 'wednesday', label: 'พุธ' },
    { id: 'thursday', label: 'พฤหัสบดี' },
    { id: 'friday', label: 'ศุกร์' }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDays((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!name) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุชื่อคุณครู',
        confirmButtonColor: '#059669'
      });
    }
    const payload = {
      teacher_id: `ID-${Date.now()}`,
      teacher_name: name,
      monday: JSON.stringify(schedule.monday || []),
      tuesday: JSON.stringify(schedule.tuesday || []),
      wednesday: JSON.stringify(schedule.wednesday || []),
      thursday: JSON.stringify(schedule.thursday || []),
      friday: JSON.stringify(schedule.friday || [])
    };
    await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    Swal.fire({
      icon: 'success',
      title: 'บันทึกข้อมูลสำเร็จ',
      showConfirmButton: false,
      timer: 1500
    });
    onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="max-w-md mx-auto">
        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">ข้อมูลบุคลากร</label>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ชื่อ-นามสกุลคุณครู"
          className="w-full border-2 border-slate-100 rounded-2xl p-5 focus:border-emerald-500 bg-slate-50 outline-none shadow-inner text-lg text-center"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-l-4 border-emerald-600 pl-4">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h4 className="font-black text-slate-800 uppercase tracking-tight">กำหนดตารางสอน</h4>
        </div>

        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[800px]">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={days.map(d => d.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-3">
                  {days.map((day) => (
                    <SortableDay 
                      key={day.id} 
                      day={day} 
                      schedule={schedule[day.id] || []}
                      onEdit={(p) => setEditing({ day: day.id, p })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={handleSave}
          className="bg-emerald-600 text-white px-16 py-4 rounded-[2rem] font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition active:scale-95"
        >
          บันทึกข้อมูลครู
        </button>
      </div>

      {editing && (
        <ScheduleModal 
          day={editing.day} 
          period={editing.p} 
          subjects={subjects}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            const current = schedule[editing.day] || [];
            const filtered = current.filter(s => s.p !== editing.p);
            if (data) {
              setSchedule({ ...schedule, [editing.day]: [...filtered, data] });
            } else {
              setSchedule({ ...schedule, [editing.day]: filtered });
            }
            setEditing(null);
          }}
        />
      )}
    </motion.div>
  );
}

function SortableDay({ day, schedule, onEdit }: { key?: string, day: { id: string, label: string }, schedule: ScheduleItem[], onEdit: (p: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex-1 flex flex-col gap-3 ${isDragging ? 'opacity-50' : ''}`}>
      <div 
        {...attributes} 
        {...listeners}
        className="bg-emerald-50 rounded-2xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-emerald-100 transition-colors"
      >
        <span className="font-black text-emerald-600 text-xs uppercase tracking-widest">{day.label}</span>
        <GripVertical className="w-4 h-4 text-emerald-300" />
      </div>
      
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, pIdx) => {
          const p = pIdx + 1;
          const item = schedule.find(s => s.p === p);
          return (
            <div 
              key={p}
              onClick={() => onEdit(p)}
              className={`h-24 border-2 rounded-2xl p-3 flex flex-col justify-center items-center cursor-pointer transition-all ${
                item ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-emerald-300'
              }`}
            >
              <span className="text-[9px] font-black text-slate-300 uppercase mb-1">คาบ {p}</span>
              {item ? (
                <>
                  <div className="text-[10px] font-bold text-emerald-600 text-center leading-tight">{item.s}</div>
                  <div className="text-[9px] text-slate-400 font-medium">{item.g}</div>
                </>
              ) : (
                <Plus className="w-4 h-4 text-slate-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleModal({ day, period, subjects, onClose, onSave }: { day: string, period: number, subjects: string[], onClose: () => void, onSave: (data: ScheduleItem | null) => void }) {
  const [s, setS] = useState(subjects[0]);
  const [l, setL] = useState('ป.1');
  const [r, setR] = useState('1');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl"
      >
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>คาบที่ {period}</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วิชา</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
              value={s}
              onChange={e => setS(e.target.value)}
            >
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชั้น</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
                value={l}
                onChange={e => setL(e.target.value)}
              >
                {[1,2,3,4,5,6].map(v => <option key={v} value={`ป.${v}`}>ป.{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ห้อง</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500"
                value={r}
                onChange={e => setR(e.target.value)}
              >
                {[1,2,3,4,5,6,7,8].map(v => <option key={v} value={v}>ห้อง {v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave(null)} className="flex-1 p-4 rounded-2xl font-bold text-red-400 hover:bg-red-50 transition">ลบคาบ</button>
            <button onClick={() => onSave({ p: period, s, g: `${l}/${r}` })} className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition">บันทึก</button>
          </div>
          <button onClick={onClose} className="w-full p-2 text-slate-300 text-xs font-bold hover:text-slate-500 transition">ปิดหน้าต่าง</button>
        </div>
      </motion.div>
    </div>
  );
}
