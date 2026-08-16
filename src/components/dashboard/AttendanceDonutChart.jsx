import { PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import './AttendanceDonutChart.css';

const SEGMENT_COLORS = [
  { key: 'present', color: '#16C784' },
  { key: 'absent', color: 'var(--danger)' },
  { key: 'leave', color: 'var(--warning)' },
];

function AttendanceDonutChart({ present, absent, leave }) {
  const { t } = useTranslation();
  const counts = { present, absent, leave };
  const total = present + absent + leave;
  const data = SEGMENT_COLORS.map((s) => ({ ...s, label: t(`donutChart.${s.key}`), value: counts[s.key] }));

  return (
    <div className="adc-wrap">
      <div className="adc-chart">
        <PieChart width={188} height={188}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="adc-center">
          <div className="adc-center-value">{total}</div>
          <div className="adc-center-label">{t('donutChart.centerLabel')}</div>
        </div>
      </div>

      <div className="adc-legend">
        {data.map((d) => (
          <div className="adc-legend-row" key={d.key}>
            <span className="adc-legend-dot" style={{ background: d.color }}></span>
            <span className="adc-legend-label">{d.label} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceDonutChart;
