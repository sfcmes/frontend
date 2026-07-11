// [MES] SemStatusSelect — status <select> that renders Thai labels but emits caller's enum values.
import { SEM_STATUS } from 'src/components/mes/status-meta';

const SemStatusSelect = ({ id, name, value, onChange, onBlur, order, placeholder = 'เลือกสถานะ', className = 'mes-input' }) => (
  <select id={id} name={name} className={className} value={value} onChange={onChange} onBlur={onBlur}>
    <option value="">{placeholder}</option>
    {order.map((key) => (
      <option key={key} value={key}>{SEM_STATUS[key]?.th ?? key}</option>
    ))}
  </select>
);

export default SemStatusSelect;
