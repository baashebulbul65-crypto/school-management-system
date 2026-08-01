import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useClassOptions, classroomName } from '../../hooks/useClassOptions';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useSettings } from '../../context/SettingsContext';
import { getFeeType } from '../../utils/studentFee';
import './StudentFormModal.css';

const EMPTY_FORM = {
  fullName: '',
  gender: 'Wiil',
  dob: '',
  phone: '',
  parentName: '',
  parentRelation: 'Aabo',
  parentPhone: '',
  parentEmail: '',
  address: '',
  classId: '',
  section: 'A',
  rollNumber: '',
  subjects: '',
  feeType: 'fixed',
  feeAmount: '',
  discountPercent: '',
  status: 'active',
};

function initials(name) {
  if (!name) return 'AR';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StudentFormModal({ isOpen, onClose, onSave, student }) {
  const { t } = useTranslation();
  const { classes } = useSchoolData();
  const { settings } = useSettings();
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!student;
  const classOptions = useClassOptions(form.classId, { byId: true });

  // Marka arday CUSUB la doorto fasal, feeAmount-ka waxaa si otomaatig ah
  // loogu buuxinayaa qiimaha feesByGrade ee fasalkaas (Settings > Qiimaha),
  // haddii la helo — weli waa la beddeli karaa gacan ahaan. Arday jira
  // lama taabanayo si aan loo tirtirin feeAmount gaar ah oo horeba loo
  // geliyay (override).
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setForm((f) => {
      const next = { ...f, classId };
      if (!isEditing) {
        const cls = classes.find((c) => c.id === classId);
        const gradeFee = cls && settings.feesByGrade.find((g) => g.grade === cls.grade);
        if (gradeFee) next.feeAmount = gradeFee.amount;
      }
      return next;
    });
  };

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName || '',
        gender: student.gender || 'Wiil',
        dob: student.dob || '',
        phone: student.phone || '',
        parentName: student.parentName || '',
        parentRelation: student.parentRelation || 'Aabo',
        parentPhone: student.parentPhone || '',
        parentEmail: student.parentEmail || '',
        address: student.address || '',
        classId: student.classId || '',
        section: student.section || 'A',
        rollNumber: student.rollNumber || '',
        subjects: (student.subjects || []).join(', '),
        feeType: getFeeType(student),
        feeAmount: student.feeAmount ?? '',
        discountPercent: student.discountPercent ?? '',
        status: student.status || 'active',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const subjectsArray = form.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // "className" waxaa laga soo saaraa fasalka la doortay (classId) — waxaa
    // loo baahan yahay in ay sii jirto (denormalized) collections-ka kale ee
    // isticmaala (attendanceRecords/exams/quranProgress/quranTargets/
    // messages/notifications), si aan loo baahnayn in kuwaas la wada beddelo.
    // Fiiri SchoolDataContext.jsx: updateClass waxay si otomaatig ah u
    // cusboonaysiisaa qiimahan marka fasalku magaciisa beddelo (rename).
    const selectedClass = classes.find((c) => c.id === form.classId);
    const payload = {
      ...form,
      className: selectedClass ? classroomName(selectedClass) : '',
      subjects: subjectsArray,
      rollNumber: Number(form.rollNumber) || 0,
      feeAmount: form.feeType === 'free' ? 0 : Number(form.feeAmount) || 0,
      discountPercent: form.feeType === 'discount' ? Number(form.discountPercent) || 0 : 0,
    };

    onSave(payload, student?.id);
    onClose();
  };

  return (
    <div className="sfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sfm-modal">
        <div className="sfm-header">
          <div className="sfm-header-left">
            <div className="sfm-avatar">{initials(form.fullName)}</div>
            <div>
              <h2>{isEditing ? t('students.form.editTitle') : t('students.form.addTitle')}</h2>
              <p>{isEditing ? student.studentId : t('students.form.fillInfo')}</p>
            </div>
          </div>
          <button className="sfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sfm-body">

            <div className="sfm-section-label">{t('students.form.sections.personal')}</div>
            <div className="sfm-grid">
              <div className="sfm-field full">
                <label>{t('students.form.fields.fullName')}</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder={t('students.form.placeholders.fullName')} required />
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.gender')}</label>
                <select value={form.gender} onChange={update('gender')}>
                  <option value="Wiil">{t('students.form.fields.male')}</option>
                  <option value="Gabar">{t('students.form.fields.female')}</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.dob')}</label>
                <input type="date" value={form.dob} onChange={update('dob')} />
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.phone')}</label>
                <input type="text" value={form.phone} onChange={update('phone')} placeholder={t('students.form.placeholders.phone')} />
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.address')}</label>
                <input type="text" value={form.address} onChange={update('address')} placeholder={t('students.form.placeholders.address')} />
              </div>
            </div>

            <div className="sfm-section-label">{t('students.form.sections.parent')}</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>{t('students.form.fields.parentName')}</label>
                <input type="text" value={form.parentName} onChange={update('parentName')} />
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.relation')}</label>
                <select value={form.parentRelation} onChange={update('parentRelation')}>
                  <option value="Aabo">{t('students.form.fields.father')}</option>
                  <option value="Hooyo">{t('students.form.fields.mother')}</option>
                  <option value="Mas'uul Kale">{t('students.form.fields.otherGuardian')}</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.parentPhone')}</label>
                <input type="text" value={form.parentPhone} onChange={update('parentPhone')} placeholder={t('students.form.placeholders.phone')} />
              </div>
              <div className="sfm-field full">
                <label>{t('students.form.fields.parentEmail')}</label>
                <input type="email" value={form.parentEmail} onChange={update('parentEmail')} placeholder={t('students.form.placeholders.parentEmail')} />
              </div>
            </div>

            <div className="sfm-section-label">{t('students.form.sections.academic')}</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>{t('students.form.fields.className')}</label>
                <select value={form.classId} onChange={handleClassChange} required disabled={classOptions.length === 0}>
                  <option value="" disabled>
                    {classOptions.length === 0 ? t('students.form.placeholders.noClasses') : t('students.form.placeholders.selectClass')}
                  </option>
                  {classOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.section')}</label>
                <select value={form.section} onChange={update('section')}>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.rollNumber')}</label>
                <input type="number" value={form.rollNumber} onChange={update('rollNumber')} />
              </div>
              <div className="sfm-field full">
                <label>{t('students.form.fields.subjects')}</label>
                <input type="text" value={form.subjects} onChange={update('subjects')} placeholder={t('students.form.placeholders.subjects')} />
              </div>
            </div>

            <div className="sfm-section-label">{t('students.form.sections.status')}</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>{t('students.form.fields.regStatus')}</label>
                <select value={form.status} onChange={update('status')}>
                  <option value="active">{t('common.status.active')}</option>
                  <option value="inactive">{t('common.status.inactive')}</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>{t('students.form.fields.feeType')}</label>
                <select value={form.feeType} onChange={update('feeType')}>
                  <option value="fixed">{t('students.form.fields.feeTypeFixed')}</option>
                  <option value="free">{t('students.form.fields.feeTypeFree')}</option>
                  <option value="discount">{t('students.form.fields.feeTypeDiscount')}</option>
                </select>
              </div>

              {form.feeType !== 'free' && (
                <div className="sfm-field">
                  <label>{t('students.form.fields.feeAmount')}</label>
                  <input
                    type="number"
                    min="0"
                    value={form.feeAmount}
                    onChange={update('feeAmount')}
                    placeholder={t('students.form.placeholders.feeAmount')}
                    required
                  />
                </div>
              )}

              {form.feeType === 'discount' && (
                <div className="sfm-field">
                  <label>{t('students.form.fields.discountPercent')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={update('discountPercent')}
                    placeholder={t('students.form.placeholders.discountPercent')}
                    required
                  />
                </div>
              )}
            </div>

          </div>

          <div className="sfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEditing ? t('common.save') : t('students.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentFormModal;
