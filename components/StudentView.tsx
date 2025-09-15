
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Course, Feedback } from '../types';
import { api } from '../services/mockApi';
import { Button, Card, Spinner, Select, Textarea, Modal, Rating, Pagination } from './ui';
import { AuthContext } from '../App';

type StudentTab = 'feedback' | 'courses';
const ITEMS_PER_PAGE = 5;

const FeedbackForm: React.FC<{ courses: Course[]; onFeedbackSubmitted: (feedback: Feedback) => void; initialFeedback?: Feedback | null; onDone: () => void; }> = ({ courses, onFeedbackSubmitted, initialFeedback, onDone }) => {
    const { user } = useContext(AuthContext);
    const [courseId, setCourseId] = useState(initialFeedback?.courseId || (courses.length > 0 ? courses[0].id : ''));
    const [rating, setRating] = useState(initialFeedback?.rating || 0);
    const [message, setMessage] = useState(initialFeedback?.message || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId || rating === 0 || !message || !user) return;
        setLoading(true);
        try {
            const feedbackData = { studentId: user.id, studentName: user.name, courseId, rating, message };
            const submittedFeedback = initialFeedback 
                ? await api.updateFeedback(initialFeedback.id, feedbackData) 
                : await api.addFeedback(feedbackData);
            onFeedbackSubmitted(submittedFeedback);
            onDone();
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Course" value={courseId} onChange={e => setCourseId(e.target.value)} required>
                {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
            </Select>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rating</label>
                <Rating count={5} rating={rating} onRating={setRating} />
            </div>
            <Textarea label="Feedback Message" value={message} onChange={e => setMessage(e.target.value)} rows={4} required/>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? <Spinner/> : (initialFeedback ? 'Update' : 'Submit')}</Button>
            </div>
        </form>
    );
};

const FeedbackTab: React.FC<{courses: Course[]}> = ({ courses }) => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchFeedback = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const feedbackResponse = await api.getStudentFeedback(user.id, currentPage, ITEMS_PER_PAGE);
            setFeedbacks(feedbackResponse.data);
            setTotalPages(feedbackResponse.totalPages);
        } catch (error) {
            console.error("Failed to fetch feedback", error);
        } finally {
            setLoading(false);
        }
    }, [user, currentPage]);
    
    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleFeedbackSubmitted = () => {
        if (!editingFeedback) {
            setCurrentPage(1); 
            fetchFeedback();
        } else {
            fetchFeedback();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            await api.deleteFeedback(id);
            if (feedbacks.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchFeedback();
            }
        }
    };

    const openEditModal = (feedback: Feedback) => {
        setEditingFeedback(feedback);
        setIsModalOpen(true);
    };

    const openNewFeedbackModal = () => {
        setEditingFeedback(null);
        setIsModalOpen(true);
    }
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingFeedback(null);
    }

    const getCourseName = (id: string) => courses.find(c => c.id === id)?.name || 'Unknown Course';

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Feedback</h2>
                <Button onClick={openNewFeedbackModal}>Submit New Feedback</Button>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingFeedback ? "Edit Feedback" : "Submit Feedback"}>
                <FeedbackForm 
                    courses={courses} 
                    onFeedbackSubmitted={handleFeedbackSubmitted} 
                    initialFeedback={editingFeedback} 
                    onDone={closeModal} 
                />
            </Modal>

            {loading ? (
                <div className="flex justify-center mt-10"><Spinner /></div>
            ) : feedbacks.length === 0 ? (
                <Card className="text-center p-8">
                    <p className="text-slate-500 dark:text-slate-400">You haven't submitted any feedback yet.</p>
                </Card>
            ) : (
                <Card>
                    <div className="space-y-4">
                        {feedbacks.map(feedback => (
                            <div key={feedback.id} className="p-4 border-b dark:border-slate-700 last:border-b-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{getCourseName(feedback.courseId)}</h3>
                                        <div className="flex items-center my-1">
                                            <Rating count={5} rating={feedback.rating} onRating={() => {}} />
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{feedback.message}</p>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0 ml-4">
                                         <p className="text-xs text-slate-400 mb-2">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                                         <div className="flex gap-2">
                                            <Button variant="secondary" onClick={() => openEditModal(feedback)}>Edit</Button>
                                            <Button variant="danger" onClick={() => handleDelete(feedback.id)}>Delete</Button>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </Card>
            )}
        </div>
    )
}

const CoursesTab: React.FC<{courses: Course[]}> = ({ courses }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Browse Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <Card key={course.id} className="flex flex-col">
                        <img src={course.thumbnail || 'https://picsum.photos/400/200'} alt={course.name} className="w-full h-40 object-cover" />
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{course.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex-grow">{course.description}</p>
                             <div className="mt-4">
                                <a href={course.link} target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full">Visit Course</Button>
                                </a>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}


export const StudentView: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeTab, setActiveTab] = useState<StudentTab>('courses');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const courseData = await api.getCourses();
                setCourses(courseData);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            }
        };
        fetchCourses();
    }, []);
    
    const TabButton: React.FC<{tab: StudentTab, children: React.ReactNode}> = ({tab, children}) => {
        const isActive = activeTab === tab;
        return <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{children}</button>
    };


    return (
        <div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tab="feedback">My Feedback</TabButton>
                    <TabButton tab="courses">Browse Courses</TabButton>
                </nav>
            </div>
            {activeTab === 'feedback' && <FeedbackTab courses={courses} />}
            {activeTab === 'courses' && <CoursesTab courses={courses} />}
        </div>
    );
};
