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
import {
  subscribeToExpenses, createExpenseDoc,
  subscribeToIncome, createIncomeDoc,
  subscribeToClassFees, createClassFeeRowDoc,
  subscribeToFamilyFees, createFamilyFeeRowDoc,
  subscribeToFeePayments, createFeePaymentDoc,
  subscribeToSalaries, createSalaryDoc, setSalaryStatus,
  subscribeToDiscounts, createDiscountDoc,
  subscribeToDocuments, createDocumentDoc,
} from '../firebase/finance';
import {
  subscribeToAttendanceByDate, setStudentAttendanceRecord, subscribeToAllAttendanceRecords,
  subscribeToStaffAttendanceByDate, setStaffAttendanceRecord, subscribeToAllStaffAttendanceRecords,
} from '../firebase/attendance';
import { subscribeToStaffRoster, createStaffRosterDoc, updateStaffRosterDoc, deleteStaffRosterDoc } from '../firebase/staffRoster';
import { subscribeToExamMarks, setExamMarkRecord } from '../firebase/examMarks';
import { subscribeToQuranProgressByDate, setQuranProgressRecord } from '../firebase/quranProgress';
import { subscribeToQuranTargets, createQuranTargetDoc, updateQuranTargetDoc } from '../firebase/quranTargets';
import { subscribeToAllThreads, sendMessage as sendMessageDoc, markMessagesRead } from '../firebase/messages';
import { createAbsentNotification, createFeeNotification } from '../firebase/notifications';
import { todayISODate } from '../utils/somaliDate';

const SchoolDataContext = createContext(null);

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
    examResults: [{ subject: 'Taariikh', marks: 69, maxMarks: 100, grade: 'C' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-18', status: 'pending' }],
    behaviour: [],
    documents: [],
  },
];

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
  const [classFeeRows, setClassFeeRows] = useState([]);
  const [familyFeeRows, setFamilyFeeRows] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [financeDocuments, setFinanceDocuments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teacherAttendanceToday, setTeacherAttendanceToday] = useState({});
  const [staffAttendanceToday, setStaffAttendanceToday] = useState({});
  const [studentAttendanceToday, setStudentAttendanceToday] = useState({});
  const [allStudentAttendanceRecords, setAllStudentAttendanceRecords] = useState([]);
  const [allStaffAttendanceRecords, setAllStaffAttendanceRecords] = useState([]);

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

  // "forDate" ayaa la wadaagaa labadaba: calaamadinta "maanta" ee Attendance.jsx
  // (setStudentAttendanceStatus, date=maanta) iyo cyclinga taariikhda hore ee
  // StudentProfileModal (cycleStudentAttendanceRecord, date=maalin la doortay).
  const setStudentAttendanceForDate = async (studentId, className, date, status) => {
    if (!profile?.schoolCode) return;
    try {
      await setStudentAttendanceRecord(profile.schoolCode, date, studentId, className, status);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imaanshaha ardayga la kaydinayay:', err);
    }
    if (status === 'absent') {
      const student = students.find((s) => s.id === studentId);
      try {
        await createAbsentNotification({
          schoolCode: profile.schoolCode,
          studentId,
          studentName: student?.fullName || '',
          className,
          date,
        });
      } catch (err) {
        console.error('Khalad ayaa dhacay markii ogeysiiska maqnaanshaha la abuurayay:', err);
      }
    }
  };

  const setStudentAttendanceStatus = (studentId, className, status) =>
    setStudentAttendanceForDate(studentId, className, todayISODate(), status);

  // Cycle-ka 4-da xaalado ee ardayda isticmaalaan (fiiri Attendance.jsx
  // STATUS_DEFS.students) — loo isticmaalaa marka StudentProfileModal la
  // gujiyo maalin taariikhdeed ah si loo beddelo xaaladdeeda.
  const STUDENT_NEXT_STATUS = { present: 'absent', absent: 'leave', leave: 'sick', sick: 'present' };

  const cycleStudentAttendanceRecord = (studentId, className, date) => {
    const existing = allStudentAttendanceRecords.find((r) => r.studentId === studentId && r.date === date);
    const nextStatus = STUDENT_NEXT_STATUS[existing?.status || 'present'];
    return setStudentAttendanceForDate(studentId, className, date, nextStatus);
  };

  // ===== TAARIIKHDA IMAANSHAHA OO DHAN (Firestore collections "attendanceRecords"
  // + "staffAttendanceRecords") — loo isticmaalo warbixinnada toddobaadka/
  // bisha/sanadka ee bogga Attendance (kama socoto attendanceToday ee kore,
  // kaas oo maalinta hadda ah kaliya). =====
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setAllStudentAttendanceRecords([]);
      return undefined;
    }
    const unsubscribe = subscribeToAllAttendanceRecords(
      profile.schoolCode,
      setAllStudentAttendanceRecords,
      (err) => console.error('Khalad ayaa dhacay markii taariikhda imaanshaha ardayda laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setAllStaffAttendanceRecords([]);
      return undefined;
    }
    const unsubscribe = subscribeToAllStaffAttendanceRecords(
      profile.schoolCode,
      setAllStaffAttendanceRecords,
      (err) => console.error('Khalad ayaa dhacay markii taariikhda imaanshaha macallimiinta/shaqaalaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  // ===== SHAQAALAHA (Firestore collection "staffRoster") — liiska shaqaalaha
  // aan macallimiinta ahayn (Maamule, Xisaabiye, Ilaaliye, iwm), loo isticmaalo
  // bogga Attendance tabka "Staff". GOONI ah, kama socoto akoonada gelitaanka
  // (fiiri firebase/staff.js oo uu isticmaalo bogga "Users"). =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setStaff([]);
      return undefined;
    }
    const unsubscribe = subscribeToStaffRoster(
      profile.schoolCode,
      setStaff,
      (err) => console.error('Khalad ayaa dhacay markii shaqaalaha (roster) laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  const addStaffMember = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createStaffRosterDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii shaqaalaha la darayay:', err);
    }
  };

  const updateStaffMember = async (id, payload) => {
    try {
      await updateStaffRosterDoc(id, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii shaqaalaha wax laga beddelayay:', err);
    }
  };

  const removeStaffMember = async (id) => {
    try {
      await deleteStaffRosterDoc(id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii shaqaalaha la saarayay:', err);
    }
  };

  // ===== IMAANSHAHA MACALLIMIINTA/SHAQAALAHA MAANTA (Firestore collection
  // "staffAttendanceRecords") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setTeacherAttendanceToday({});
      return undefined;
    }
    const unsubscribe = subscribeToStaffAttendanceByDate(
      profile.schoolCode,
      'teachers',
      todayISODate(),
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.personId] = r.status; });
        setTeacherAttendanceToday(map);
      },
      (err) => console.error('Khalad ayaa dhacay markii imaanshaha macallimiinta maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  useEffect(() => {
    if (!profile?.schoolCode) {
      setStaffAttendanceToday({});
      return undefined;
    }
    const unsubscribe = subscribeToStaffAttendanceByDate(
      profile.schoolCode,
      'staff',
      todayISODate(),
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.personId] = r.status; });
        setStaffAttendanceToday(map);
      },
      (err) => console.error('Khalad ayaa dhacay markii imaanshaha shaqaalaha maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

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

  // ===== XISAABAADKA (Firestore collections "financeExpenses"/"financeIncome"/
  // "classFees"/"familyFees"/"feePayments") — staff-only, schoolCode-wide. =====
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setExpenses([]);
      return undefined;
    }
    const unsubscribe = subscribeToExpenses(
      profile.schoolCode,
      setExpenses,
      (err) => console.error('Khalad ayaa dhacay markii kharashaadka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setIncome([]);
      return undefined;
    }
    const unsubscribe = subscribeToIncome(
      profile.schoolCode,
      setIncome,
      (err) => console.error('Khalad ayaa dhacay markii dakhliga laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setClassFeeRows([]);
      return undefined;
    }
    const unsubscribe = subscribeToClassFees(
      profile.schoolCode,
      setClassFeeRows,
      (err) => console.error('Khalad ayaa dhacay markii safafka lacagta fasalka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setFamilyFeeRows([]);
      return undefined;
    }
    const unsubscribe = subscribeToFamilyFees(
      profile.schoolCode,
      setFamilyFeeRows,
      (err) => console.error('Khalad ayaa dhacay markii safafka lacagta qoyska laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setFeePayments([]);
      return undefined;
    }
    const unsubscribe = subscribeToFeePayments(
      profile.schoolCode,
      setFeePayments,
      (err) => console.error('Khalad ayaa dhacay markii bixinada lacagta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setSalaries([]);
      return undefined;
    }
    const unsubscribe = subscribeToSalaries(
      profile.schoolCode,
      setSalaries,
      (err) => console.error('Khalad ayaa dhacay markii mushaharka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setDiscounts([]);
      return undefined;
    }
    const unsubscribe = subscribeToDiscounts(
      profile.schoolCode,
      setDiscounts,
      (err) => console.error('Khalad ayaa dhacay markii dhimista/deeqaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setFinanceDocuments([]);
      return undefined;
    }
    const unsubscribe = subscribeToDocuments(
      profile.schoolCode,
      setFinanceDocuments,
      (err) => console.error('Khalad ayaa dhacay markii invoices/receipts laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  const addSalary = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createSalaryDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii mushaharka la darayay:', err);
    }
  };

  const markSalaryPaid = async (id) => {
    try {
      await setSalaryStatus(id, 'paid');
    } catch (err) {
      console.error('Khalad ayaa dhacay markii mushaharka la calaamadinayay in la bixiyay:', err);
    }
  };

  const addDiscount = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createDiscountDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii dhimista/deeqda la darayay:', err);
    }
  };

  const addFinanceDocument = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      const prefix = payload.type === 'invoice' ? 'INV' : 'RCT';
      const no = `${prefix}-${new Date().getFullYear()}-${String(financeDocuments.length + 1).padStart(3, '0')}`;
      await createDocumentDoc(profile.schoolCode, { ...payload, no });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii invoice/receipt la darayay:', err);
    }
  };

  // Balance-ka saf kasta waxaa laga soo xisaabiyaa (derive) isu geynta
  // feePayments-ka la xiriira row-gaas — ma aha counter la kaydiyo, si loo
  // xalliyo tartanka (race condition) iyo si loo hesho diiwaan (ledger)
  // dhab ah oo bixin kasta. Shape-ku waa isku mid oo la wadaago
  // Finance.jsx/Overview.jsx/ClassDetailModal.jsx iyagoo aan wax akhris ah
  // ka beddelin.
  const withDerivedBalance = (rows, feeType) =>
    rows.map((r) => {
      const paid = feePayments
        .filter((p) => p.feeType === feeType && p.rowId === r.id)
        .reduce((sum, p) => sum + p.amount, 0);
      return { ...r, balance: Math.max(0, (r.total || 0) - (r.discount || 0) - paid) };
    });

  const classFees = useMemo(() => withDerivedBalance(classFeeRows, 'class'), [classFeeRows, feePayments]);
  const familyFees = useMemo(() => withDerivedBalance(familyFeeRows, 'family'), [familyFeeRows, feePayments]);

  const addExpense = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createExpenseDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii kharashka la darayay:', err);
    }
  };

  const addIncome = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createIncomeDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii dakhliga la darayay:', err);
    }
  };

  const addClassFeeRow = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createClassFeeRowDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii safka lacagta fasalka la darayay:', err);
    }
  };

  const addFamilyFeeRow = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createFamilyFeeRowDoc(profile.schoolCode, payload);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii safka lacagta qoyska la darayay:', err);
    }
  };

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
      await createTeacherDoc(profile.schoolCode, {
        ...payload,
        teacherId: `TCH-${200 + teachers.length + 1}`,
        salary: [],
        timetable: [],
        documents: [],
      });
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

  // Cycle-ka taariikhda hore ee TeacherProfileModal — 3-da xaalado ee
  // "maanta" ee macallimiinta isticmaalaan (NEXT_STATUS, fiiri kore).
  const cycleTeacherAttendanceRecord = async (teacherId, date) => {
    if (!profile?.schoolCode) return;
    const existing = allStaffAttendanceRecords.find((r) => r.category === 'teachers' && r.personId === teacherId && r.date === date);
    const nextStatus = NEXT_STATUS[existing?.status || 'present'];
    try {
      await setStaffAttendanceRecord(profile.schoolCode, 'teachers', date, teacherId, nextStatus);
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

  // ===== LACAGTA (FEES) — waxay qortaa diiwaan (feePayments), MA AHA in ay
  // tirtirto/dhimato balance-ka si toos ah (fiiri withDerivedBalance kore). =====
  const collectFee = async (feeType, rowId, amount, method, date) => {
    if (!profile?.schoolCode || !amount) return;
    try {
      await createFeePaymentDoc({
        schoolCode: profile.schoolCode,
        feeType,
        rowId,
        amount,
        method: method || '',
        date: date || todayISODate(),
        collectedBy: profile.uid,
        collectedByName: profile.fullName || '',
      });
    } catch (err) {
      console.error('Khalad ayaa dhacay markii lacagta la ururinayay:', err);
    }
  };
  const collectClassFee = (rowId, amount, method, date) => collectFee('class', rowId, amount, method, date);
  const collectFamilyFee = (rowId, amount, method, date) => collectFee('family', rowId, amount, method, date);

  // ===== IMAANSHAHA MAANTA (Macallimiinta / Shaqaalaha) =====
  const cycleAttendanceStatus = async (category, id) => {
    if (!profile?.schoolCode) return;
    const currentMap = category === 'teachers' ? teacherAttendanceToday : staffAttendanceToday;
    const nextStatus = NEXT_STATUS[currentMap[id] || 'present'];
    try {
      await setStaffAttendanceRecord(profile.schoolCode, category, todayISODate(), id, nextStatus);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii imaanshaha maanta la cusbooneysiinayay:', err);
    }
  };

  const attendanceToday = {
    students: studentAttendanceToday,
    teachers: teacherAttendanceToday,
    staff: staffAttendanceToday,
  };

  const value = {
    students, studentsLoading, addStudent, updateStudent, deleteStudent, cycleStudentAttendanceRecord, seedDemoStudents,
    deletedStudents, restoreStudent, permanentlyDeleteStudent,
    setStudentAttendanceStatus,
    teachers, addTeacher, updateTeacher, cycleTeacherAttendanceRecord,
    classes, addClass, updateClass, removeClass,
    subjects, addSubject, updateSubject, removeSubject,
    exams, examMarks, addExam, updateExam, removeExam, updateExamMark,
    classFees, familyFees, collectClassFee, collectFamilyFee, addClassFeeRow, addFamilyFeeRow, feePayments,
    expenses, income, addExpense, addIncome,
    salaries, addSalary, markSalaryPaid,
    discounts, addDiscount,
    financeDocuments, addFinanceDocument,
    staff, addStaffMember, updateStaffMember, removeStaffMember,
    attendanceToday, cycleAttendanceStatus,
    allStudentAttendanceRecords, allStaffAttendanceRecords,
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
