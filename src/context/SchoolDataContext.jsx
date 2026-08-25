// context/SchoolDataContext.jsx
// Isha kaliya ee xogta dugsiga (arday, macallimiin, fasallo, maadooyin, imtixaano,
// lacago, iyo imaanshaha maalinlaha ah) — dhammaan bogagga waxay ka akhriyaan/ku
// qoraan halkan, si xogtu u ahaato mid isku mid ah meel kasta oo ay ka muuqato
// (tusaale: Overview-ka, Attendance-ka, iyo Students-ka oo dhan isku tiro isticmaala).

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSettings } from './SettingsContext';
import { subscribeToStudents, createStudentDoc, updateStudentDoc, softDeleteStudentDoc, restoreStudentDoc, deleteStudentDoc, archiveStudentDoc, restoreArchivedStudentDoc, backfillStudentLookups, backfillStudentClassScoping } from '../firebase/students';
import { subscribeToTeachers, createTeacherDoc, updateTeacherDoc, deactivateTeacherDoc } from '../firebase/teachers';
import { subscribeToClasses, createClassDoc, updateClassDoc, deleteClassDoc, unlinkTeacherFromClasses, unlinkSubjectFromClasses } from '../firebase/classes';
import { subscribeToSubjects, createSubjectDoc, updateSubjectDoc, deleteSubjectDoc, unlinkTeacherFromSubjects } from '../firebase/subjects';
import { subscribeToExams, createExamDoc, updateExamDoc, deleteExamDoc } from '../firebase/exams';
import {
  subscribeToExpenses, createExpenseDoc,
  subscribeToIncome, createIncomeDoc,
  subscribeToClassFees, createClassFeeRowDoc,
  subscribeToFeePayments, createFeePaymentDoc,
  subscribeToSalaries, createSalaryDoc,
  subscribeToDiscounts, createDiscountDoc,
  subscribeToDocuments, createDocumentDoc,
} from '../firebase/finance';
import { subscribeToStaff } from '../firebase/staff';
import { buildPayrollList } from '../utils/staffSalary';
import {
  subscribeToAttendanceByDate, setStudentAttendanceRecord, subscribeToAllAttendanceRecords,
  subscribeToStaffAttendanceByDate, setStaffAttendanceRecord, subscribeToAllStaffAttendanceRecords,
  backfillAttendanceClassScoping,
} from '../firebase/attendance';
import { subscribeToStaffRoster, createStaffRosterDoc, updateStaffRosterDoc, deleteStaffRosterDoc } from '../firebase/staffRoster';
import { subscribeToExamMarks, setExamMarkRecord, backfillExamMarksClassScoping } from '../firebase/examMarks';
import { subscribeToQuranProgressByDate, setQuranProgressRecord, deleteQuranProgressRecord, subscribeToAllQuranProgressRecords, backfillQuranProgressClassScoping } from '../firebase/quranProgress';
import { subscribeToQuranTargets, createQuranTargetDoc, updateQuranTargetDoc, backfillQuranTargetsClassScoping } from '../firebase/quranTargets';
import { subscribeToAllThreads, sendMessage as sendMessageDoc, markMessagesRead } from '../firebase/messages';
import { createAbsentNotification, backfillNotificationClassScoping } from '../firebase/notifications';
import { todayISODate } from '../utils/somaliDate';
import { studentFeeOwed } from '../utils/studentFee';

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
    feeType: 'fixed',
    feeAmount: 120,
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
    feeType: 'fixed',
    feeAmount: 120,
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
    feeType: 'fixed',
    feeAmount: 120,
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
    feeType: 'fixed',
    feeAmount: 120,
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
    feeType: 'fixed',
    feeAmount: 150,
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
    feeType: 'fixed',
    feeAmount: 120,
  },
];

export function SchoolDataProvider({ children }) {
  const { profile } = useAuth();
  const { showError } = useToast();
  const { settings } = useSettings();

  // Waxaa loo isticmaalaa dhammaan isku dayada Firestore ee ka socda user
  // action (add/update/delete/collect/mark) — waxay isticmaalaan qoraalka
  // isla mid ah console.error-ka (fiiri Round 1: SchoolDataContext.jsx
  // mutation functions), si isticmaaluhu u ogaado marka isku dayga uu ku
  // guuldareysto, ma aha kaliya console-ka.
  const reportError = (message, err) => {
    console.error(message, err);
    showError(message);
  };

  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  // "students" waa kaliya kuwa aan la tirtirin (isDeleted !== true) OO AAN
  // qalin-jabin (enrollmentStatus graduated/withdrawn) ahayn — bogagga caadiga ah
  // (ClassWorkspace, Attendance, Finance, Overview stats, iwm) dhammaantood
  // waxay isticmaalaan tan hal meel, sidaas darteed arday qalin-jabiyay wuu
  // ka baxaa si otomaatig ah dhammaan meelaha firfircoon — koodh gaar ah
  // looma baahna meelahaas (Qalin-jabinta audit, 2026-08-17). "deletedStudents"
  // waxaa isticmaala kaliya bogga "Xogta La Tirtiray" (Trash, 45-day),
  // "archivedStudents" waxaa isticmaala bogga "Ardayda Qalin-jabiyay"
  // (kaydka joogtada ah, wax xad-waqti ah ma leh) — labadan nidaam waa
  // kuwo GOONI ah oo isku mid ah (field kala duwan), si aan is-dhex u gelin.
  const students = useMemo(
    () => allStudents.filter((s) => !s.isDeleted && s.enrollmentStatus !== 'graduated' && s.enrollmentStatus !== 'withdrawn'),
    [allStudents]
  );
  const deletedStudents = useMemo(() => allStudents.filter((s) => s.isDeleted), [allStudents]);
  const archivedStudents = useMemo(
    () => allStudents.filter((s) => !s.isDeleted && (s.enrollmentStatus === 'graduated' || s.enrollmentStatus === 'withdrawn')),
    [allStudents]
  );
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [examMarks, setExamMarks] = useState({});
  const [classFeeRows, setClassFeeRows] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [financeDocuments, setFinanceDocuments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teacherAttendanceToday, setTeacherAttendanceToday] = useState({});
  const [staffAttendanceToday, setStaffAttendanceToday] = useState({});
  const [studentAttendanceToday, setStudentAttendanceToday] = useState({});
  const [allStudentAttendanceRecords, setAllStudentAttendanceRecords] = useState([]);
  const [allStaffAttendanceRecords, setAllStaffAttendanceRecords] = useState([]);

  // "Maanta" (todayISODate()) — waxaa lagu xisaabiyaa hal mar marka
  // subscription-yada "maanta" (hoos) la furo, marka haddii boggu furan
  // yahay isaga oo aan la refresh-garayn saqda dhexe (midnight) ka dhaafta,
  // subscription-yadaasi si joogto ah waxay sii wadi lahaayeen inay
  // xaadhaan taariikhda BERI (Attendance audit, 2026-08-03). todayDate waa
  // la hubiyaa mar kasta oo daqiiqad ah (setInterval); marka ay isbedesho,
  // effect-yada hoose way dib-u-fureyaan (classTeacherId/date dependency).
  const [todayDate, setTodayDate] = useState(todayISODate());
  useEffect(() => {
    const interval = setInterval(() => {
      const current = todayISODate();
      setTodayDate((prev) => (prev !== current ? current : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ===== IMAANSHAHA ARDAYDA MAANTA (Firestore collection "attendanceRecords") =====
  // "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): macallinku
  // query-giisu waa in uu si toos ah u xaddidan yahay fasalladiisa (firestore.
  // rules-ku hadda ku tiirsan yahay field-kan), haddii kale (owner) query-gu
  // waa schoolCode-wide sida hore. Macallin aan ku xirneyn diiwaanka Teachers
  // (teacherDocId maqan) — lama sameeyo query, waa madhan (fiiri Classes.jsx
  // "notLinked" oo isla mabda'a).
  useEffect(() => {
    if (!profile?.schoolCode) {
      setStudentAttendanceToday({});
      return undefined;
    }
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setStudentAttendanceToday({});
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToAttendanceByDate(
      profile.schoolCode,
      todayDate,
      classTeacherId,
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.studentId] = r.status; });
        setStudentAttendanceToday(map);
      },
      (err) => reportError('Khalad ayaa dhacay markii imaanshaha maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.role, profile?.teacherDocId, todayDate]);

  // Xaaladda xaadiriska ardayga (Joog/Maqan/Fasax) waa in ay ka dhacdo
  // KALIYA gudaha ClassWorkspace.jsx tab-ka Xaadiris, maalinta HADDA ah oo
  // qura (Attendance-scoping audit, 2026-08-03) — Attendance.jsx tab-ka
  // "Ardayda" iyo StudentProfileModal (taariikhda hore) hadda waa akhris-
  // kaliya, ma wicaan function-kan.
  const setStudentAttendanceStatus = async (studentId, className, status) => {
    if (!profile?.schoolCode) return;
    const date = todayISODate();
    // classTeacherId denormalized (Teacher Firestore Hardening, 2026-08-02) —
    // kaydsan record-ka lafteeda si firestore.rules-ku ugu xaddidi karo
    // akhrinta macallinka (fiiri firebase/attendance.js). student.classId waa
    // la door-biday className marka la heli karo (isla fallback-ka meelaha kale).
    const student = students.find((s) => s.id === studentId);
    const studentClass = classes.find((c) => (student?.classId ? c.id === student.classId : `${c.grade}${c.section}` === className));
    const classTeacherId = studentClass?.classTeacherId || null;
    try {
      await setStudentAttendanceRecord(profile.schoolCode, date, studentId, className, classTeacherId, status);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii imaanshaha ardayga la kaydinayay:', err);
    }
    // Xaadiris + Quraan UX merge (2026-08-25): haddii ardayga xaadiriskiisu
    // maanta noqdo Maqan/Fasax, calaamaddii Quraanka ee isla maalinta (haddii
    // horeba loo calaamadiyay isagoo Joog ahaa) waa la tirtiraa — arday aan
    // joogin ma lahan sabab Quraan loogu calaamadin karo maalintaas.
    if (status !== 'present') {
      try {
        await deleteQuranProgressRecord(date, studentId);
      } catch (err) {
        reportError('Khalad ayaa dhacay markii calaamaddii Quraanka la tirtirayay:', err);
      }
    }
    if (status === 'absent' && settings.notificationPrefs.attendanceAlerts) {
      try {
        await createAbsentNotification({
          schoolCode: profile.schoolCode,
          studentId,
          studentName: student?.fullName || '',
          className,
          classTeacherId,
          date,
        });
      } catch (err) {
        reportError('Khalad ayaa dhacay markii ogeysiiska maqnaanshaha la abuurayay:', err);
      }
    }
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
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setAllStudentAttendanceRecords([]);
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToAllAttendanceRecords(
      profile.schoolCode,
      classTeacherId,
      setAllStudentAttendanceRecords,
      (err) => reportError('Khalad ayaa dhacay markii taariikhda imaanshaha ardayda laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setAllStaffAttendanceRecords([]);
      return undefined;
    }
    const unsubscribe = subscribeToAllStaffAttendanceRecords(
      profile.schoolCode,
      setAllStaffAttendanceRecords,
      (err) => reportError('Khalad ayaa dhacay markii taariikhda imaanshaha macallimiinta/shaqaalaha laga soo akhriyay:', err)
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
      (err) => reportError('Khalad ayaa dhacay markii shaqaalaha (roster) laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  const addStaffMember = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createStaffRosterDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii shaqaalaha la darayay:', err);
    }
  };

  const updateStaffMember = async (id, payload) => {
    try {
      await updateStaffRosterDoc(id, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii shaqaalaha wax laga beddelayay:', err);
    }
  };

  const removeStaffMember = async (id) => {
    try {
      await deleteStaffRosterDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii shaqaalaha la saarayay:', err);
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
      todayDate,
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.personId] = r.status; });
        setTeacherAttendanceToday(map);
      },
      (err) => reportError('Khalad ayaa dhacay markii imaanshaha macallimiinta maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, todayDate]);

  useEffect(() => {
    if (!profile?.schoolCode) {
      setStaffAttendanceToday({});
      return undefined;
    }
    const unsubscribe = subscribeToStaffAttendanceByDate(
      profile.schoolCode,
      'staff',
      todayDate,
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.personId] = r.status; });
        setStaffAttendanceToday(map);
      },
      (err) => reportError('Khalad ayaa dhacay markii imaanshaha shaqaalaha maanta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, todayDate]);

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
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setQuranProgressToday({});
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToQuranProgressByDate(
      profile.schoolCode,
      todayISODate(),
      classTeacherId,
      (records) => {
        const map = {};
        records.forEach((r) => { map[r.studentId] = { result: r.result, surah: r.surah }; });
        setQuranProgressToday(map);
      },
      (err) => reportError('Khalad ayaa dhacay markii horumarka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

  // ===== HORUMARKA QURAANKA OO DHAN (taariikhda oo dhan, ma ahan hal maalin) —
  // loo isticmaalo Overview.jsx card-ka "Ardayda Aan Maanta Garanin Quraanka"
  // (drill-down: fasal kasta + taariikhda 10-kii maalmood ee arday kasta),
  // isla mabda'a allStudentAttendanceRecords kore. =====
  const [allQuranProgressRecords, setAllQuranProgressRecords] = useState([]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setAllQuranProgressRecords([]);
      return undefined;
    }
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setAllQuranProgressRecords([]);
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToAllQuranProgressRecords(
      profile.schoolCode,
      classTeacherId,
      setAllQuranProgressRecords,
      (err) => reportError('Khalad ayaa dhacay markii taariikhda horumarka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

  const setQuranProgress = async (studentId, className, result, surah) => {
    if (!profile?.schoolCode) return;
    try {
      const student = students.find((s) => s.id === studentId);
      const studentClass = classes.find((c) => (student?.classId ? c.id === student.classId : `${c.grade}${c.section}` === className));
      const classTeacherId = studentClass?.classTeacherId || null;
      await setQuranProgressRecord(profile.schoolCode, todayISODate(), studentId, className, result, surah, classTeacherId);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii horumarka Quraanka la kaydinayay:', err);
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
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setQuranTargetsState([]);
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToQuranTargets(
      profile.schoolCode,
      classTeacherId,
      setQuranTargetsState,
      (err) => reportError('Khalad ayaa dhacay markii yoolalka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

  // Upsert: haddii arday leeyahay yool "pending" ah oo horeba u jira, waa la
  // cusbooneysiinayaa meeshiisa; haddii kalese (mid horey uma jirin, ama tii
  // hore waa la go'aamiyay/reached/missed) waxaa la abuurayaa yool cusub —
  // taasi waxay siisaa macallinka fursad uu isla badhanka "Deji Yoolka" ugu
  // dhufto mar labaad si uu u sameeyo yool cusub isla ardaygaas.
  const saveQuranTarget = async (studentId, studentName, className, classId, data) => {
    if (!profile?.schoolCode) return;
    try {
      const existing = quranTargets.find((qt) => qt.studentId === studentId && qt.status === 'pending');
      if (existing) {
        await updateQuranTargetDoc(existing.id, data);
      } else {
        const targetClass = classes.find((c) => c.id === classId);
        const classTeacherId = targetClass?.classTeacherId || null;
        await createQuranTargetDoc(profile.schoolCode, {
          studentId, studentName, className, classId, classTeacherId,
          status: 'pending',
          decidedAt: null,
          createdAt: new Date().toISOString(),
          ...data,
        });
      }
    } catch (err) {
      reportError('Khalad ayaa dhacay markii yoolka Quraanka la kaydinayay:', err);
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
      reportError('Khalad ayaa dhacay markii natiijada yoolka Quraanka la kaydinayay:', err);
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
      (err) => reportError('Khalad ayaa dhacay markii fariimaha laga soo akhriyay:', err)
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
      reportError('Khalad ayaa dhacay markii fariinta la dirayay:', err);
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
      reportError('Khalad ayaa dhacay markii fariimaha la calaamadinayay in la akhriyay:', err);
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
      (err) => reportError('Khalad ayaa dhacay markii macallimiinta laga soo akhriyay:', err)
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
      (err) => reportError('Khalad ayaa dhacay markii fasallada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== TEACHER ROLE SCOPING (2026-08-02) =====
  // Xisaabin dhexe (single source of truth) oo loo isticmaalo dhammaan
  // bogagga/context-yada — macallinku waa in uu arkaa KALIYA xogta la
  // xiriirta fasalladiisa gaarka ah (classTeacherId === profile.teacherDocId),
  // ma aha xogta guud ee dugsiga (fiiri Students.jsx/Attendance.jsx/
  // Overview.jsx/NotificationsContext.jsx). null = ma jiro xaddidaad (owner/
  // staff kale — dhammaan fasallada dugsiga).
  const myClasses = useMemo(() => {
    if (profile?.role !== 'teacher') return null;
    return classes.filter((c) => c.classTeacherId === profile?.teacherDocId);
  }, [classes, profile?.role, profile?.teacherDocId]);

  const myClassIds = useMemo(() => (myClasses ? new Set(myClasses.map((c) => c.id)) : null), [myClasses]);
  const myClassNames = useMemo(
    () => (myClasses ? new Set(myClasses.map((c) => `${c.grade}${c.section}`)) : null),
    [myClasses]
  );

  // Hal mar per school — u buuxisa 'classTeacherId' record-yadii xaadiriska/
  // ogaysiisyada 'absent' ee hore loo abuuray ka hor intaan field-kaas cusub
  // la darin (Teacher Firestore Hardening, 2026-08-02 — firestore.rules-ku
  // hadda ku tiirsan yahay field-kan si loo xaddidiyo akhrinta macallinka).
  // Isla mabda'a backfillStudentLookups kore. Wuxuu sugayaa 'classes' inay
  // soo gaadhaan si loo dhiso xiriirka className -> classTeacherId.
  const backfilledClassScopingRef = useRef(null);
  useEffect(() => {
    if (!profile?.schoolCode || profile.accountType !== 'staff') return;
    if (classes.length === 0) return;
    if (backfilledClassScopingRef.current === profile.schoolCode) return;
    backfilledClassScopingRef.current = profile.schoolCode;
    const classNameToTeacherId = new Map(classes.map((c) => [`${c.grade}${c.section}`, c.classTeacherId || null]));
    const classIdToTeacherId = new Map(classes.map((c) => [c.id, c.classTeacherId || null]));
    backfillAttendanceClassScoping(profile.schoolCode, classNameToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii xaadiriska la buuxinayay (classTeacherId):', err)
    );
    backfillNotificationClassScoping(profile.schoolCode, classNameToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii ogeysiisyada la buuxinayay (classTeacherId):', err)
    );
    backfillQuranProgressClassScoping(profile.schoolCode, classNameToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii horumarka Quraanka la buuxinayay (classTeacherId):', err)
    );
    backfillQuranTargetsClassScoping(profile.schoolCode, classIdToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii yoolalka Quraanka la buuxinayay (classTeacherId):', err)
    );
    backfillStudentClassScoping(profile.schoolCode, classIdToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii ardayda la buuxinayay (classTeacherId):', err)
    );
  }, [profile?.schoolCode, profile?.accountType, classes]);

  // examMarks waxay u baahan tahay xiriirka examId -> classTeacherId (via
  // exam.classId -> class.classTeacherId), sidaas darteed effect gooni ah
  // ayaa u sugaya IN LABADABA 'classes' iyo 'exams' la soo shubay (haddii
  // 'exams' weli madhan yahay maadaama uu si isku mid ah u soo shubmayo, in
  // la sugo ayaa ka fiican in si khalad ah loogu qoro classTeacherId:null
  // buundooyin dhab ah oo aan weli la eegin).
  const backfilledExamMarksRef = useRef(null);
  useEffect(() => {
    if (!profile?.schoolCode || profile.accountType !== 'staff') return;
    if (classes.length === 0 || exams.length === 0) return;
    if (backfilledExamMarksRef.current === profile.schoolCode) return;
    backfilledExamMarksRef.current = profile.schoolCode;
    const classIdToTeacherId = new Map(classes.map((c) => [c.id, c.classTeacherId || null]));
    const examIdToTeacherId = new Map(exams.map((e) => [e.id, classIdToTeacherId.get(e.classId) || null]));
    backfillExamMarksClassScoping(profile.schoolCode, examIdToTeacherId).catch((err) =>
      reportError('Khalad ayaa dhacay markii buundooyinka la buuxinayay (classTeacherId):', err)
    );
  }, [profile?.schoolCode, profile?.accountType, classes, exams]);

  // ===== MAADOOYINKA (Firestore collection "subjects") =====
  useEffect(() => {
    if (!profile?.schoolCode) {
      setSubjects([]);
      return undefined;
    }
    const unsubscribe = subscribeToSubjects(
      profile.schoolCode,
      setSubjects,
      (err) => reportError('Khalad ayaa dhacay markii maadooyinka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== IMTIXAANADA - QEEXIDDA (Firestore collection "exams") =====
  // Staff-only (schoolCode-wide) — waalidku wuxuu isticmaalaa
  // subscribeToClassExamsForParent (fiiri ParentPortal.jsx) oo gaar u ah
  // fasalka ilmihiisa, si Firestore Rules-ku ugu ogolaadaan query-gan
  // (rules-ku `exams` akhriskeedu waa staff-kaliya, marka laga reebo
  // xaqiijinta gaarka ah ee waalidka, fiiri firestore.rules).
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setExams([]);
      return undefined;
    }
    const unsubscribe = subscribeToExams(
      profile.schoolCode,
      setExams,
      (err) => reportError('Khalad ayaa dhacay markii imtixaanada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // ===== XISAABAADKA (Firestore collections "financeExpenses"/"financeIncome"/
  // "classFees"/"feePayments") — OWNER-KALIYA (Teacher Role
  // Scoping audit, 2026-08-02) — firestore.rules-ku hadda wuxuu xannibayaa
  // 'teacher' akhris ahaan, sidaas darteed halkan sidoo kale waa in la
  // xannibaa si aan permission-denied error toast loo arag macallin kasta
  // oo login gareeya. =====
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setExpenses([]);
      return undefined;
    }
    const unsubscribe = subscribeToExpenses(
      profile.schoolCode,
      setExpenses,
      (err) => reportError('Khalad ayaa dhacay markii kharashaadka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setIncome([]);
      return undefined;
    }
    const unsubscribe = subscribeToIncome(
      profile.schoolCode,
      setIncome,
      (err) => reportError('Khalad ayaa dhacay markii dakhliga laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setClassFeeRows([]);
      return undefined;
    }
    const unsubscribe = subscribeToClassFees(
      profile.schoolCode,
      setClassFeeRows,
      (err) => reportError('Khalad ayaa dhacay markii safafka lacagta fasalka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setFeePayments([]);
      return undefined;
    }
    const unsubscribe = subscribeToFeePayments(
      profile.schoolCode,
      setFeePayments,
      (err) => reportError('Khalad ayaa dhacay markii bixinada lacagta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setSalaries([]);
      return undefined;
    }
    const unsubscribe = subscribeToSalaries(
      profile.schoolCode,
      setSalaries,
      (err) => reportError('Khalad ayaa dhacay markii mushaharka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  // Liiska shaqaalaha login-ka leh (users, accountType:'staff') — waxaa
  // loo isticmaalaa payroll-ka (Finance > Mushaharka), si loo helo
  // salaryAmount-ka shaqaalaha aan macallin ahayn (Owner/Principal/VP/
  // Accountant/Receptionist). Isla mabda'a salaries kore: owner-kaliya.
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setStaffAccounts([]);
      return undefined;
    }
    const unsubscribe = subscribeToStaff(
      profile.schoolCode,
      setStaffAccounts,
      (err) => reportError('Khalad ayaa dhacay markii shaqaalaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setDiscounts([]);
      return undefined;
    }
    const unsubscribe = subscribeToDiscounts(
      profile.schoolCode,
      setDiscounts,
      (err) => reportError('Khalad ayaa dhacay markii dhimista/deeqaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff' || profile?.role === 'teacher') {
      setFinanceDocuments([]);
      return undefined;
    }
    const unsubscribe = subscribeToDocuments(
      profile.schoolCode,
      setFinanceDocuments,
      (err) => reportError('Khalad ayaa dhacay markii invoices/receipts laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role]);

  // Liiska payroll-ka otomaatig ah (isla habka fee-ga ardayda) — waxaa laga
  // soo ururiyaa teachers (salaryAmount) + staffAccounts (salaryAmount, aan
  // macallin ahayn). Fiiri utils/staffSalary.js.
  const payrollList = useMemo(() => buildPayrollList(teachers, staffAccounts), [teachers, staffAccounts]);

  // Bixinta mushaharka hal qof (bishaas) — waxaa loo isticmaalaa Finance.jsx
  // badhanka "Bixi Mushaharka". Isla habka collectStudentFee: waxaa la abuuraa
  // diiwaan CUSUB oo append-only (ma jiro "pending" doc oo la beddelo), oo si
  // otomaatig ah ugu daraa qaybta Kharashaadka (financeExpenses) — si
  // xisaabaadka guud (Xisaabaadka tab-ka + "Hadhaa"/wadarta kharashka) ay u
  // sii ahaadaan xog dhab ah.
  const payStaffSalary = async (person, month) => {
    if (!profile?.schoolCode) return;
    try {
      await createSalaryDoc(profile.schoolCode, {
        personId: person.personId,
        personType: person.personType,
        teacherId: person.teacherId,
        staffName: person.staffName,
        role: person.role,
        amount: person.amount,
        month,
        date: todayISODate(),
      });
      await createExpenseDoc(profile.schoolCode, {
        category: 'Mushahar',
        description: `Mushaharka ${person.staffName || ''}${person.role ? ` - ${person.role}` : ''} (${month})`.trim(),
        amount: person.amount || 0,
        date: todayISODate(),
      });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii mushaharka la bixinayay:', err);
    }
  };

  // Finance audit (2026-08-04, buttons-work-as-intended pass): hore
  // "Ku Dar Dhimis/Deeq" wuxuu kaliya samayn jiray diiwaan (financeDiscounts,
  // tab-ka Discounts + tirada "Q.Dhimis"), laakiin ma taaban jirin xisaabinta
  // DHABTA AH ee lacagta ardaygaas (studentFeeOwed(), kaas oo isticmaala
  // student.feeType/discountPercent — kaliya laga beddeli jiray
  // StudentFormModal). Sidaas darteed maamulaha wuxuu u arki jiray in dhimis
  // la siiyay, laakiin ardaygu wuu bixin jiray qadarkiisii buuxa. Hadda waxaa
  // sidoo kale la cusboonaysiinayaa diiwaanka ardayga si dhimistu/deeqdu si
  // dhab ah ugu dhaqmaan lacagta.
  const addDiscount = async (payload) => {
    if (!profile?.schoolCode || !payload.studentId) return;
    try {
      await createDiscountDoc(profile.schoolCode, payload);
      if (payload.type === 'scholarship') {
        await updateStudentDoc(payload.studentId, { feeType: 'free' });
      } else {
        await updateStudentDoc(payload.studentId, { feeType: 'discount', discountPercent: Number(payload.discountPercent) || 0 });
      }
    } catch (err) {
      reportError('Khalad ayaa dhacay markii dhimista/deeqda la darayay:', err);
    }
  };

  const addFinanceDocument = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      const prefix = payload.type === 'invoice' ? 'INV' : 'RCT';
      const no = `${prefix}-${new Date().getFullYear()}-${String(financeDocuments.length + 1).padStart(3, '0')}`;
      await createDocumentDoc(profile.schoolCode, { ...payload, no });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii invoice/receipt la darayay:', err);
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

  const addExpense = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createExpenseDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii kharashka la darayay:', err);
    }
  };

  const addIncome = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createIncomeDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii dakhliga la darayay:', err);
    }
  };

  const addClassFeeRow = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createClassFeeRowDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii safka lacagta fasalka la darayay:', err);
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
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setExamMarks({});
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToExamMarks(
      profile.schoolCode,
      classTeacherId,
      (records) => {
        const map = {};
        records.forEach((r) => {
          if (!map[r.examId]) map[r.examId] = {};
          map[r.examId][r.studentId] = r.mark;
        });
        setExamMarks(map);
      },
      (err) => reportError('Khalad ayaa dhacay markii buundooyinka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

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
        reportError('Khalad ayaa dhacay markii ardayda laga soo akhriyay Firestore:', err);
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
      reportError('Khalad ayaa dhacay markii lookup-ka ardayda la buuxinayay:', err)
    );
  }, [profile?.schoolCode, profile?.accountType]);

  // Hal mar per school — u buuxisa "classId" ardayda hore u haystay
  // "className" kaliya (ka hor intaan xiriirka classId-ka dhabta ah la
  // darin). Waxay isbarbardhigtaa className-ka ardayga iyo grade+section
  // fasallada dhabta ah — khatar-yartahay maadaama className-kii hore laga
  // soo doortay dropdown dhab ah (ma ahayn qoraal laba meelood oo gooni ah).
  const classIdBackfillRef = useRef(null);
  useEffect(() => {
    if (!profile?.schoolCode || profile.accountType !== 'staff') return;
    if (classIdBackfillRef.current === profile.schoolCode) return;
    if (classes.length === 0 || allStudents.length === 0) return;
    classIdBackfillRef.current = profile.schoolCode;
    allStudents
      .filter((s) => !s.classId && s.className)
      .forEach((s) => {
        const match = classes.find((c) => `${c.grade}${c.section}` === s.className);
        if (match) {
          updateStudentDoc(s.id, { classId: match.id }).catch((err) =>
            reportError('Khalad ayaa dhacay markii classId-ga ardayga la buuxinayay:', err)
          );
        }
      });
  }, [profile?.schoolCode, profile?.accountType, classes, allStudents]);

  // Hal mar per school — u buuxisa "classId" imtixaannada hore u haystay
  // "className" kaliya (isla fikradda backfill-ka classId ee ardayda kore —
  // className-kii hore waxaa laga soo doortay dropdown dhab ah, khatar-yar).
  const examClassIdBackfillRef = useRef(null);
  useEffect(() => {
    if (!profile?.schoolCode || profile.accountType !== 'staff') return;
    if (examClassIdBackfillRef.current === profile.schoolCode) return;
    if (classes.length === 0 || exams.length === 0) return;
    examClassIdBackfillRef.current = profile.schoolCode;
    exams
      .filter((e) => !e.classId && e.className)
      .forEach((e) => {
        const match = classes.find((c) => `${c.grade}${c.section}` === e.className);
        if (match) {
          // classTeacherId waa in la buuxiyaa isla mar (Exams audit,
          // 2026-08-04) — haddii kale backfill-kani (oo macallinku sidoo
          // kale socodsiin karo, ma aha owner-kaliya) wuxuu ku fashilmi
          // lahaa firestore.rules (isMyClassData) marka classTeacherId uu
          // sii ahaado null ka dib updateExamDoc-ka.
          updateExamDoc(e.id, { classId: match.id, classTeacherId: match.classTeacherId || null }).catch((err) =>
            reportError('Khalad ayaa dhacay markii classId-ga imtixaanka la buuxinayay:', err)
          );
        }
      });
  }, [profile?.schoolCode, profile?.accountType, classes, exams]);

  // Ogeysiiska lacagta bishii ("fee reminder") hadda si otomaatig ah ayaa loo
  // sameeyaa NotificationsContext.jsx (kaas oo bishii-bishii u wareega ardayda
  // "unpaid" ee dhabta ah ee feePayments) — ma aha mid gacan-gelin ah oo
  // ku tiirsan field-kii hore ee "fee" (paid/pending/overdue), kaas oo hadda
  // laga saaray StudentFormModal gebi ahaanba.
  const addStudent = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createStudentDoc(profile.schoolCode, {
        ...payload,
        studentId: `STU-${1040 + allStudents.length + 1}`,
      });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga la darayay:', err);
    }
  };

  const updateStudent = async (id, payload) => {
    try {
      await updateStudentDoc(id, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga wax laga beddelayay:', err);
    }
  };

  // Tirtir dabacsan — ardayga wuxuu u dhaqmaa "Xogta La Tirtiray" 45 maalmood,
  // waana laga soo celin karaa (fiiri restoreStudent/permanentlyDeleteStudent).
  const deleteStudent = async (id) => {
    try {
      await softDeleteStudentDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga la tirtirayay:', err);
    }
  };

  const restoreStudent = async (id) => {
    try {
      await restoreStudentDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga laga soo celinayay xogta la tirtiray:', err);
    }
  };

  const permanentlyDeleteStudent = async (id) => {
    try {
      await deleteStudentDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga si joogto ah loo tirtirayay:', err);
    }
  };

  // Qalin-jabin/Ka-bixid — GOONI ka ah deleteStudent/restoreStudent (Trash)
  // ee kore, fiiri comment-ka "students"/"archivedStudents".
  const archiveStudent = async (id, enrollmentStatus, note) => {
    try {
      await archiveStudentDoc(id, enrollmentStatus, note);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga la qalin-jabinayay:', err);
    }
  };

  const restoreArchivedStudent = async (id) => {
    try {
      await restoreArchivedStudentDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ardayga qalin-jabiyay laga soo celinayay:', err);
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
          reportError('Khalad ayaa dhacay markii xog dhammaatay 45-ta maalmood si otomaatig ah loo tirtirayay:', err)
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
      reportError('Khalad ayaa dhacay markii xogta tijaabada la seed-gareynayay:', err);
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
      reportError('Khalad ayaa dhacay markii macallinka la darayay:', err);
    }
  };

  const updateTeacher = async (id, payload) => {
    try {
      await updateTeacherDoc(id, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii macallinka wax laga beddelayay:', err);
    }
  };

  // Marka macallin laga saaro bogga "Users" ("Ka Saar" shaqaale) — waxaa loo
  // baahan yahay in dhinac kasta oo la xiriira uu ka nadiifsanaado ka hor
  // intaan diiwaanka gelitaanka (users/{uid}) la tirtirin (fiiri Users.jsx).
  // Fasallada/maadooyinka waa la nadiifiyaa (classTeacherId/teacherId -> null),
  // diiwaanka "teachers" waa loo beddelaa status:'inactive' (ma tirtiro, fiiri
  // firestore.rules: teachers allow delete: if false). Xogta taariikheed
  // (attendanceRecords/notifications/examMarks/quranProgress/quranTargets/
  // financeSalaries) SI ULA KAC AH looma taabto — classTeacherId/teacherId
  // ku jira kuwaas waa snapshot waqtigii la qoray, ma aha xiriir nool.
  const cascadeUnlinkTeacher = async (teacherDocId) => {
    if (!profile?.schoolCode || !teacherDocId) return;
    await unlinkTeacherFromClasses(profile.schoolCode, teacherDocId);
    await unlinkTeacherFromSubjects(profile.schoolCode, teacherDocId);
    await deactivateTeacherDoc(teacherDocId);
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
      reportError('Khalad ayaa dhacay markii imaanshaha macallinka la cusbooneysiinayay:', err);
    }
  };

  // ===== FASALLADA =====
  // "students" (tirada ardayda) mar dambe lama kaydiyo doc-ka fasalka — waxaa
  // laga soo xisaabiyaa (derived) collection-ka "students" ee dhabta ah
  // marka la muujinayo (fiiri Classes.jsx), si aan loo helin counter joogto
  // ah oo aan la cusboonaysiin (fiiri classId ee hoose).
  const addClass = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createClassDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii fasalka la darayay:', err);
    }
  };

  // Marka fasal magaciisu beddelmo (grade/section), ardayda isticmaala
  // classId-kan waa in "className" (denormalized, fiiri students.js) si
  // otomaatig ah loo cusboonaysiiyaa — haddii kale ardaydaasi way ka baxsan
  // lahaayeen (invisible) ClassWorkspace/Finance/Xaadiris iyo intii kale,
  // maadaama kuwaas ay weli isticmaalaan "className" qoraalka ah.
  const updateClass = async (id, payload) => {
    try {
      await updateClassDoc(id, payload);
      const newClassroomName = `${payload.grade}${payload.section}`;
      const newClassTeacherId = payload.classTeacherId || null;
      // classTeacherId waa in la cusboonaysiiyaa ardayda fasalkan marka
      // macallinka fasalka la beddelo (reassign) — haddii kale
      // firestore.rules-ka "students" (isMyClassData) wuxuu sii xannibi
      // doonaa macallinka CUSUB xitaa ardaydiisa cusub (Students audit, 2026-08-03).
      const affectedStudents = students.filter((s) => s.classId === id
        && (s.className !== newClassroomName || (s.classTeacherId || null) !== newClassTeacherId));
      await Promise.all(affectedStudents.map((s) => updateStudentDoc(s.id, {
        className: newClassroomName,
        classTeacherId: newClassTeacherId,
      })));
      // Isla sida ardayda — imtixaannada classId-gan leh waa in "className"
      // (denormalized) la cusboonaysiiyaa, si Exams.jsx/ClassWorkspace/
      // Reports.jsx (kuwaas oo isticmaala qoraalkan) aysan u dhaqmin xog
      // duugsan. classTeacherId sidoo kale (Exams audit, 2026-08-04) — haddii
      // kale imtixaannadii macallinkii HORE ayay sii xiran lahaayeen
      // (firestore.rules: isMyClassData), macallinka CUSUB uusan awoodin
      // inuu maamulo imtixaannada fasalkiisa cusub.
      const affectedExams = exams.filter((e) => e.classId === id
        && (e.className !== newClassroomName || (e.classTeacherId || null) !== newClassTeacherId));
      await Promise.all(affectedExams.map((e) => updateExamDoc(e.id, {
        className: newClassroomName,
        classTeacherId: newClassTeacherId,
      })));
      // Isla sida ardayda/imtixaannada — yoolasha Quraanka classId-gan leh
      // waa in "className" (denormalized) la cusboonaysiiyaa, si ClassWorkspace.jsx
      // (Yoolka Quraanka tab) aanu u dhaqmin xog duugsan (Reports MEDIUM #1).
      const affectedQuranTargets = quranTargets.filter((qt) => qt.classId === id && qt.className !== newClassroomName);
      await Promise.all(affectedQuranTargets.map((qt) => updateQuranTargetDoc(qt.id, { className: newClassroomName })));
    } catch (err) {
      reportError('Khalad ayaa dhacay markii fasalka wax laga beddelayay:', err);
    }
  };

  // Xannibaad: fasal aan la tirtiri karin haddii arday weli ku jiraan.
  // Audit (2026-08-02, gap #1 — Classes audit qayb 2aad): hore waxaa la
  // hubin jiray "classId" oo qura — laakiin Classes.jsx/ClassDetailModal/
  // ClassWorkspace/Finance.jsx dhammaantood waxay tirinayaan/muujinayaan
  // ardayda iyaga oo isticmaalaya dual-check (classId haddii jiro, haddii
  // kale className fallback ardayda hore ee aan weli la dib-u-kaydin
  // backfill-ka cusub, fiiri classIdBackfillRef kore). Guard-kani hadda waa
  // in uu isla dual-check-aas isticmaalo — haddii kale fasal UI-gu tusayo
  // inuu arday hayo (className fallback) wuu tirtiri karayay isaga oo
  // "orphaned" ka dhigaya ardaygaas (classId/className u hadhaya fasal aan
  // jirin).
  const removeClass = async (id) => {
    const cls = classes.find((c) => c.id === id);
    const className = cls ? `${cls.grade}${cls.section}` : null;
    const hasStudents = students.some((s) => (s.classId ? s.classId === id : s.className === className));
    if (hasStudents) {
      reportError('Fasalkan waa in aad marka hore ka wareejisaa ardayda ka hor intaad tirtirin.', new Error('CLASS_HAS_STUDENTS'));
      return;
    }
    try {
      await deleteClassDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii fasalka la tirtirayay:', err);
    }
  };

  // ===== MAADOOYINKA =====
  const addSubject = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      await createSubjectDoc(profile.schoolCode, payload);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii maadada la darayay:', err);
    }
  };
  const updateSubject = async (id, payload) => {
    try {
      await updateSubjectDoc(id, payload);
      // Imtixaannada subjectId-gan leh waa in "subject" (denormalized) la
      // cusboonaysiiyaa marka maadada magaceeda la beddelo — isla fikradda
      // updateClass ee kore.
      if (payload.name) {
        const affectedExams = exams.filter((e) => e.subjectId === id && e.subject !== payload.name);
        await Promise.all(affectedExams.map((e) => updateExamDoc(e.id, { subject: payload.name })));
      }
    } catch (err) {
      reportError('Khalad ayaa dhacay markii maadada wax laga beddelayay:', err);
    }
  };
  // Audit (2026-08-02, Classes qayb 2aad, gap LOW): ka hor intaan subject-ka
  // la tirtirin, ka saar (arrayRemove) dhammaan fasallada "subjectIds" uu ku
  // jiray — haddii kale ID-giisu wuu ku hadhi lahaa fasallada gudahooda
  // (orphan, aan la nadiifin marnaba).
  const removeSubject = async (id) => {
    if (!profile?.schoolCode) return;
    try {
      await unlinkSubjectFromClasses(profile.schoolCode, id);
      await deleteSubjectDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii maadada la tirtirayay:', err);
    }
  };

  // ===== IMTIXAANADA =====
  // classTeacherId (denormalized, Exams audit 2026-08-04) — loo baahan si
  // firestore.rules (isMyClassData) macallinku u abuuri/wax-ka-beddelo
  // KALIYA imtixaannada fasalkiisa gaarka ah, isla habka attendanceRecords/
  // examMarks/quranProgress. classId-ga foomka (ExamFormModal) waa waajib +
  // la beddeli karaa update-ka, marka labada addExam/updateExam waa in ay
  // dib u xisaabiyaan.
  const addExam = async (payload) => {
    if (!profile?.schoolCode) return;
    try {
      const examClass = classes.find((c) => c.id === payload.classId);
      await createExamDoc(profile.schoolCode, { ...payload, classTeacherId: examClass?.classTeacherId || null });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii imtixaanka la darayay:', err);
    }
  };
  const updateExam = async (id, payload) => {
    try {
      const examClass = classes.find((c) => c.id === payload.classId);
      await updateExamDoc(id, { ...payload, classTeacherId: examClass?.classTeacherId || null });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii imtixaanka wax laga beddelayay:', err);
    }
  };
  const removeExam = async (id) => {
    try {
      await deleteExamDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii imtixaanka la tirtirayay:', err);
    }
  };
  const updateExamMark = async (examId, studentId, value) => {
    if (!profile?.schoolCode) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      const examClass = classes.find((c) => c.id === exam?.classId);
      const classTeacherId = examClass?.classTeacherId || null;
      await setExamMarkRecord(profile.schoolCode, examId, studentId, value === '' ? '' : Number(value), classTeacherId);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii buundada la kaydinayay:', err);
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
      reportError('Khalad ayaa dhacay markii lacagta la ururinayay:', err);
    }
  };
  const collectClassFee = (rowId, amount, method, date) => collectFee('class', rowId, amount, method, date);

  // Fii-ga arday-gaarka ah (Finance > Fasalada) — hal diiwaan (feePayments) per
  // arday+bil, ma aha counter la is dhimo. Bishii cusub markay bilaabato,
  // diiwaan bishaas ah ma jiro weli, sidaas darteed ardaygu si otomaatig ah
  // wuxuu u noqdaa "Aan Bixin" iyada oo aan loo baahnayn tirtiro/reset gacan.
  const collectStudentFee = async (studentId, month) => {
    if (!profile?.schoolCode) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    try {
      await createFeePaymentDoc({
        schoolCode: profile.schoolCode,
        feeType: 'student',
        studentId,
        studentName: student.fullName || '',
        className: student.className || '',
        month,
        amount: studentFeeOwed(student),
        method: '',
        date: todayISODate(),
        collectedBy: profile.uid,
        collectedByName: profile.fullName || '',
      });
    } catch (err) {
      reportError('Khalad ayaa dhacay markii lacagta ardayga la ururinayay:', err);
    }
  };

  // ===== IMAANSHAHA MAANTA (Macallimiinta / Shaqaalaha) =====
  const cycleAttendanceStatus = async (category, id) => {
    if (!profile?.schoolCode) return;
    const currentMap = category === 'teachers' ? teacherAttendanceToday : staffAttendanceToday;
    // Qofka aan weli la calaamadin (currentMap[id] maqan) — riixitaanka kowaad
    // waa in uu dhigaa 'present', ma aha in uu si toos ah ugu boodo 'absent'
    // (Attendance audit, 2026-08-03 — hore default-display-ku wuxuu ahaa
    // 'present', marka riixitaanka kowaad ee NEXT_STATUS['present'] wuxuu si
    // ula kac ah ugu boodi jiray 'absent').
    const nextStatus = currentMap[id] ? NEXT_STATUS[currentMap[id]] : 'present';
    try {
      await setStaffAttendanceRecord(profile.schoolCode, category, todayISODate(), id, nextStatus);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii imaanshaha maanta la cusbooneysiinayay:', err);
    }
  };

  const attendanceToday = {
    students: studentAttendanceToday,
    teachers: teacherAttendanceToday,
    staff: staffAttendanceToday,
  };

  const value = {
    students, studentsLoading, addStudent, updateStudent, deleteStudent, seedDemoStudents,
    deletedStudents, restoreStudent, permanentlyDeleteStudent,
    archivedStudents, archiveStudent, restoreArchivedStudent,
    setStudentAttendanceStatus,
    myClasses, myClassIds, myClassNames,
    teachers, addTeacher, updateTeacher, cycleTeacherAttendanceRecord, cascadeUnlinkTeacher,
    classes, addClass, updateClass, removeClass,
    subjects, addSubject, updateSubject, removeSubject,
    exams, examMarks, addExam, updateExam, removeExam, updateExamMark,
    classFees, collectClassFee, addClassFeeRow, feePayments, collectStudentFee,
    expenses, income, addExpense, addIncome,
    salaries, payrollList, payStaffSalary,
    discounts, addDiscount,
    financeDocuments, addFinanceDocument,
    staff, addStaffMember, updateStaffMember, removeStaffMember,
    attendanceToday, cycleAttendanceStatus, todayDate,
    allStudentAttendanceRecords, allStaffAttendanceRecords,
    quranProgressToday, setQuranProgress, allQuranProgressRecords,
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
