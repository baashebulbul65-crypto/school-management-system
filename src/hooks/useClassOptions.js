// Liiska ikhtiyaarrada fasallada ee dropdown-yada (StudentFormModal, iwm) —
// ka soo saaraa xogta DHAB AH ee collection-ka "classes" (real-time, via
// SchoolDataContext), si aan loo isku celcelin (duplicate) habka isku
// xirka fasal+arday. `classroomName` waxaa sidoo kale si gaar ah loogu
// soo dejiyaa (import) meelaha kale ee u baahan qaab-dhismeedka
// "grade+section" isla mid ah (Teachers.jsx, TeacherFormModal.jsx,
// TeacherProfileModal.jsx, ClassWorkspace.jsx) — kuwaas hadda ka soo
// xisaabiya fasallada `classes.classTeacherId`, ma aha `useClassOptions`.
import { useSchoolData } from '../context/SchoolDataContext';

export function classroomName(cls) {
  return `${cls.grade}${cls.section}`;
}

// currentValue: string kaliya (StudentFormModal) — haddii qiimaha/qiyamka
// hadda la doortay aanay ku jirin liiska fasallada firfircoon (fasal la
// tirtiray), waxaa lagu darayaa sida ikhtiyaar dheeraad ah si aan xogta
// la lumin.
//
// byId: haddii `true` la dhigo, `value`-ga ikhtiyaar kastaa wuxuu noqonayaa
// `cls.id` DHAB AH (xiriirka classId, fiiri StudentFormModal.jsx) halkii uu
// ahaan lahaa qoraalka classroomName.
export function useClassOptions(currentValue, { byId = false } = {}) {
  const { classes } = useSchoolData();
  const options = classes.map((c) => ({
    value: byId ? c.id : classroomName(c),
    label: `${c.grade} - ${c.section}`,
  }));

  const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
  currentValues.filter(Boolean).forEach((v) => {
    if (!options.some((o) => o.value === v)) {
      const orphanCls = byId ? classes.find((c) => c.id === v) : null;
      options.unshift({ value: v, label: orphanCls ? classroomName(orphanCls) : v });
    }
  });

  return options;
}
