import React, { useState, useEffect } from 'react';
import './StudentManagement.css';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [newStudent, setNewStudent] = useState({
        name: '',
        grade: '',
        school: '',
        parentName: '',
        parentEmail: '',
        phone: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: APIとの連携
        setStudents(prev => [...prev, { ...newStudent, id: Date.now() }]);
        setNewStudent({
            name: '',
            grade: '',
            school: '',
            parentName: '',
            parentEmail: '',
            phone: ''
        });
    };

    return (
        <div className="student-management">
            <h2>生徒管理</h2>
            
            {/* 新規生徒登録フォーム */}
            <form onSubmit={handleSubmit} className="student-form">
                <div className="form-group">
                    <label>生徒名</label>
                    <input
                        type="text"
                        name="name"
                        value={newStudent.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>学年</label>
                    <input
                        type="text"
                        name="grade"
                        value={newStudent.grade}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>学校</label>
                    <input
                        type="text"
                        name="school"
                        value={newStudent.school}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>保護者名</label>
                    <input
                        type="text"
                        name="parentName"
                        value={newStudent.parentName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>保護者メール</label>
                    <input
                        type="email"
                        name="parentEmail"
                        value={newStudent.parentEmail}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>電話番号</label>
                    <input
                        type="tel"
                        name="phone"
                        value={newStudent.phone}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <button type="submit">登録</button>
            </form>

            {/* 生徒一覧 */}
            <div className="student-list">
                <h3>登録済み生徒一覧</h3>
                <table>
                    <thead>
                        <tr>
                            <th>生徒名</th>
                            <th>学年</th>
                            <th>学校</th>
                            <th>保護者名</th>
                            <th>連絡先</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td>{student.name}</td>
                                <td>{student.grade}</td>
                                <td>{student.school}</td>
                                <td>{student.parentName}</td>
                                <td>{student.parentEmail}</td>
                                <td>
                                    <button onClick={() => {/* TODO: 編集機能 */}}>編集</button>
                                    <button onClick={() => {/* TODO: 削除機能 */}}>削除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentManagement; 