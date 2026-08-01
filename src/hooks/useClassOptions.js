// Liiska ikhtiyaarrada fasallada ee dropdown-yada (StudentFormModal,
// TeacherFormModal, iwm) — ka soo saaraa xogta DHAB AH ee collection-ka
// "classes" (real-time, via SchoolDataContext), si aan loo isku celcelin
// (duplicate) habka isku xirka fasal+arday/macallin.
import { useSchoolData } from '../context/SchoolDataContext';

// Isla format-ka `ClassWorkspace.jsx` isticmaalo (classroomName = grade+section)
// ee ku shubma xogta `className`/`assignedClasses` — waa in la isku ekaado si
// xiriirka fasalka la doortay iyo fasalka dhabta ah ay isugu xirmaan.
export function classroomName(cls) {
  return `${cls.grade}${cls.section}`;
}

// currentValue: string kaliya (StudentFormModal) ama array (TeacherFormModal) —
// haddii qiimaha/qiyamka hadda la doortay aanay ku jirin liiska fasallada
// firfircoon (fasal la tirtiray), waxaa lagu darayaa sida ikhtiyaar dheeraad
// ah si aan xogta la lumin.
export function useClassOptions(currentValue) {
  const { classes } = useSchoolData();
  const options = classes.map((c) => ({ value: classroomName(c), label: `${c.grade} - ${c.section}` }));

  const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
  currentValues.filter(Boolean).forEach((v) => {
    if (!options.some((o) => o.value === v)) options.unshift({ value: v, label: v });
  });

  return options;
}
