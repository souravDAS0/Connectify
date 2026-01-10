interface RoleBadgeProps {
  role: 'user' | 'admin';
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const styles = {
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    user: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[role]}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
