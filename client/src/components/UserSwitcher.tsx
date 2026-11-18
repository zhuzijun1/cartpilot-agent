import type { User } from "../types";

interface Props {
  users: User[];
  value: string;
  onChange: (id: string) => void;
}

export default function UserSwitcher({ users, value, onChange }: Props) {
  return (
    <label className="user-switcher">
      <span className="user-avatar">{users.find((u) => u.id === value)?.name.slice(0, 1) ?? "客"}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}（{u.id}）
          </option>
        ))}
        {users.length === 0 && <option value={value}>加载中…</option>}
      </select>
    </label>
  );
}
