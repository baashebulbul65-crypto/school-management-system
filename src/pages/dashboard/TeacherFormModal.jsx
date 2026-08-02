import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { classroomName } from '../../hooks/useClassOptions';
import './TeacherFormModal.css';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  qualification: '',
  subject: '',
  status: 'active',
};

function initials(name) {
  if (!name) return 'MC';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function TeacherFormModal({ isOpen, onClose, onSave, teacher }) {
  const { t } = useTranslation();
  const { classes } = useSchoolData();
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!teacher;

  // Audit (2026-08-02, gap #3 — assignedClasses vs classTeacherId): fasallada
  // macallinku dhigo hore waxaa lagu kaydin jiray field GOONI ah oo teacher
  // doc-ka ku jira ("assignedClasses", la beddelo multi-select-kan), taasoo
  // MARNA aan lala xiriirin xiriirka DHABTA AH (classes.classTeacherId, kaas
  // oo Classes.jsx/ClassFormModal maamula, oo ay ku tiirsan yihiin rules-ka/
  // role-scoping-ka oo dhan). Labadaas waxay is khaldi karaan (owner-ku wuxuu
  // halkan dhigi karaa "Fasal X" isaga oo Classes.jsx-ka classTeacherId-giisu
  // uu yahay macallin kale). Halkan hadda waa MUUQAAL OO QURA (read-only),
  // lagana soo xisaabiyaa xogta DHABTA AH ee "classes" — lagama beddeli karo
  // halkan, waxaa ka beddela bogga "Fasallada" (ClassFormModal-ka).
  const assignedClasses = isEditing ? classes.filter((c) => c.classTeacherId === teacher.id) : [];

  useEffect(() => {
    if (teacher) {
      setForm({
        fullName: teacher.fullName || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        qualification: teacher.qualification || '',
        subject: teacher.subject || '',
        status: teacher.status || 'active',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [teacher, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, teacher?.id);
    onClose();
  };

  return (
    <div className="tfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tfm-modal">
        <div className="tfm-header">
          <div className="tfm-header-left">
            <div className="tfm-avatar">{initials(form.fullName)}</div>
            <div>
              <h2>{isEditing ? t('teachers.form.editTitle') : t('teachers.form.addTitle')}</h2>
              <p>{isEditing ? teacher.teacherId : t('teachers.form.fillInfo')}</p>
            </div>
          </div>
          <button className="tfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tfm-body">

            <div className="tfm-section-label">{t('teachers.form.sections.personal')}</div>
            <div className="tfm-grid">
              <div className="tfm-field full">
                <label>{t('teachers.form.fields.fullName')}</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder={t('teachers.form.placeholders.fullName')} required />
              </div>
              <div className="tfm-field">
                <label>{t('teachers.form.fields.phone')}</label>
                <input type="text" value={form.phone} onChange={update('phone')} placeholder={t('teachers.form.placeholders.phone')} />
              </div>
              <div className="tfm-field">
                <label>{t('teachers.form.fields.email')}</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder={t('teachers.form.placeholders.email')} />
              </div>
              <div className="tfm-field full">
                <label>{t('teachers.form.fields.qualification')}</label>
                <input type="text" value={form.qualification} onChange={update('qualification')} placeholder={t('teachers.form.placeholders.qualification')} />
              </div>
            </div>

            <div className="tfm-section-label">{t('teachers.form.sections.academic')}</div>
            <div className="tfm-grid">
              <div className="tfm-field">
                <label>{t('teachers.form.fields.subject')}</label>
                <input type="text" value={form.subject} onChange={update('subject')} placeholder={t('teachers.form.placeholders.subject')} required />
              </div>
              <div className="tfm-field">
                <label>{t('teachers.form.fields.status')}</label>
                <select value={form.status} onChange={update('status')}>
                  <option value="active">{t('common.status.active')}</option>
                  <option value="leave">{t('common.leave')}</option>
                </select>
              </div>
              <div className="tfm-field full">
                <label>{t('teachers.form.fields.assignedClasses')}</label>
                <p className="tfm-readonly-value">
                  {!isEditing
                    ? t('teachers.form.assignAfterCreate')
                    : assignedClasses.length === 0
                    ? t('teachers.form.noAssignedClassesYet')
                    : assignedClasses.map((c) => classroomName(c)).join(', ')}
                </p>
                <span className="tfm-hint">{t('teachers.form.assignClassesHint')}</span>
              </div>
            </div>

          </div>

          <div className="tfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEditing ? t('common.save') : t('teachers.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherFormModal;
