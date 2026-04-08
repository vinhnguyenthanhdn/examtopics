import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserStatus } from '../lib/user-service';
import type { UserProfile } from '../lib/user-service';
import '../styles/AdminPage.css';

interface AdminPageProps {
    onBack?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile; direction: 'asc' | 'desc' }>({
        key: 'pass_rate',
        direction: 'desc',
    });

    const loadUsers = async () => {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleToggleStatus = async (user: UserProfile) => {
        if (!user.is_approved) {
            if (!confirm(`Are you sure you want to approve access for ${user.email}?`)) {
                return;
            }
        }

        setActionLoading(user.id);
        const newStatus = !user.is_approved;
        const success = await updateUserStatus(user.id, newStatus);

        if (success) {
            setUsers(users.map(u =>
                u.id === user.id ? { ...u, is_approved: newStatus } : u
            ));
        }
        setActionLoading(null);
    };

    const handleSort = (key: keyof UserProfile) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getSortIndicator = (key: keyof UserProfile) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">User Management</h1>
                {onBack && (
                    <div style={{ display: 'none' }}></div>
                )}
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <div className="stat-value">{users.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {users.filter(u => !u.is_approved).length}
                    </div>
                    <div className="stat-label">Pending Approval</div>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                                Email {getSortIndicator('email')}
                            </th>
                            <th onClick={() => handleSort('correct_answers')} style={{ cursor: 'pointer' }}>
                                Correct {getSortIndicator('correct_answers')}
                            </th>
                            <th onClick={() => handleSort('wrong_answers')} style={{ cursor: 'pointer' }}>
                                Wrong {getSortIndicator('wrong_answers')}
                            </th>
                            <th onClick={() => handleSort('pass_rate')} style={{ cursor: 'pointer' }}>
                                Pass Rate {getSortIndicator('pass_rate')}
                            </th>
                            <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                                Role {getSortIndicator('role')}
                            </th>
                            <th onClick={() => handleSort('is_approved')} style={{ cursor: 'pointer' }}>
                                Status {getSortIndicator('is_approved')}
                            </th>
                            <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                                Joined {getSortIndicator('created_at')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.email}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className="stat-value correct">
                                        {user.correct_answers || 0}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className="stat-value wrong">
                                        {user.wrong_answers || 0}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`pass-rate ${(user.pass_rate || 0) >= 70 ? 'high' :
                                        (user.pass_rate || 0) >= 50 ? 'medium' : 'low'
                                        }`}>
                                        {(user.pass_rate || 0).toFixed(2)}%
                                    </span>
                                </td>
                                <td>
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.is_approved ? 'approved' : 'pending'}`}>
                                        {user.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    {new Date(user.created_at || '').toLocaleDateString()}
                                </td>
                                <td>
                                    <button
                                        className={`action-btn ${user.is_approved ? 'btn-revoke' : 'btn-approve'}`}
                                        onClick={() => handleToggleStatus(user)}
                                        disabled={actionLoading === user.id}
                                    >
                                        {user.is_approved ? 'Revoke' : 'Approve'}
                                    </button>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
