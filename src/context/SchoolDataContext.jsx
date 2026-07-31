// context/SchoolDataContext.jsx
// Isha kaliya ee xogta dugsiga (arday, macallimiin, fasallo, maadooyin, imtixaano,
// lacago, iyo imaanshaha maalinlaha ah) — dhammaan bogagga waxay ka akhriyaan/ku
// qoraan halkan, si xogtu u ahaato mid isku mid ah meel kasta oo ay ka muuqato
// (tusaale: Overview-ka, Attendance-ka, iyo Students-ka oo dhan isku tiro isticmaala).

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToStudents, createStudentDoc, updateStudentDoc, softDeleteStudentDoc, restoreStudentDoc, deleteStudentDoc, backfillStudentLookups } from '../firebase/students';
import { subscribeToTeachers, createTeacherDoc, updateTeacherDoc } from '../firebase/teachers';
import { subscribeToClasses, createClassDoc, updateClassDoc, deleteClassDoc } from '../firebase/classes';
import { subscribeToSubjects, createSubjectDoc, updateSubjectDoc, deleteSubjectDoc } from '../firebase/subjects';
import { subscribeToExams, createExamDoc, updateExamDoc, deleteExamDoc } from '../firebase/exams';
import { subscribeToAttendanceByDate, setStudentAttendanceRecord } from '../firebase/attendance';
import { subscribeToExamMarks, setExamMarkRecord } from '../firebase/examMarks';
import { subscribeToQuranProgressByDate, setQuranProgressRecord } from '../firebase/quranProgress';
import { subscribeToQuranTargets, createQuranTargetDoc, updateQuranTargetDoc } from '../firebase/quranTargets';
import { subscribeToAllThreads, sendMessage as sendMessageDoc, markMessagesRead } from '../firebase/messages';
import { createAbsentNotification, createFeeNotification } from '../firebase/notifications';
import { todayISODate } from '../utils/somaliDate';

const SchoolDataContext = createContext(null);

const CALENDAR_DAYS = ['2026-07-01','2026-07-02','2026-07-03','2026-07-06','2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17','2026-07-20'];
const STUDENT_ATTENDANCE_PATTERN = ['present','present','present','absent','present','present','late','present','present','present','absent','present','present','present'];
const TEACHER_ATTENDANCE_PATTERN = ['present','present','present','present','present','absent','present','present','present','late','present','present','present','present'];

function buildAttendanceCalendar(pattern) {
  return CALENDAR_DAYS.map((date, i) => ({ date, status: pattern[i] }));
}

const NEXT_STATUS = { present: 'absent', absent: 'late', late: 'present' };

// Xogta tijaabada ah — waxaa loo isticmaalaa KELIYA "seedDemoStudents()" (hal mar,
// marka collection-ka Firestore uu madhan yahay). ID-yadan (1,2,3...) lama isticmaalo
// Firestore — waxaa lagu tuuraa (destructure) marka la seed-gareynayo, Firestore ayaa
// abuuri doona document ID gaar ah oo kiisa ah.
const DEMO_STUDENTS_SEED = [
  {
    id: 1,
    studentId: 'STU-1042',
    fullName: 'Ismaaciil Cabdi Xasan',
    gender: 'Wiil',
    dob: '2011-03-14',
    phone: '+252 61 111 2233',
    parentName: 'Cabdi Xasan Warsame',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 999 8877',
    address: 'Xaafadda Hodan, Muqdisho',
    className: 'Form 1A',
    section: 'A',
    rollNumber: 12,
    subjects: ['Xisaab', 'Ingiriisi', 'Cilmiga Bulshada', 'Sayniska', 'Qur’aan'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [
      { subject: 'Xisaab', marks: 82, maxMarks: 100, grade: 'A' },
      { subject: 'Ingiriisi', marks: 74, maxMarks: 100, grade: 'B' },
      { subject: 'Sayniska', marks: 65, maxMarks: 100, grade: 'C' },
    ],
    fees: [
      { term: 'Semester 1', amount: 120, date: '2026-01-10', status: 'paid' },
      { term: 'Semester 2', amount: 120, date: '2026-06-10', status: 'paid' },
    ],
    behaviour: [
      { note: 'Ka qayb qaatay tartanka akhriska - meesha 1aad', date: '2026-05-02', type: 'positive' },
    ],
    documents: [
      { name: 'Shahaadada Dhalashada', type: 'PDF', uploadDate: '2026-01-05' },
      { name: 'Sawirka Ardayga', type: 'JPG', uploadDate: '2026-01-05' },
    ],
  },
  {
    id: 2,
    studentId: 'STU-1043',
    fullName: 'Xaawo Maxamed Cali',
    gender: 'Gabar',
    dob: '2010-11-02',
    phone: '+252 61 222 3344',
    parentName: 'Maxamed Cali Nuur',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 888 7766',
    address: 'Xaafadda Wadajir, Muqdisho',
    className: 'Form 2A',
    section: 'A',
    rollNumber: 5,
    subjects: ['Xisaab', 'Ingiriisi', 'Taariikh', 'Sayniska'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [
      { subject: 'Xisaab', marks: 91, maxMarks: 100, grade: 'A' },
      { subject: 'Ingiriisi', marks: 88, maxMarks: 100, grade: 'A' },
    ],
    fees: [{ term: 'Semester 1', amount: 120, date: '2026-01-12', status: 'paid' }],
    behaviour: [],
    documents: [{ name: 'Shahaadada Dhalashada', type: 'PDF', uploadDate: '2026-01-06' }],
  },
  {
    id: 3,
    studentId: 'STU-1044',
    fullName: 'Cabdiraxman Yoonis',
    gender: 'Wiil',
    dob: '2011-07-19',
    phone: '',
    parentName: 'Yoonis Cabdi Aadan',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 555 4433',
    address: 'Xaafadda Boondheere, Muqdisho',
    className: 'Form 1A',
    section: 'A',
    rollNumber: 18,
    subjects: ['Xisaab', 'Ingiriisi', 'Cilmiga Bulshada'],
    status: 'active',
    fee: 'pending',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [{ subject: 'Xisaab', marks: 48, maxMarks: 100, grade: 'F' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-15', status: 'pending' }],
    behaviour: [
      { note: 'Fasalka ka daahay 3 jeer bishan', date: '2026-06-20', type: 'negative' },
    ],
    documents: [],
  },
  {
    id: 4,
    studentId: 'STU-1045',
    fullName: 'Sacdiyo Xasan Nuur',
    gender: 'Gabar',
    dob: '2009-09-30',
    phone: '',
    parentName: 'Xasan Nuur Cige',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 444 3322',
    address: 'Xaafadda Karaan, Muqdisho',
    className: 'Form 3A',
    section: 'A',
    rollNumber: 9,
    subjects: ['Xisaab', 'Ingiriisi', 'Sayniska', 'Taariikh'],
    status: 'inactive',
    fee: 'overdue',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [{ subject: 'Ingiriisi', marks: 55, maxMarks: 100, grade: 'C' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-01', status: 'overdue' }],
    behaviour: [],
    documents: [],
  },
  {
    id: 5,
    studentId: 'STU-1046',
    fullName: 'Maxamed Xuseen Cige',
    gender: 'Wiil',
    dob: '2008-05-11',
    phone: '+252 61 333 2211',
    parentName: 'Xuseen Cige Faarax',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 222 1100',
    address: 'Xaafadda Dharkenley, Muqdisho',
    className: 'Form 4A',
    section: 'A',
    rollNumber: 2,
    subjects: ['Xisaab', 'Ingiriisi', 'Fiisigis', 'Kiimikada'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [
      { subject: 'Fiisigis', marks: 77, maxMarks: 100, grade: 'B' },
      { subject: 'Kiimikada', marks: 85, maxMarks: 100, grade: 'A' },
    ],
    fees: [{ term: 'Semester 2', amount: 150, date: '2026-06-08', status: 'paid' }],
    behaviour: [],
    documents: [{ name: 'Ratiga Fasalka Hore', type: 'PDF', uploadDate: '2026-02-01' }],
  },
  {
    id: 6,
    studentId: 'STU-1047',
    fullName: 'Amiina Cabdulle',
    gender: 'Gabar',
    dob: '2010-01-22',
    phone: '',
    parentName: 'Cabdulle Warsame',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 111 0099',
    address: 'Xaafadda Yaaqshiid, Muqdisho',
    className: 'Form 2A',
    section: 'A',
    rollNumber: 21,
    subjects: ['Xisaab', 'Ingiriisi', 'Taariikh'],
    status: 'active',
    fee: 'pending',
    attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
    examResults: [{ subject: 'Taariikh', marks: 69, maxMarks: 100, grade: 'C' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-18', status: 'pending' }],
    behaviour: [],
    documents: [],
  },
];

const SEED_CLASS_FEES = [
  { id: 1, name: 'Fasalka Sare ee Xasan', shift: 'Sabaxi', students: 46, total: 229, discount: 0, balance: 20 },
  { id: 2, name: 'Fasalka Sare ee Xasan', shift: "Masaa'i", students: 27, total: 155, discount: 5, balance: 0 },
  { id: 3, name: 'Fasal 2 - Amiina', shift: 'Sabaxi', students: 31, total: 110, discount: 0, balance: 15 },
  { id: 4, name: 'Fasal 3 - Xaawo', shift: 'Sabaxi', students: 23, total: 150, discount: 0, balance: 0 },
  { id: 5, name: 'Fasal 3 - Xaawo', shift: "Masaa'i", students: 34, total: 240, discount: 10, balance: 25 },
  { id: 6, name: 'Fasal 4 - Cumar', shift: 'Sabaxi', students: 31, total: 153, discount: 0, balance: 0 },
  { id: 7, name: 'Fasal 4 - Cumar', shift: "Masaa'i", students: 28, total: 132, discount: 3, balance: 18 },
];

const SEED_FAMILY_FEES = [
  { id: 101, name: 'Qoyska Xasan Warsame', students: 3, total: 360, discount: 20, balance: 0 },
  { id: 102, name: 'Qoyska Cabdi Nuur', students: 2, total: 240, discount: 0, balance: 45 },
  { id: 103, name: 'Qoyska Maxamed Cige', students: 2, total: 220, discount: 15, balance: 0 },
  { id: 104, name: 'Qoyska Yoonis Cali', students: 1, total: 120, discount: 0, balance: 30 },
];

const SEED_STAFF = [
  { id: 1, name: 'Xasan Cabdulle Nuur', sub: 'Maamule Guud' },
  { id: 2, name: 'Zaynab Cali Warsame', sub: 'Xisaabiye (Accountant)' },
  { id: 3, name: 'Cumar Faarax Cige', sub: 'Ilaaliye (Security)' },
  { id: 4, name: 'Halima Xuseen Nuur', sub: 'Kaaliye Maamul' },
];

// Xaaladda imaanshaha "MAANTA" ee macallimiinta/shaqaalaha — weli waa xog mock ah
// (lama beddelin Firestore, maadaama codsigan kaliya ku saabsanaa ardayda). Ardayda
// imaanshahoodu wuxuu ka imanayaa Firestore (collection "attendanceRecords") oo
// hoos ku qoran.
const SEED_ATTENDANCE_TODAY = {
  teachers: { 1: 'present', 2: 'present', 3: 'late', 4: 'absent', 5: 'present' },
  staff: { 1: 'present', 2: 'present', 3: 'present', 4: 'late' },
};

export function SchoolDataProvider({ children }) {
  const { profile } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  // "students" waa kaliya kuwa aan la tirtirin (isDeleted !== true) — bogagga
  // caadiga ah (Students.jsx, iwm) waxay isticmaalaan tan. "deletedStudents"
  // waxaa isticmaala kaliya bogga "Xogta La Tirtiray" (Trash).
  const students = useMemo(() => allStudents.filter((s) => !s.isDeleted), [allStudents]);
  const deletedStudents = useMemo(() => allStudents.filter((s) => s.isDeleted), [allStudents]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [examMarks, setExamMarks] = useState({});
  const [classFees, setClassFees] = useState(SEED_CLASS_FEES);
  const [familyFees, setFamilyFees] = useState(SEED_FAMILY_FEES);
  const [staff, setStaff] = useState(SEED_STAFF);
  const [otherAttendanceToday, setOtherAttendanceToday] = useState(SEED_ATTENDANCE_TODAY);
  const [studentAttendanceToday, setStudentAttendanceToday] = useState({});

  // ===== IMAANSHAHA ARDAYDA MAANTA (Firestore collection "attendanceRecords") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setStudentAttendanceToday({});
      return undefined;
    }
    const unsubscribe = subscribeToAttendanceByDate(
      profile.schoolCode,
      todayISODate(),
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.studentId] = r.status; });
        setStudentAttendanceToday(map);
      },
      (err) => console.error('Khalad ayaa dhacay markii imaanshaha maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  const setStudentAttendanceStatus = async (studentId, className, status) => {
    if (!profile?.schoolCode) return;
    try {
      await setStudentAttendanceRecord(profile.schoolCode, todayISODate(), studentId, className, status);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imaanshaha maanta la kaydinayay:', err);
    }
    if (status === 'absent') {
      const student = students.find((s) => s.id === studentId);
      try {
        await createAbsentNotification({
          schoolCode: profile.schoolCode,
          studentId,
          studentName: student?.fullName || '',
          className,
          date: todayISODate(),
        });
      } catch (err) {
        console.error('Khalad ayaa dhacay markii ogeysiiska maqnaanshaha la abuurayay:', err);
      }
    }
  };

  // ===== HORUMARKA QURAANKA MAANTA (Firestore collection "quranProgress") =====
  // Staff-only (schoolCode-wide) — waalidku wuxuu isticmaalaa
  // subscribeToStudentQuranProgressHistory (fiiri ParentPortal.jsx) oo gaar
  // u ah ilmihiisa, si Firestore Rules-ku ugu ogolaadaan query-gan.
  const [quranProgressToday, setQuranProgressToday] = useState({});

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setQuranProgressToday({});
      return undefined;
    }
    const unsubscribe = subscribeToQuranProgressByDate(
      profile.schoolCode,
      todayISODate(),
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.studentId] = { result: r.result, surah: r.surah }; });
        setQuranProgressToday(map);
      },
      (err) => console.error('Khalad ayaa dhacay markii horumarka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  const setQuranProgress = async (studentId, className, result, surah) => {
    if (!profile?.schoolCode) return;
    try {
      await setQuranProgressRecord(profile.schoolCode, todayISODate(), studentId, className, result, surah);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii horumarka Quraanka la kaydinayay:', err);
    }
  };

  // ===== YOOLKA QURAANKA (Firestore collection "quranTargets") — GOONI AH,
  // kama socoto "quranProgress" ee kore, maadaama tani tahay yool muddo-dheer ah.
  // Staff-only (schoolCode-wide) — waalidku wuxuu isticmaalaa
  // subscribeToQuranTargetsForStudent (fiiri ParentPortal.jsx) oo gaar u ah
  // ilmihiisa, si Firestore Rules-ku ugu ogolaadaan query-gan. =====
  const [quranTargets, setQuranTargetsState] = useState([]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setQuranTargetsState([]);
      return undefined;
    }
    const unsubscribe = subscribeToQuranTargets(
      profile.schoolCode,
      setQuranTargetsState,
      (err) => console.error('Khalad ayaa dhacay markii yoolalka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  // Upsert: haddii arday leeyahay yool "pending" ah oo horeba u jira, waa la
  // cusbooneysiinayaa meeshiisa; haddii kalese (mid horey uma jirin, ama tii
  // hore waa la go'aamiyay/reached/missed) waxaa la abuurayaa yool cusub —
  // taasi waxay siisaa macallinka fursad uu isla badhanka "Deji Yoolka" ugu
  // dhufto mar labaad si uu u sameeyo yool cusub isla ardaygaas.
  const saveQuranTarget = async (studentId, studentName, className, data) => {
    if (!profile?.schoolCode) return;
    try {
      const existing = quranTargets.find((qt) => qt.studentId === studentId && qt.status === 'pending');
      if (existing) {
        await updateQuranTargetDoc(existing.id, data);
      } else {
        await createQuranTargetDoc(profile.schoolCode, {
          studentId, studentName, className,
          status: 'pending',
          decidedAt: null,
          createdAt: new Date().toISOString(),
          ...data,
        });
      }
    } catch (err) {
      console.error('Khalad ayaa dhacay markii yoolka Quraanka la kaydinayay:', err);
    }
  };

  // Marka macallinku ka jawaabo prompt-ka ("Sax"/"Khalad"), yoolkii hore (kii
  // la jawaabay) waa la go'aamiyaa oo waa u badalmaa taariikh/history — WELI
  // lama tirtiro, si mustaqbalka loo isticmaali karo warbixinno (reports).
  // Yoolka cusub ee isla ardayga waa mid macallinku si toos ah u sameeyo
  // isaga oo mar labaad ku dhufta badhanka "Deji Yoolka" (fiiri saveQuranTarget).
  const recordQuranTargetOutcome = async (targetId, reached) => {
    try {
      await updateQuranTargetDoc(targetId, {
        status: reached ? 'reached' : 'missed',
        decidedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii natiijada yoolka Quraanka la kaydinayay:', err);
    }
  };

  // ===== FARIIMAHA (Waalid <-> Shaqaale) — Firestore collection "messages" =====
  // Waxaa la soo qaadaa DHAMMAAN fariimaha dugsiga KELIYA marka isticmaaluhu yahay
  // Shaqaale (accountType === 'staff') — waalid/arday ma helo listener-kan, si aan
  // loo baahin xogta qoysaska kale (fiiri ParentPortal.jsx oo isticmaala
  // subscribeToThread hal-arday ah gaar ah).
  const [staffMessages, setStaffMessages] = useState([]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setStaffMessages([]);
      return undefined;
    }
    const unsubscribe = subscribeToAllThreads(
      profile.schoolCode,
      setStaffMessages,
      (err) => console.error('Khalad ayaa dhacay markii fariimaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  const sendStaffMessage = async (studentId, studentName, className, parentId, text) => {
    if (!profile?.schoolCode || !text?.trim()) return;
    try {
      await sendMessageDoc({
        schoolCode: profile.schoolCode,
        studentId, studentName, className, parentId,
        senderRole: 'staff',
        senderId: profile.uid,
        senderName: profile.fullName,
        text: text.trim(),
      });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii fariinta la dirayay:', err);
    }
  };

  const markThreadReadByStaff = async (studentId) => {
    const unreadIds = staffMessages
      .filter((m) => m.studentId === studentId && m.senderRole === 'parent' && !m.readByStaff)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    try {
      await markMessagesRead(unreadIds, 'staff');
    } catch (err) {
      console.error('Khalad ayaa dhacay markii fariimaha la calaamadinayay in la akhriyay:', err);
    }
  };

  // ===== MACALLIMIINTA (Firestore collection "teachers") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setTeachers([]);
      return undefined;
    }
    const unsubscribe = subscribeToTeachers(
      profile.schoolCode,
      setTeachers,
      (err) => console.error('Khalad ayaa dhacay markii macallimiinta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== FASALLADA (Firestore collection "classes") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setClasses([]);
      return undefined;
    }
    const unsubscribe = subscribeToClasses(
      profile.schoolCode,
      setClasses,
      (err) => console.error('Khalad ayaa dhacay markii fasallada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== MAADOOYINKA (Firestore collection "subjects") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setSubjects([]);
      return undefined;
    }
    const unsubscribe = subscribeToSubjects(
      profile.schoolCode,
      setSubjects,
      (err) => console.error('Khalad ayaa dhacay markii maadooyinka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== IMTIXAANADA - QEEXIDDA (Firestore collection "exams") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setExams([]);
      return undefined;
    }
    const unsubscribe = subscribeToExams(
      profile.schoolCode,
      setExams,
      (err) => console.error('Khalad ayaa dhacay markii imtixaanada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== BUUNDOOYINKA IMTIXAANADA (Firestore collection "examMarks") =====
  // Staff-only (schoolCode-wide) — waalidku wuxuu isticmaalaa
  // subscribeToStudentExamMarks (fiiri ParentPortal.jsx) oo gaar u ah
  // ilmihiisa, si Firestore Rules-ku ugu ogolaadaan query-gan.
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setExamMarks({});
      return undefined;
    }
    const unsubscribe = subscribeToExamMarks(
      profile.schoolCode,
      (records) => {
        const map = {};
        records.forEach((r) => {
          if (!map[r.examId]) map[r.examId] = {};
          map[r.examId][r.studentId] = r.mark;
        });
        setExamMarks(map);
      },
      (err) => console.error('Khalad ayaa dhacay markii buundooyinka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  // ===== ARDAYDA (Firestore collection "students") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setAllStudents([]);
      setStudentsLoading(false);
      return undefined;
    }
    setStudentsLoading(true);
    const unsubscribe = subscribeToStudents(
      profile.schoolCode,
      (list) => {
        setAllStudents(list);
        setStudentsLoading(false);
      },
      (err) => {
        console.error('Khalad ayaa dhacay markii ardayda laga soo akhriyay Firestore:', err);
        setStudentsLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // Hal mar per school — u abuurta 'studentLookup' doc-yada ardayda hore loo
  // abuuray ka hor intaan collection-kaas la darin (fiiri students.js).
  const backfilledSchoolRef = useRef(null);
  useEffect(() => {
    if (!profile?.schoolCode || profile.accountType !== 'staff') return;
    if (backfilledSchoolRef.current === profile.schoolCode) return;
    backfilledSchoolRef.current = profile.schoolCode;
    backfillStudentLookups(profile.schoolCode).catch((err) =>
      console.error('Khalad ayaa dhacay markii lookup-ka ardayda la buuxinayay:', err)
    );
  }, [profile?.schoolCode, profile?.accountType]);

  const notifyIfFeeOverdue = async (studentId, payload) => {
    if (payload.fee !== 'overdue' || !profile?.schoolCode) return;
    try {
      await createFeeNotification({
        schoolCode: profile.schoolCode,
        studentId,
        studentName: payload.fullName || '',
        className: payload.className || '',
      });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ogeysiiska lacagta la abuurayay:', err);
    }
  };

  const addStudent = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      const newId = await createStudentDoc(profile.schoolCode, {
        ...payload,
        studentId: `STU-${1040 + allStudents.length + 1}`,
        attendance: buildAttendanceCalendar(STUDENT_ATTENDANCE_PATTERN),
        examResults: [],
        fees: [],
        behaviour: [],
        documents: [],
      });
      await notifyIfFeeOverdue(newId, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ardayga la darayay:', err);
    }
  };

  const updateStudent = async (id, payload) => {
    try {
      await updateStudentDoc(id, payload);
      await notifyIfFeeOverdue(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ardayga wax laga beddelayay:', err);
    }
  };

  // Tirtir dabacsan — ardayga wuxuu u dhaqmaa "Xogta La Tirtiray" 45 maalmood,
  // waana laga soo celin karaa (fiiri restoreStudent/permanentlyDeleteStudent).
  const deleteStudent = async (id) => {
    try {
      await softDeleteStudentDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ardayga la tirtirayay:', err);
    }
  };

  const restoreStudent = async (id) => {
    try {
      await restoreStudentDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ardayga laga soo celinayay xogta la tirtiray:', err);
    }
  };

  const permanentlyDeleteStudent = async (id) => {
    try {
      await deleteStudentDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii ardayga si joogto ah loo tirtirayay:', err);
    }
  };

  // Tirtirka otomaatiga ah 45 maalmood ka dib — Spark plan-ka ma leh Cloud
  // Functions, marka waxaa lagu hubiyaa gudaha app-ka mar kasta oo Shaqaale
  // furo (halkan) — kama baahna cron/server, waana idempotent (marka la
  // tirtiro way ka baxaan deletedStudents, mana dib-dib u isku dayaan).
  useEffect(() => {
    if (profile?.accountType !== 'staff' || deletedStudents.length === 0) return;
    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
    deletedStudents
      .filter((s) => s.deletedAt && new Date(s.deletedAt).getTime() <= cutoff)
      .forEach((s) => {
        deleteStudentDoc(s.id).catch((err) =>
          console.error('Khalad ayaa dhacay markii xog dhammaatay 45-ta maalmood si otomaatig ah loo tirtirayay:', err)
        );
      });
  }, [deletedStudents, profile?.accountType]);

  const toggleStudentAttendanceDay = async (studentId, date) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const nextAttendance = student.attendance.map((a) =>
      a.date === date ? { ...a, status: NEXT_STATUS[a.status] } : a
    );
    try {
      await updateStudentDoc(studentId, { attendance: nextAttendance });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imaanshaha ardayga la cusbooneysiinayay:', err);
    }
  };

  // Hal-mar-kaliya: waxay ku qorayaan 6-da arday ee tijaabada ahaa Firestore, si loo
  // helo xog tusaale ah. Waxay iska daayaan haddii collection-ku horeba xog leeyahay.
  const seedDemoStudents = async () => {
    if (!profile?.schoolCode || allStudents.length > 0) return;
    try {
      for (const demoStudent of DEMO_STUDENTS_SEED) {
        const { id, ...data } = demoStudent;
        // eslint-disable-next-line no-await-in-loop
        await createStudentDoc(profile.schoolCode, data);
      }
    } catch (err) {
      console.error('Khalad ayaa dhacay markii xogta tijaabada la seed-gareynayay:', err);
    }
  };

  // ===== MACALLIMIINTA =====
  const addTeacher = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      const newId = await createTeacherDoc(profile.schoolCode, {
        ...payload,
        teacherId: `TCH-${200 + teachers.length + 1}`,
        salary: [],
        timetable: [],
        documents: [],
        attendance: buildAttendanceCalendar(TEACHER_ATTENDANCE_PATTERN),
      });
      setOtherAttendanceToday((prev) => ({ ...prev, teachers: { ...prev.teachers, [newId]: 'present' } }));
    } catch (err) {
      console.error('Khalad ayaa dhacay markii macallinka la darayay:', err);
    }
  };

  const updateTeacher = async (id, payload) => {
    try {
      await updateTeacherDoc(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii macallinka wax laga beddelayay:', err);
    }
  };

  const toggleTeacherAttendanceDay = async (teacherId, date) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    const nextAttendance = teacher.attendance.map((a) =>
      a.date === date ? { ...a, status: NEXT_STATUS[a.status] } : a
    );
    try {
      await updateTeacherDoc(teacherId, { attendance: nextAttendance });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imaanshaha macallinka la cusbooneysiinayay:', err);
    }
  };

  // ===== FASALLADA =====
  const addClass = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createClassDoc(profile.schoolCode, { ...payload, students: 0 });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii fasalka la darayay:', err);
    }
  };
  const updateClass = async (id, payload) => {
    try {
      await updateClassDoc(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii fasalka wax laga beddelayay:', err);
    }
  };
  const removeClass = async (id) => {
    try {
      await deleteClassDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii fasalka la tirtirayay:', err);
    }
  };

  // ===== MAADOOYINKA =====
  const addSubject = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createSubjectDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii maadada la darayay:', err);
    }
  };
  const updateSubject = async (id, payload) => {
    try {
      await updateSubjectDoc(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii maadada wax laga beddelayay:', err);
    }
  };
  const removeSubject = async (id) => {
    try {
      await deleteSubjectDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii maadada la tirtirayay:', err);
    }
  };

  // ===== IMTIXAANADA =====
  const addExam = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createExamDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imtixaanka la darayay:', err);
    }
  };
  const updateExam = async (id, payload) => {
    try {
      await updateExamDoc(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imtixaanka wax laga beddelayay:', err);
    }
  };
  const removeExam = async (id) => {
    try {
      await deleteExamDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imtixaanka la tirtirayay:', err);
    }
  };
  const updateExamMark = async (examId, studentId, value) => {
    if (!profile?.schoolCode) return;
    try {
      await setExamMarkRecord(profile.schoolCode, examId, studentId, value === '' ? '' : Number(value));
    } catch (err) {
      console.error('Khalad ayaa dhacay markii buundada la kaydinayay:', err);
    }
  };

  // ===== LACAGTA (FEES) =====
  const collectClassFee = (rowId, amount) => {
    setClassFees((prev) => prev.map((r) => (r.id === rowId ? { ...r, balance: Math.max(0, r.balance - amount) } : r)));
  };
  const collectFamilyFee = (rowId, amount) => {
    setFamilyFees((prev) => prev.map((r) => (r.id === rowId ? { ...r, balance: Math.max(0, r.balance - amount) } : r)));
  };

  // ===== IMAANSHAHA MAANTA (Macallimiinta / Shaqaalaha — weli mock) =====
  const cycleAttendanceStatus = (category, id) => {
    setOtherAttendanceToday((prev) => ({
      ...prev,
      [category]: { ...prev[category], [id]: NEXT_STATUS[prev[category][id] || 'present'] },
    }));
  };

  const attendanceToday = { students: studentAttendanceToday, ...otherAttendanceToday };

  const value = {
    students, studentsLoading, addStudent, updateStudent, deleteStudent, toggleStudentAttendanceDay, seedDemoStudents,
    deletedStudents, restoreStudent, permanentlyDeleteStudent,
    setStudentAttendanceStatus,
    teachers, addTeacher, updateTeacher, toggleTeacherAttendanceDay,
    classes, addClass, updateClass, removeClass,
    subjects, addSubject, updateSubject, removeSubject,
    exams, examMarks, addExam, updateExam, removeExam, updateExamMark,
    classFees, familyFees, collectClassFee, collectFamilyFee,
    staff,
    attendanceToday, cycleAttendanceStatus,
    quranProgressToday, setQuranProgress,
    quranTargets, saveQuranTarget, recordQuranTargetOutcome,
    staffMessages, sendStaffMessage, markThreadReadByStaff,
  };

  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() {
  const context = useContext(SchoolDataContext);
  if (!context) {
    throw new Error('useSchoolData waa in loo isticmaalaa gudaha <SchoolDataProvider>');
  }
  return context;
}
