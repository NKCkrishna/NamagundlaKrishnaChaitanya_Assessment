
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Course, Feedback, User, Role } from '../types';
import { api } from '../services/mockApi';
import { Button, Card, Spinner, Select, Modal, Input, Textarea, Pagination } from './ui';

type AdminTab = 'dashboard' | 'feedback' | 'students' | 'courses';

// Dashboard Tab
const DashboardTab: React.FC = () => {
    const [stats, setStats] = useState<{ studentCount: number; feedbackCount: number; courseCount: number } | null>(null);
    const [courseRatings, setCourseRatings] = useState<{ name: string; avgRating: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, ratingsData] = await Promise.all([
                    api.getDashboardStats(),
                    api.getCourseRatings(),
                ]);
                setStats(statsData);
                setCourseRatings(ratingsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (!stats) return <p>Could not load dashboard data.</p>;
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4"><h3 className="font-semibold text-slate-500">Total Students</h3><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.studentCount}</p></Card>
                <Card className="p-4"><h3 className="font-semibold text-slate-500">Total Feedback</h3><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.feedbackCount}</p></Card>
                <Card className="p-4"><h3 className="font-semibold text-slate-500">Total Courses</h3><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.courseCount}</p></Card>
            </div>
            <Card className="p-4">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Average Course Ratings</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={courseRatings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]}/>
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgRating" fill="#4f46e5" name="Average Rating" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

// Feedback Tab
const FeedbackTab: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    
    const [filterCourse, setFilterCourse] = useState('');
    const [filterRating, setFilterRating] = useState('');
    
    useEffect(() => {
        const fetchCourses = async () => {
            const courseData = await api.getCourses();
            setCourses(courseData);
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        const fetchFeedback = async () => {
            setLoading(true);
            const response = await api.getAllFeedback(currentPage, 10, {
                courseId: filterCourse || undefined,
                rating: filterRating ? parseInt(filterRating) : undefined,
            });
            setFeedbacks(response.data);
            setTotalPages(response.totalPages);
            setLoading(false);
        };
        fetchFeedback();
    }, [currentPage, filterCourse, filterRating]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCourse, filterRating]);

    const exportToCSV = async () => {
        // Fetch all filtered feedback without pagination
        const response = await api.getAllFeedback(1, Infinity, {
            courseId: filterCourse || undefined,
            rating: filterRating ? parseInt(filterRating) : undefined,
        });
        
        const headers = ["ID", "Student Name", "Course", "Rating", "Message", "Date"];
        const rows = response.data.map(f => [
            f.id,
            f.studentName,
            courses.find(c => c.id === f.courseId)?.name || 'N/A',
            f.rating,
            `"${f.message.replace(/"/g, '""')}"`,
            f.createdAt.toISOString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "feedback_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <div className="p-4 border-b dark:border-slate-700">
                <div className="flex flex-wrap gap-4 items-center">
                    <Select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-48"><option value="">All Courses</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                    <Select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="w-32"><option value="">All Ratings</option>{[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}</Select>
                    <Button onClick={exportToCSV}>Export to CSV</Button>
                </div>
            </div>
            {loading ? <div className="flex justify-center p-8"><Spinner/></div> :
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-6 py-3">Student</th><th className="px-6 py-3">Course</th><th className="px-6 py-3">Rating</th><th className="px-6 py-3">Message</th><th className="px-6 py-3">Date</th></tr></thead>
                    <tbody>
                        {feedbacks.map(f => (
                             <tr key={f.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                                <td className="px-6 py-4">{f.studentName}</td>
                                <td className="px-6 py-4">{courses.find(c => c.id === f.courseId)?.name}</td>
                                <td className="px-6 py-4">{f.rating}/5</td>
                                <td className="px-6 py-4 max-w-sm truncate">{f.message}</td>
                                <td className="px-6 py-4">{new Date(f.createdAt).toLocaleDateString()}</td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Card>
    );
};

// Students Tab
const StudentsTab: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const response = await api.getUsers(currentPage);
        setUsers(response.data);
        setTotalPages(response.totalPages);
        setLoading(false);
    }, [currentPage]);
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleToggleBlock = async (user: User) => {
        await api.updateUserStatus(user.id, !user.isBlocked);
        fetchUsers();
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Are you sure? This will delete the user and all their feedback.')) {
            await api.deleteUser(id);
             if (users.filter(u => u.role === Role.STUDENT).length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchUsers();
            }
        }
    }
    
    return (
        <Card>
            {loading ? <div className="flex justify-center p-8"><Spinner/></div> :
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
                    <tbody>
                        {users.filter(u=>u.role === Role.STUDENT).map(user => (
                             <tr key={user.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                                <td className="px-6 py-4">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.isBlocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span></td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Button variant={user.isBlocked ? 'secondary' : 'primary'} onClick={() => handleToggleBlock(user)}>{user.isBlocked ? 'Unblock' : 'Block'}</Button>
                                    <Button variant="danger" onClick={() => handleDelete(user.id)}>Delete</Button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Card>
    );
};

// Courses Tab
const CoursesTab: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [thumbnail, setThumbnail] = useState('');

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const data = await api.getCourses();
        setCourses(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const openModal = (course: Course | null) => {
        setEditingCourse(course);
        setName(course?.name || '');
        setDescription(course?.description || '');
        setLink(course?.link || '');
        setThumbnail(course?.thumbnail || '');
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const courseData = { name, description, link, thumbnail };
        if (editingCourse) {
            const updatedCourse = await api.updateCourse(editingCourse.id, courseData);
            setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        } else {
            const newCourse = await api.addCourse(courseData);
            setCourses([newCourse, ...courses]);
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this course?')) {
            await api.deleteCourse(id);
            setCourses(courses.filter(c => c.id !== id));
        }
    }

    return (
        <Card>
            <div className="p-4 border-b dark:border-slate-700 flex justify-end"><Button onClick={() => openModal(null)}>Add New Course</Button></div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCourse ? "Edit Course" : "Add Course"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Course Name" value={name} onChange={e => setName(e.target.value)} required />
                    <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                    <Input label="Course Link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com/course" />
                    <Input label="Thumbnail URL" type="url" value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://example.com/image.png" />
                    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit">Save</Button></div>
                </form>
            </Modal>
            {loading ? <div className="flex justify-center p-8"><Spinner/></div> :
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-6 py-3">Thumbnail</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Description</th><th className="px-6 py-3">Actions</th></tr></thead>
                    <tbody>
                        {courses.map(course => (
                             <tr key={course.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                                <td className="px-6 py-4">
                                    <img src={course.thumbnail || 'https://via.placeholder.com/100x50'} alt={course.name} className="w-24 h-12 object-cover rounded" />
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    <a href={course.link} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">{course.name}</a>
                                </td>
                                <td className="px-6 py-4 max-w-md truncate">{course.description}</td>
                                <td className="px-6 py-4 flex gap-2"><Button variant="secondary" onClick={() => openModal(course)}>Edit</Button><Button variant="danger" onClick={() => handleDelete(course.id)}>Delete</Button></td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
        </Card>
    );
};

export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    
    const TabButton: React.FC<{tab: AdminTab, children: React.ReactNode}> = ({tab, children}) => {
        const isActive = activeTab === tab;
        return <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{children}</button>
    };

    return (
        <div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tab="dashboard">Dashboard</TabButton>
                    <TabButton tab="feedback">Feedback</TabButton>
                    <TabButton tab="students">Students</TabButton>
                    <TabButton tab="courses">Courses</TabButton>
                </nav>
            </div>

            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'feedback' && <FeedbackTab />}
            {activeTab === 'students' && <StudentsTab />}
            {activeTab === 'courses' && <CoursesTab />}
        </div>
    );
};